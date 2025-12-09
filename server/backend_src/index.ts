import "dotenv/config";
import express from "express";
import cors from "cors";
import { z } from "zod";
import { getFirestore, getServerTimestamp } from "./lib/firebaseAdmin.js";
import { enqueueScrapeJob } from "./services/jobQueue.js";
import { getLatestInsight, getLatestSnapshot, getProductById } from "./services/productStatus.js";
import { logger } from "./logging/logger.js";

const PORT = Number(process.env.PORT ?? 4000);

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const SyncRequestSchema = z.object({
  urls: z.array(z.string().url()).min(1),
  fx: z.record(z.string(), z.number()).optional()
});

const ApplyPriceSchema = z.object({
  price: z.number().min(0)
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/products/:productId/sync", async (req, res) => {
  try {
    const { productId } = req.params;
    const parsed = SyncRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
    }

    const product = await getProductById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const { urls, fx } = parsed.data;
    const job = await enqueueScrapeJob({
      productId,
      urls,
      fxRates: fx
    });

    logger.info("api", "Scrape job enqueued from /sync", { productId, jobId: job.jobId });

    res.status(202).json({ jobId: job.jobId, status: job.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("api", "Failed to enqueue scrape job", { message });
    res.status(500).json({ error: message });
  }
});

app.get("/api/products/:productId/status", async (req, res) => {
  try {
    const { productId } = req.params;
    const [snapshot, insight] = await Promise.all([
      getLatestSnapshot(productId),
      getLatestInsight(productId)
    ]);

    if (!snapshot) {
      return res.status(404).json({ error: "No competitor snapshot found" });
    }

    res.json({
      snapshot,
      insight
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("api", "Failed to fetch product status", { message });
    res.status(500).json({ error: message });
  }
});

app.post("/api/products/:productId/price", async (req, res) => {
  try {
    const body = ApplyPriceSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({ error: "Invalid payload", issues: body.error.issues });
    }

    const { productId } = req.params;
    const db = getFirestore();
    const productRef = db.collection("products").doc(productId);
    const snapshot = await productRef.get();
    if (!snapshot.exists) {
      return res.status(404).json({ error: "Product not found" });
    }

    await productRef.set(
      {
        pricing: { sellingPrice: body.data.price },
        updatedAt: getServerTimestamp()
      },
      { merge: true }
    );

    res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("api", "Failed to apply price", { message });
    res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  logger.info("api", `App server listening on port ${PORT}`);
});

// ============================================
// AI COMPETITOR DISCOVERY ENDPOINTS
// ============================================

const DiscoverCompetitorsSchema = z.object({
  productInfo: z.object({
    name: z.string().min(1),
    category: z.string().min(1),
    description: z.preprocess(value => Array.isArray(value) ? value.join(", ") : value, z.string().optional()),
    brand: z.preprocess(value => Array.isArray(value) ? value.join(", ") : value, z.string().optional()),
    keywords: z.preprocess(value => Array.isArray(value) ? value.join(", ") : value, z.string().optional()),
    targetMarket: z.preprocess(value => Array.isArray(value) ? value.join(", ") : value, z.string().optional()),
    features: z.preprocess(value => Array.isArray(value) ? value.join(", ") : value, z.string().optional()),
    specifications: z.preprocess(value => Array.isArray(value) ? value.join(", ") : value, z.string().optional())
  })
});

const CalculatePricingSchema = z.object({
  competitorPrices: z.array(z.number()),
  costPerUnit: z.number(),
  productInfo: z.object({
    name: z.string(),
    category: z.string()
  }).optional()
});

// Discover competitors using AI
app.post("/api/products/:productId/discover-competitors", async (req, res) => {
  try {
    const { productId } = req.params;
    const parsed = DiscoverCompetitorsSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
    }

    const { productInfo } = parsed.data;
    const keywordBase = productInfo.keywords?.trim();
    const derivedKeywords = keywordBase && keywordBase.length > 0
      ? keywordBase
      : [productInfo.name, productInfo.category, productInfo.features]
          .filter(Boolean)
          .join(", ");

    // Use OpenAI to generate search queries and find competitors
    const openai = await import("openai").then(m => new m.OpenAI({ apiKey: process.env.OPENAI_API_KEY }));
    
    // Generate search queries using AI
    const searchPrompt = `Based on this product information, generate 3-5 specific search queries to find similar competitor products:
    
Product Name: ${productInfo.name}
Category: ${productInfo.category}
Keywords: ${derivedKeywords}
${productInfo.brand ? `Brand: ${productInfo.brand}` : ''}
${productInfo.features ? `Features: ${productInfo.features}` : ''}

Return ONLY a JSON array of search query strings, no other text. Example: ["query1", "query2", "query3"]`;

    const searchResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: searchPrompt }],
      temperature: 0.7,
    });

    let searchQueries: string[] = [];
    try {
      searchQueries = JSON.parse(searchResponse.choices[0].message.content || "[]");
    } catch {
      searchQueries = [derivedKeywords];
    }

    // Generate mock competitors (in production, you'd scrape real data)
    const mockCompetitors = [
      {
        name: `Premium ${productInfo.name}`,
        price: 79.99,
        url: `https://example.com/product1`,
        description: `High-end alternative in ${productInfo.category}`,
        matchScore: 0.95
      },
      {
        name: `Budget ${productInfo.name}`,
        price: 39.99,
        url: `https://example.com/product2`,
        description: `Affordable option with good reviews`,
        matchScore: 0.88
      },
      {
        name: `${productInfo.brand || 'Brand'} Competitor A`,
        price: 59.99,
        url: `https://example.com/product3`,
        description: `Direct competitor with similar features`,
        matchScore: 0.92
      },
      {
        name: `${productInfo.category} Leader`,
        price: 89.99,
        url: `https://example.com/product4`,
        description: `Market leader in this category`,
        matchScore: 0.85
      },
      {
        name: `Value ${productInfo.name}`,
        price: 49.99,
        url: `https://example.com/product5`,
        description: `Best value for money option`,
        matchScore: 0.90
      }
    ];

    logger.info("api", "Competitors discovered", { productId, count: mockCompetitors.length });

    res.json({
      competitors: mockCompetitors,
      searchQueries,
      discoveredAt: new Date().toISOString()
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("api", "Failed to discover competitors", { message });
    res.status(500).json({ error: message });
  }
});

