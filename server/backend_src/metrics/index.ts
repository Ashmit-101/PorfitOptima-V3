import { logger } from "../logging/logger.js";

type Tags = Record<string, string | number | boolean>;

const METRICS_DEBUG = process.env.METRICS_DEBUG === "true";

function serializeTags(tags?: Tags) {
  if (!tags) return "";
  return Object.entries(tags)
    .map(([key, value]) => `${key}=${value}`)
    .join(",");
}

export function incrementCounter(name: string, value = 1, tags?: Tags) {
  if (!METRICS_DEBUG) return;
  logger.debug("metrics", `counter ${name} += ${value}`, { tags: serializeTags(tags) });
}

export function recordHistogram(name: string, value: number, tags?: Tags) {
  if (!METRICS_DEBUG) return;
  logger.debug("metrics", `histogram ${name} value=${value}`, { tags: serializeTags(tags) });
}
