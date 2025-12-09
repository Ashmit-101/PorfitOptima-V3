type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const envLevel = (process.env.LOG_LEVEL ?? "info").toLowerCase() as LogLevel;
const threshold = LEVELS[envLevel] ?? LEVELS.info;

interface LogFields {
  [key: string]: unknown;
}

function serialize(fields?: LogFields) {
  if (!fields || Object.keys(fields).length === 0) {
    return "";
  }
  return JSON.stringify(fields);
}

function log(level: LogLevel, scope: string, message: string, fields?: LogFields) {
  if (LEVELS[level] < threshold) {
    return;
  }

  const prefix = `[${level.toUpperCase()}][${scope}]`;
  const line = serialize(fields);
  if (level === "error") {
    console.error(prefix, message, line);
    return;
  }
  if (level === "warn") {
    console.warn(prefix, message, line);
    return;
  }
  if (level === "debug") {
    console.debug(prefix, message, line);
    return;
  }
  console.log(prefix, message, line);
}

export const logger = {
  debug(scope: string, message: string, fields?: LogFields) {
    log("debug", scope, message, fields);
  },
  info(scope: string, message: string, fields?: LogFields) {
    log("info", scope, message, fields);
  },
  warn(scope: string, message: string, fields?: LogFields) {
    log("warn", scope, message, fields);
  },
  error(scope: string, message: string, fields?: LogFields) {
    log("error", scope, message, fields);
  }
};
