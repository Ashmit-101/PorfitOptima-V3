import { z } from "zod";

export const AiResponseSchema = z.object({
  recommendedPrice: z.number(),
  optimalPrice: z.number(),
  expectedMargin: z.number(),
  strategy: z.enum(["maximize_profit", "stay_competitive", "clear_inventory"]),
  priceBand: z.tuple([z.number(), z.number()]),
  confidence: z.number().min(0).max(1),
  competitorPrices: z
    .array(
      z.object({
        name: z.string(),
        price: z.number(),
        currency: z.string().optional(),
        url: z.string().optional(),
        source: z.string().optional(),
        lastVerified: z.string().optional()
      })
    )
    .min(1),
  marketValueSummary: z.string(),
  methodology: z.string(),
  dataSources: z.array(z.string()).min(1),
  rationale: z.string(),
  nextCheckHours: z.number()
});

export type AiResponse = z.infer<typeof AiResponseSchema>;
