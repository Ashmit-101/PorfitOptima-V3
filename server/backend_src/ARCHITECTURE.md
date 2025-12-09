# Pricing Workflow Refactor

## Overview

The refactored workflow pushes expensive scraping and pricing operations into background workers. The HTTP API only enqueues jobs, serves status/results, and applies operator-approved prices. The flow is:

```
Client → POST /api/products/:id/sync
       → Firestore scrapeJobs document
       → Python scraper worker (Playwright)
       → competitorSnapshots document
       → Pricing worker (OpenAI + fallback)
       → pricingInsights document
       → GET /api/products/:id/status (UI)
```

## Firestore schema

### scrapeJobs

| Field        | Type    | Notes                                                   |
|--------------|---------|---------------------------------------------------------|
| jobId        | string  | Document id                                             |
| productId    | string  | Target product                                          |
| urls         | string[]| Competitor URLs                                         |
| fxRates      | map     | Optional currency rates                                 |
| status       | string  | queued → running → succeeded/failed                     |
| attempts     | number  | Incremented per worker try                              |
| createdAt    | ts      | serverTimestamp                                         |
| updatedAt    | ts      | serverTimestamp                                         |
| lastError    | string? | failure summary                                         |
| snapshotId   | string? | competitor snapshot id (filled on success)              |
| priority     | number  | optional scheduling weight                              |
| retryAt      | ts?     | set when a worker wants a cool-off                      |

### competitorSnapshots

| Field             | Type        | Notes                                  |
|-------------------|-------------|----------------------------------------|
| snapshotId        | string      | Document id                            |
| productId         | string      | Reference to product document          |
| jobId             | string      | Source job                             |
| scrapedAt         | timestamp   | When scraping finished                 |
| scrapeLatencyMs   | number      | Duration metrics                       |
| competitors       | array       | See below                              |
| stats             | map         | successCount, failureCount, domains    |
| pricingStatus     | string      | pending → processing → completed       |
| pricingInsightId  | string?     | set when pricing worker succeeds       |
| lastError         | string?     | pricing failure reason                 |

Competitor entries
```
{
  hostname: string,
  url: string,
  rawPriceText: string | null,
  parsedPriceUsd: number | null,
  currency: string | null,
  status: "succeeded" | "failed",
  errorReason?: "bot_protection" | "timeout" | "no_price_found" | "unsupported" | ...,
  notes?: string,
  scrapedAt: timestamp
}
```

### pricingInsights

| Field            | Type      | Notes                                            |
|------------------|-----------|--------------------------------------------------|
| insightId        | string    | Document id                                      |
| productId        | string    | Reference                                        |
| snapshotId       | string    | Source snapshot                                  |
| strategySource   | string    | "ai" or "rule_based"                             |
| recommendedPrice | number    |                                                  |
| priceBand        | [number,number] |                                            |
| expectedMargin   | number    | percent                                          |
| rationale        | string    | explanation                                      |
| dataSources      | string[]  | urls/strings                                     |
| fallbackReason   | string?   | if AI unreachable/invalid                        |
| metadata         | map       | { aiModel, callLatencyMs, fallbackUsed }         |
| createdAt        | ts        |                                                  |
| updatedAt        | ts        |                                                  |

## Components

### Express API (Node/TypeScript)

- `POST /api/products/:id/sync`
  - Validates URLs, ensures product exists
  - Creates queued job document
  - Returns `{ jobId, status: "queued" }`
- `GET /api/products/:id/status`
  - Reads latest competitor snapshot + pricing insight
  - Responds with normalized payload for UI
- `POST /api/products/:id/price`
  - Applies operator-selected price to product document

Supporting modules:

- `lib/firebaseAdmin.ts` – singleton admin SDK
- `services/jobQueue.ts` – enqueue helper
- `services/productStatus.ts` – snapshot + insight lookups
- `pricing/schema.ts` – shared Zod validation + payload builder
- `pricing/fallback.ts` – rule-based backup strategy
- `logging/logger.ts` – structured console logging
- `metrics/metrics.ts` – no-op hooks that can push to StatsD/OTEL later

### Scraper worker (Python + Playwright)

- `scraper_worker/worker.py`
  - Polls Firestore `scrapeJobs` for `status == queued`
  - Atomically flips job to `running`, records attempt
  - Uses Playwright Chromium to open each URL with realistic headers
  - Handles SPA loading (`wait_for_load_state("networkidle")`, selectors)
  - Can click cookie/consent banners using domain config (`domains.py`)
  - Extracts price text via per-domain selectors (`domain_strategies.py`) or fallback text search
  - Normalizes currency → USD using job-provided FX rates + ISO detection
  - Writes snapshot document + updates job status on success/failure
  - Emits structured logs + basic metrics (latency + reason counts)

Files:
- `scraper_worker/queue.py` – Firestore helpers + locking
- `scraper_worker/browser.py` – Playwright session management
- `scraper_worker/domains.py` – selectors + cookie banners per host
- `scraper_worker/price_parser.py` – price + currency parsing
- `scraper_worker/logging_utils.py` – JSON logging helper
- `scraper_worker/requirements.txt`

### Pricing worker (Node/TypeScript)

- `workers/pricingWorker.ts`
  - Polls `competitorSnapshots` for `pricingStatus == "pending"`
  - Fetches product data & competitor USD prices
  - Builds payload for OpenAI once per snapshot
  - Validates AI response via shared Zod schema
  - Writes `pricingInsights` document, updates snapshot pricingStatus
  - On AI failure/timeouts/invalid JSON, computes fallback recommendation:
    - Uses product totalCost, median competitor price
    - Targets configurable margin band (env: `FALLBACK_TARGET_MARGIN`) and respects competitor IQR
  - Emits metrics for AI latency, validation errors, fallback usage

### Logging & Metrics

- `logging/logger.ts` exposes `log.info/debug/error(domain, message, fields?)`
- `metrics/index.ts` exposes `trackHistogram(name, value, tags?)`, `incrementCounter(name, tags?)`
- Workers call these hooks for visibility. In development they log to console.

## Operations

- API server: `npm run dev` (ts-node/tsx) or `npm run build && npm start`
- Pricing worker: `npm run pricing-worker`
- Python scraper worker: `python -m venv .venv && pip install -r requirements.txt && python main.py`

Persistent cookie jar lives in `server/workers/scraper_worker/.storage/` and can be mounted in containers.

## Error Handling

- Scraper marks per-URL failures with `status: "failed"` and `errorReason`
- Job failure threshold configurable via `SCRAPER_MAX_ATTEMPTS`
- Pricing worker surfaces AI errors and records fallback metadata, allowing UI to show reason.

## Extensibility

- New domains only require entries in `domains.py` selectors + cookie banner definitions
- More pricing strategies can be registered in `pricing/fallback.ts`
- Queue layer can be swapped by implementing the same interface in `services/jobQueue.ts`
