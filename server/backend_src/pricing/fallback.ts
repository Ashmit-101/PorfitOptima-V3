import type { CompetitorSnapshotDoc, ProductDoc } from "../types/firestore.js";

export interface FallbackRecommendation {
  recommendedPrice: number;
  priceBand: [number, number];
  expectedMargin: number;
  rationale: string;
  dataSources: string[];
  strategy: "stay_competitive" | "maximize_profit" | "clear_inventory";
}

function quantiles(values: number[]) {
  if (values.length === 0) {
    return { q1: 0, median: 0, q3: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p: number) => {
    if (sorted.length === 1) return sorted[0];
    const pos = (sorted.length - 1) * p;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    }
    return sorted[base];
  };
  return {
    q1: index(0.25),
    median: index(0.5),
    q3: index(0.75)
  };
}

function computeTotalCost(costStructure?: Record<string, number>) {
  if (!costStructure) return 0;
  return Object.values(costStructure).reduce((sum, value) => sum + Number(value ?? 0), 0);
}

export function buildFallbackRecommendation(product: ProductDoc, snapshot: CompetitorSnapshotDoc): FallbackRecommendation {
  const competitorPrices = snapshot.competitors
    .map((c) => (typeof c.parsedPriceUsd === "number" ? c.parsedPriceUsd : null))
    .filter((price): price is number => price !== null && !Number.isNaN(price));

  const totalCost = computeTotalCost(product.costStructure);
  const desiredMargin = Number(process.env.FALLBACK_TARGET_MARGIN ?? 0.18);
  const minMargin = Number(process.env.FALLBACK_MIN_MARGIN ?? 0.1);

  const floorPrice = totalCost * (1 + desiredMargin);
  const { q1, median, q3 } = quantiles(competitorPrices);
  const iqr = q3 - q1;

  const competitiveCeiling = q3 || median || floorPrice;
  const recommendedPrice = Math.max(floorPrice, Math.min(competitiveCeiling, median || competitiveCeiling));

  const expectedMargin = totalCost > 0 ? ((recommendedPrice - totalCost) / totalCost) * 100 : 0;
  const safeMargin = Math.max(expectedMargin, minMargin * 100);

  const rationaleParts = [
    `Fallback strategy using competitor median $${median.toFixed(2) || "0.00"}`,
    `IQR=${iqr.toFixed(2) || "0.00"}`,
    `floor ensures >= ${(desiredMargin * 100).toFixed(1)}% margin`
  ];

  return {
    recommendedPrice: Number(recommendedPrice.toFixed(2)),
    priceBand: [Number((recommendedPrice * 0.97).toFixed(2)), Number((recommendedPrice * 1.03).toFixed(2))],
    expectedMargin: Number(safeMargin.toFixed(2)),
    strategy: "stay_competitive",
    rationale: rationaleParts.join("; "),
    dataSources: snapshot.competitors.map((c) => c.url)
  };
}
