import type { CompetitorSnapshotDoc, ProductDoc } from "../types/firestore.js";

export interface PricingPayload {
  productName: string;
  productDescription: string;
  sku: string;
  brand: string;
  category: string;
  attributes: Record<string, unknown>;
  totalCost: number;
  msrp: number | null;
  currentPrice: number;
  currentMargin: number;
  historicalPrices: unknown[];
  currentInventory: number | null;
  demandForecast: unknown;
  competitorUsdPrices: number[];
  competitorNames: string[];
  competitorUrls: string[];
}

function computeTotalCost(costStructure?: Record<string, number>) {
  if (!costStructure) return 0;
  return Object.values(costStructure).reduce((sum, value) => sum + Number(value ?? 0), 0);
}

export function buildPricingPayload(product: ProductDoc, snapshot: CompetitorSnapshotDoc): PricingPayload {
  const totalCost = computeTotalCost(product.costStructure);
  const currentPrice = Number(product.pricing?.sellingPrice ?? 0);
  const margin = currentPrice > 0 ? ((currentPrice - totalCost) / currentPrice) * 100 : 0;
  const competitors = (snapshot.competitors ?? []).filter((c) => typeof c.parsedPriceUsd === "number");

  return {
    productName: product.basicInfo?.name ?? "Unnamed",
    productDescription: product.basicInfo?.description ?? "",
    sku: product.basicInfo?.sku ?? "",
    brand: product.basicInfo?.brand ?? "",
    category: product.basicInfo?.category ?? "Uncategorized",
    attributes: product.basicInfo?.attributes ?? {},
    totalCost,
    msrp: product.pricing?.msrp ? Number(product.pricing.msrp) : null,
    currentPrice,
    currentMargin: Number(margin.toFixed(2)),
    historicalPrices: product.pricing?.history ?? [],
    currentInventory: product.inventory?.onHand ?? null,
    demandForecast: product.analytics?.forecast ?? null,
    competitorUsdPrices: competitors.map((c) => Number(c.parsedPriceUsd ?? 0)),
    competitorNames: competitors.map((c) => c.hostname),
    competitorUrls: competitors.map((c) => c.url)
  };
}
