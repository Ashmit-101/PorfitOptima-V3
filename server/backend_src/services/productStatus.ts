import { getFirestore } from "../lib/firebaseAdmin.js";
import type { CompetitorSnapshotDoc, PricingInsightDoc, ProductDoc } from "../types/firestore.js";

const SNAPSHOT_COLLECTION = "competitorSnapshots";
const INSIGHT_COLLECTION = "pricingInsights";

export async function getLatestSnapshot(productId: string): Promise<CompetitorSnapshotDoc | null> {
  const db = getFirestore();
  const snapshots = await db
    .collection(SNAPSHOT_COLLECTION)
    .where("productId", "==", productId)
    .orderBy("scrapedAt", "desc")
    .limit(1)
    .get();

  if (snapshots.empty) {
    return null;
  }

  return snapshots.docs[0].data() as CompetitorSnapshotDoc;
}

export async function getLatestInsight(productId: string): Promise<PricingInsightDoc | null> {
  const db = getFirestore();
  const insights = await db
    .collection(INSIGHT_COLLECTION)
    .where("productId", "==", productId)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (insights.empty) {
    return null;
  }

  return insights.docs[0].data() as PricingInsightDoc;
}

export async function getProductById(productId: string): Promise<ProductDoc | null> {
  const db = getFirestore();
  const doc = await db.collection("products").doc(productId).get();
  if (!doc.exists) {
    return null;
  }
  return doc.data() as ProductDoc;
}
