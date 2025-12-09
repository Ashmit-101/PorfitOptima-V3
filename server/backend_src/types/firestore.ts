export type ScrapeJobStatus = "queued" | "running" | "succeeded" | "failed";

export interface ScrapeJobDoc {
  jobId: string;
  productId: string;
  urls: string[];
  fxRates?: Record<string, number>;
  status: ScrapeJobStatus;
  attempts: number;
  priority?: number;
  retryAt?: unknown;
  lastError?: string | null;
  snapshotId?: string;
  createdAt: FirebaseFirestore.Timestamp | null;
  updatedAt: FirebaseFirestore.Timestamp | null;
}

export type CompetitorStatus = "succeeded" | "failed";

export interface CompetitorEntry {
  hostname: string;
  url: string;
  rawPriceText: string | null;
  parsedPriceUsd: number | null;
  currency: string | null;
  status: CompetitorStatus;
  errorReason?: string;
  notes?: string;
  scrapedAt: FirebaseFirestore.Timestamp;
}

export type PricingStatus = "pending" | "processing" | "completed" | "failed";

export interface CompetitorSnapshotDoc {
  snapshotId: string;
  productId: string;
  jobId: string;
  scrapedAt: FirebaseFirestore.Timestamp;
  scrapeLatencyMs: number;
  competitors: CompetitorEntry[];
  stats: {
    successCount: number;
    failureCount: number;
    domains: Record<string, number>;
  };
  pricingStatus: PricingStatus;
  pricingInsightId?: string;
  lastError?: string | null;
}

export interface PricingInsightDoc {
  insightId: string;
  productId: string;
  snapshotId: string;
  strategySource: "ai" | "rule_based";
  recommendedPrice: number;
  priceBand: [number, number];
  expectedMargin: number;
  rationale: string;
  dataSources: string[];
  fallbackReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface ProductDoc {
  basicInfo?: {
    name?: string;
    description?: string;
    sku?: string;
    brand?: string;
    category?: string;
    attributes?: Record<string, unknown>;
  };
  costStructure?: Record<string, number>;
  pricing?: Record<string, unknown> & { sellingPrice?: number; msrp?: number; history?: unknown[] };
  inventory?: { onHand?: number };
  analytics?: { forecast?: unknown };
}
