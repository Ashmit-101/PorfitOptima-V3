import { getFirestore, getServerTimestamp } from "../lib/firebaseAdmin.js";
import { logger } from "../logging/logger.js";
import type { ScrapeJobDoc } from "../types/firestore.js";

const JOB_COLLECTION = "scrapeJobs";

export interface EnqueueJobParams {
  productId: string;
  urls: string[];
  fxRates?: Record<string, number>;
  priority?: number;
}

export interface EnqueueJobResult {
  jobId: string;
  status: ScrapeJobDoc["status"];
}

function sanitizeUrls(urls: string[]) {
  const seen = new Set<string>();
  const valid: string[] = [];

  for (const raw of urls) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    try {
      const parsed = new URL(trimmed);
      if (seen.has(parsed.href)) continue;
      seen.add(parsed.href);
      valid.push(parsed.href);
    } catch {
      logger.warn("jobQueue", "Invalid URL skipped", { url: trimmed });
    }
  }

  return valid;
}

export async function enqueueScrapeJob(params: EnqueueJobParams): Promise<EnqueueJobResult> {
  const db = getFirestore();
  const urls = sanitizeUrls(params.urls);
  if (urls.length === 0) {
    throw new Error("At least one valid URL is required");
  }

  const jobRef = db.collection(JOB_COLLECTION).doc();
  const now = getServerTimestamp();

  const payload: Omit<ScrapeJobDoc, "createdAt" | "updatedAt" | "snapshotId"> = {
    jobId: jobRef.id,
    productId: params.productId,
    urls,
    fxRates: params.fxRates ?? {},
    status: "queued",
    attempts: 0,
    priority: params.priority ?? 0,
    retryAt: null,
    lastError: null,
  };

  await jobRef.set({
    ...payload,
    createdAt: now,
    updatedAt: now
  } as ScrapeJobDoc);

  logger.info("jobQueue", "Scrape job enqueued", { jobId: jobRef.id, productId: params.productId, urlCount: urls.length });

  return { jobId: jobRef.id, status: "queued" };
}

export { JOB_COLLECTION };
