#!/usr/bin/env node
import { createServer, Tool } from "@modelcontextprotocol/sdk/server";
import { request } from "undici";
import * as cheerio from "cheerio";

const DEFAULT_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9"
};

async function fetchWithTimeout(url: string, options: { headers?: Record<string, string>; timeoutMs?: number }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 10000);

  try {
    const res = await request(url, {
      headers: { ...DEFAULT_HEADERS, ...options.headers },
      signal: controller.signal,
      maxRedirections: 3
    });
    const html = await res.body.text();
    return { html, finalUrl: res.url };
  } finally {
    clearTimeout(timeout);
  }
}

const fetchPage: Tool = {
  name: "fetch_page",
  description: "Fetch a URL and return raw HTML and final URL",
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string" },
      headers: { type: "object" },
      timeoutMs: { type: "number" }
    },
    required: ["url"]
  },
  async *invoke({ url, headers, timeoutMs }) {
    const result = await fetchWithTimeout(url, { headers, timeoutMs });
    return result;
  }
};

const extractPrice: Tool = {
  name: "extract_price",
  description:
    "Extract price and title using CSS selectors or regex fallbacks. Return {title, price, currency}",
  inputSchema: {
    type: "object",
    properties: {
      html: { type: "string" },
      titleSelector: { type: "string", default: "title" },
      priceSelectors: { type: "array", items: { type: "string" } },
      currencyFallback: { type: "string", default: "USD" }
    },
    required: ["html", "priceSelectors"]
  },
  async *invoke({ html, titleSelector, priceSelectors, currencyFallback }) {
    const $ = cheerio.load(html);
    const title =
      $(titleSelector).first().text().trim() ||
      $('meta[property="og:title"]').attr("content") ||
      "";

    const pick = (selector: string) => $(selector).first().text().trim();
    const raw =
      priceSelectors.map(pick).find(Boolean) ||
      (html.match(/(?:[$£€])\s?\d[\d.,]*/)?.[0] ?? "");

    const priceNum = Number(raw.replace(/[^\d.]/g, "")) || null;
    const currency =
      (raw.includes("$") && "USD") ||
      (raw.includes("£") && "GBP") ||
      (raw.includes("€") && "EUR") ||
      currencyFallback;

    return { title, raw, price: priceNum, currency };
  }
};

const normalizeCurrency: Tool = {
  name: "normalize_currency",
  description: "Convert price from currency to USD with given rates. Return {usdPrice}.",
  inputSchema: {
    type: "object",
    properties: {
      price: { type: "number" },
      currency: { type: "string" },
      rates: {
        type: "object",
        description: "fx rates map, e.g. { EUR:1.07, GBP:1.26 } to USD"
      }
    },
    required: ["price", "currency", "rates"]
  },
  async *invoke({ price, currency, rates }) {
    if (currency === "USD" || !currency) {
      return { usdPrice: price };
    }
    const rate = rates?.[currency];
    return { usdPrice: rate ? price * rate : price };
  }
};

const server = createServer({
  name: "price-scraper",
  version: "1.0.0",
  tools: [fetchPage, extractPrice, normalizeCurrency]
});

server.start();
