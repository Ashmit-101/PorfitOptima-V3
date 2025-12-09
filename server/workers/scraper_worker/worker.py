from __future__ import annotations

import asyncio
import os
import time
from datetime import datetime, timezone
from typing import Any, Dict, List

from google.cloud import firestore
from playwright.async_api import async_playwright, Browser, Page

from domains import get_domain_config
from logging_utils import error, info, warn
from price_parser import extract_price_and_currency, normalize_to_usd
from job_queue import SCRAPE_JOBS_COLLECTION, SNAPSHOTS_COLLECTION, ScrapeJob, complete_job_failure, complete_job_success, lease_next_job, get_client


USER_AGENT = os.getenv(
    "SCRAPER_USER_AGENT",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
)

MAX_TIMEOUT_MS = int(os.getenv("SCRAPER_TIMEOUT_MS", "30000"))
POLL_INTERVAL_SEC = float(os.getenv("SCRAPER_POLL_INTERVAL_SEC", "5"))


async def ensure_consent(page: Page, hostname: str) -> None:
    cfg = get_domain_config(hostname)
    selectors = (cfg.consent_selectors if cfg else []) + [
        "button#onetrust-accept-btn-handler",
        "button[aria-label='Accept all']",
    ]
    for selector in selectors:
        try:
            btn = await page.query_selector(selector)
            if btn:
                await btn.click()
                await page.wait_for_timeout(500)
                info("scraper", "clicked_consent", hostname=hostname, selector=selector)
                return
        except Exception:
            continue


async def extract_price_for_url(page: Page, url: str, fx_rates: dict) -> Dict[str, Any]:
    start = time.time()
    try:
        await page.goto(url, wait_until="networkidle", timeout=MAX_TIMEOUT_MS)
        hostname = page.url.split("//", 1)[-1].split("/", 1)[0]
        await ensure_consent(page, hostname)

        cfg = get_domain_config(hostname)
        raw_text = None

        if cfg and cfg.wait_selector:
            try:
                await page.wait_for_selector(cfg.wait_selector, timeout=MAX_TIMEOUT_MS // 2)
            except Exception:
                warn("scraper", "wait_selector_timeout", hostname=hostname, selector=cfg.wait_selector)

        selectors = cfg.price_selectors if cfg else [
            "meta[itemprop='price']",
            ".price",
            ".a-offscreen",
            "[data-test='price']",
        ]

        for selector in selectors:
            el = await page.query_selector(selector)
            if el:
                raw_text = await el.get_attribute("content") or await el.inner_text()
                if raw_text:
                    break

        if not raw_text:
            # last resort: look for $xx.xx in whole text
            body = await page.inner_text("body")
            raw_text = body

        amount, currency = extract_price_and_currency(raw_text or "")
        usd = normalize_to_usd(amount, currency, fx_rates)

        status = "succeeded" if usd is not None else "failed"
        error_reason = None if usd is not None else "no_price_found"

        return {
            "hostname": hostname,
            "url": page.url,
            "rawPriceText": raw_text,
            "parsedPriceUsd": usd,
            "currency": currency,
            "status": status,
            "errorReason": error_reason,
            "scrapedAt": datetime.now(timezone.utc),
            "latencyMs": int((time.time() - start) * 1000),
        }
    except Exception as exc:  # noqa: BLE001
        reason = "timeout" if "Timeout" in str(exc) else "bot_protection"
        status = "blocked" if reason == "bot_protection" else "failed"
        warn("scraper", "scrape_failed", url=url, reason=reason, status=status)
        return {
            "hostname": "",
            "url": url,
            "rawPriceText": None,
            "parsedPriceUsd": None,
            "currency": None,
            "status": status,
            "errorReason": reason,
            "scrapedAt": datetime.now(timezone.utc),
            "latencyMs": int((time.time() - start) * 1000),
        }


async def process_job(browser: Browser, job: ScrapeJob) -> None:
    client = get_client()
    info("scraper", "processing_job", job_id=job.job_id, product_id=job.product_id, url_count=len(job.urls))
    start = time.time()

    page = await browser.new_page(user_agent=USER_AGENT)
    results: List[Dict[str, Any]] = []

    try:
        for url in job.urls:
            await page.wait_for_timeout(500)
            result = await extract_price_for_url(page, url, job.fx_rates)
            results.append(result)

        success_count = sum(1 for r in results if r["status"] == "succeeded")
        blocked_count = sum(1 for r in results if r["status"] == "blocked")
        failure_count = len(results) - success_count - blocked_count
        domains: Dict[str, int] = {}
        for r in results:
            host = r.get("hostname") or ""  # type: ignore[assignment]
            if not host:
                continue
            domains[host] = domains.get(host, 0) + 1

        snapshots_ref = client.collection(SNAPSHOTS_COLLECTION)
        snap_doc = snapshots_ref.document()
        snapshot_payload: Dict[str, Any] = {
            "snapshotId": snap_doc.id,
            "productId": job.product_id,
            "jobId": job.job_id,
            "scrapedAt": datetime.now(timezone.utc),
            "scrapeLatencyMs": int((time.time() - start) * 1000),
            "competitors": results,
            "stats": {
                "successCount": success_count,
                "failureCount": failure_count,
                "blockedCount": blocked_count,
                "domains": domains,
            },
            "pricingStatus": "pending",
            "lastError": None,
        }

        snap_doc.set(snapshot_payload)
        complete_job_success(job, snap_doc.id)
        info("scraper", "job_completed", job_id=job.job_id, snapshot_id=snap_doc.id)
    except Exception as exc:  # noqa: BLE001
        error("scraper", "job_exception", job_id=job.job_id, error=str(exc))
        complete_job_failure(job, str(exc))
    finally:
        await page.close()


async def main_loop() -> None:
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        info("scraper", "worker_started")
        try:
            while True:
                job = lease_next_job()
                if not job:
                    await asyncio.sleep(POLL_INTERVAL_SEC)
                    continue

                await process_job(browser, job)
        finally:
            await browser.close()


if __name__ == "__main__":
    asyncio.run(main_loop())