// Calculate optimal pricing
app.post("/api/products/:productId/calculate-pricing", async (req, res) => {
  try {
    const { productId } = req.params;
    const parsed = CalculatePricingSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
    }

    const { competitorPrices, costPerUnit } = parsed.data;

    // Calculate statistics
    const avgPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
    const minPrice = Math.min(...competitorPrices);
    const maxPrice = Math.max(...competitorPrices);
    const stdDev = Math.sqrt(
      competitorPrices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / competitorPrices.length
    );

    // Calculate optimal price (avg + 0.1 * stdDev, but above cost)
    const recommendedPrice = Math.max(avgPrice + (0.1 * stdDev), costPerUnit * 1.2);
    const priceBand: [number, number] = [avgPrice - stdDev, avgPrice + stdDev];
    const expectedMargin = (recommendedPrice - costPerUnit) / recommendedPrice;

    // Generate rationale using AI
    const openai = await import("openai").then(m => new m.OpenAI({ apiKey: process.env.OPENAI_API_KEY }));
    
    const rationalePrompt = `Generate a brief pricing rationale (2-3 sentences) for recommending $${recommendedPrice.toFixed(2)} given:
- Competitor prices: ${competitorPrices.map(p => `$${p}`).join(', ')}
- Average competitor price: $${avgPrice.toFixed(2)}
- Product cost: $${costPerUnit.toFixed(2)}
- Expected margin: ${(expectedMargin * 100).toFixed(1)}%

Be concise and business-focused.`;

    const rationaleResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: rationalePrompt }],
      temperature: 0.7,
      max_tokens: 150
    });

    const rationale = rationaleResponse.choices[0].message.content || 
      `Based on ${competitorPrices.length} competitors averaging $${avgPrice.toFixed(2)}, this price positions you competitively while maintaining a healthy ${(expectedMargin * 100).toFixed(1)}% margin.`;

    logger.info("api", "Pricing calculated", { productId, recommendedPrice });

    res.json({
      recommendedPrice,
      priceBand,
      expectedMargin,
      rationale,
      competitorStats: {
        average: avgPrice,
        min: minPrice,
        max: maxPrice,
        count: competitorPrices.length
      },
      calculatedAt: new Date().toISOString()
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("api", "Failed to calculate pricing", { message });
    res.status(500).json({ error: message });
  }
});
