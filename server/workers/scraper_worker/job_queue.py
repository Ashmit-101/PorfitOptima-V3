from __future__ import annotations

import os
from dataclasses import dataclass
from typing import List, Optional

from google.cloud import firestore

from logging_utils import info, warn


SCRAPE_JOBS_COLLECTION = os.getenv("SCRAPE_JOBS_COLLECTION", "scrapeJobs")
SNAPSHOTS_COLLECTION = os.getenv("SNAPSHOTS_COLLECTION", "competitorSnapshots")


@dataclass
class ScrapeJob:
    job_id: str
    product_id: str
    urls: List[str]
    fx_rates: dict


def get_client() -> firestore.Client:
    return firestore.Client()


def lease_next_job() -> Optional[ScrapeJob]:
    client = get_client()
    jobs_ref = client.collection(SCRAPE_JOBS_COLLECTION)

    # very simple lease: first queued job
    docs = (
        jobs_ref.where("status", "==", "queued")
        .order_by("createdAt")
        .limit(1)
        .stream()
    )

    doc_list = list(docs)
    if not doc_list:
        return None

    doc = doc_list[0]

    @firestore.transactional
    def _tx(tx: firestore.Transaction):
        snap = doc.reference.get(transaction=tx)
        data = snap.to_dict()
        if data.get("status") != "queued":
            return None
        tx.update(doc.reference, {"status": "running", "attempts": data.get("attempts", 0) + 1})
        return data

    tx = client.transaction()
    snap = _tx(tx)
    if not snap:
        return None

    info("queue", "leased_job", job_id=doc.id, product_id=snap.get("productId"))
    return ScrapeJob(
        job_id=doc.id,
        product_id=snap.get("productId"),
        urls=list(snap.get("urls", [])),
        fx_rates=dict(snap.get("fxRates", {})),
    )


def complete_job_success(job: ScrapeJob, snapshot_id: str) -> None:
    client = get_client()
    ref = client.collection(SCRAPE_JOBS_COLLECTION).document(job.job_id)
    ref.update({"status": "succeeded", "snapshotId": snapshot_id})
    info("queue", "job_succeeded", job_id=job.job_id, snapshot_id=snapshot_id)


def complete_job_failure(job: ScrapeJob, reason: str) -> None:
    client = get_client()
    ref = client.collection(SCRAPE_JOBS_COLLECTION).document(job.job_id)
    ref.update({"status": "failed", "lastError": reason})
    warn("queue", "job_failed", job_id=job.job_id, reason=reason)
