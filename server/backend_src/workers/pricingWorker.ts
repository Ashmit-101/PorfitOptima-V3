import "dotenv/config";
import { OpenAI } from "openai";
import { getFirestore, getServerTimestamp } from "../lib/firebaseAdmin.js";
import { logger } from "../logging/logger.js";
import { incrementCounter, recordHistogram } from "../metrics/index.js";
import { AiResponseSchema } from "../pricing/aiSchema.js";
import { buildPricingPayload } from "../pricing/payload.js";
import { buildFallbackRecommendation } from "../pricing/fallback.js";
import type { CompetitorSnapshotDoc, PricingInsightDoc, ProductDoc } from "../types/firestore.js";

const SNAPSHOT_COLLECTION = "competitorSnapshots";
const INSIGHT_COLLECTION = "pricingInsights";

const POLL_INTERVAL_MS = Number(process.env.PRICING_POLL_INTERVAL_MS ?? 5000);
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function fetchNextPendingSnapshot() {
  const db = getFirestore();
  const query = await db
    .collection(SNAPSHOT_COLLECTION)
    .where("pricingStatus", "==", "pending")
    .orderBy("scrapedAt", "asc")
    .limit(1)
    .get();

  if (query.empty) return null;

  const doc = query.docs[0];
  const snapshot = doc.data() as CompetitorSnapshotDoc;
  if (!snapshot.snapshotId) {
    // Ensure downstream writes have an ID field
    (snapshot as any).snapshotId = doc.id;
  }

  await doc.ref.update({ pricingStatus: "processing", updatedAt: getServerTimestamp() });
  return snapshot;
}

async function getProduct(productId: string): Promise<ProductDoc | null> {
  const db = getFirestore();
  const doc = await db.collection("products").doc(productId).get();
  if (!doc.exists) return null;
  return doc.data() as ProductDoc;
}

async function callOpenAi(payload: unknown) {
  const systemPrompt = [
    "You are an elite pricing strategist and market analyst tasked with producing reliable, verifiable insights.",
    "Always ground recommendations in real, current-market data sourced from the public web and the provided dataset.",
    "Return strictly valid JSON adhering to the provided schema.",
    "If you cannot access the web or have insufficient data, lower confidence and explain limitations.",
    "Never hallucinate URLs or prices."
  ].join("\n");

  const userPrompt = `Input JSON (use all fields):\n${JSON.stringify(payload, null, 2)}\n\nRespond with only JSON.`;

  const start = Date.now();
  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    const validated = AiResponseSchema.parse(parsed);
    const latency = Date.now() - start;
    recordHistogram("pricing.ai_latency_ms", latency);
    incrementCounter("pricing.ai_success");
    return validated;
  } catch (error) {
    const latency = Date.now() - start;
    recordHistogram("pricing.ai_latency_ms", latency);
    incrementCounter("pricing.ai_failure");
    throw error;
  }
}

async function writeInsight(snapshot: CompetitorSnapshotDoc, product: ProductDoc, source: "ai" | "rule_based", data: {
  recommendedPrice: number;
  priceBand: [number, number];
  expectedMargin: number;
  rationale: string;
  dataSources: string[];
  metadata?: Record<string, unknown>;
  fallbackReason?: string;
}) {
  const db = getFirestore();
  const insightRef = db.collection(INSIGHT_COLLECTION).doc();
  const now = getServerTimestamp();

  const doc: PricingInsightDoc = {
    insightId: insightRef.id,
    productId: snapshot.productId,
    snapshotId: snapshot.snapshotId,
    strategySource: source,
    recommendedPrice: data.recommendedPrice,
    priceBand: data.priceBand,
    expectedMargin: data.expectedMargin,
    rationale: data.rationale,
    dataSources: data.dataSources,
    fallbackReason: data.fallbackReason,
    metadata: {
      ...(data.metadata ?? {}),
      aiModel: OPENAI_MODEL,
      competitorCount: snapshot.competitors.length
    },
    createdAt: now as unknown as FirebaseFirestore.Timestamp,
    updatedAt: now as unknown as FirebaseFirestore.Timestamp
  };

  await insightRef.set(doc);
  await db
    .collection(SNAPSHOT_COLLECTION)
    .doc(snapshot.snapshotId)
    .update({ pricingStatus: "completed", pricingInsightId: insightRef.id, updatedAt: now });
}

async function processSnapshotOnce(snapshot: CompetitorSnapshotDoc) {
  const product = await getProduct(snapshot.productId);
  if (!product) {
    logger.warn("pricingWorker", "Product missing for snapshot", { snapshotId: snapshot.snapshotId, productId: snapshot.productId });
    const db = getFirestore();
    await db
      .collection(SNAPSHOT_COLLECTION)
      .doc(snapshot.snapshotId)
      .update({ pricingStatus: "failed", lastError: "product_not_found", updatedAt: getServerTimestamp() });
    incrementCounter("pricing.product_not_found");
    return;
  }

  const payload = buildPricingPayload(product, snapshot);

  try {
    const ai = await callOpenAi(payload);
    await writeInsight(snapshot, product, "ai", {
      recommendedPrice: ai.recommendedPrice,
      priceBand: [ai.priceBand[0], ai.priceBand[1]],
      expectedMargin: ai.expectedMargin,
      rationale: ai.rationale,
      dataSources: ai.dataSources,
      metadata: { confidence: ai.confidence }
    });
    logger.info("pricingWorker", "AI pricing insight written", { snapshotId: snapshot.snapshotId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.warn("pricingWorker", "AI pricing failed, falling back", { message, snapshotId: snapshot.snapshotId });
    incrementCounter("pricing.ai_error_fallback");

    const fallback = buildFallbackRecommendation(product, snapshot);
    await writeInsight(snapshot, product, "rule_based", {
      recommendedPrice: fallback.recommendedPrice,
      priceBand: fallback.priceBand,
      expectedMargin: fallback.expectedMargin,
      rationale: fallback.rationale,
      dataSources: fallback.dataSources,
      metadata: { strategy: fallback.strategy },
      fallbackReason: message
    });
  }
}

async function loop() {
  while (true) {
    try {
      const snapshot = await fetchNextPendingSnapshot();
      if (!snapshot) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        continue;
      }

      logger.info("pricingWorker", "Processing snapshot", { snapshotId: snapshot.snapshotId, productId: snapshot.productId });
      await processSnapshotOnce(snapshot);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("pricingWorker", "Unexpected error in loop", { message });
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }
}

// Auto-start the worker when run directly
logger.info("pricingWorker", "Starting pricing worker loop", {});
// eslint-disable-next-line @typescript-eslint/no-floating-promises
loop();
