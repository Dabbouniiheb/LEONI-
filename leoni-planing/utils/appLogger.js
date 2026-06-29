/**
 * Structured application logger.
 *
 * Provides INFO / WARN / ERROR / DEBUG levels.
 * In production, DEBUG is silenced. Output is JSON-formatted
 * for log aggregation tools.
 *
 * This is for APPLICATION-level logging (events, decisions, errors).
 * HTTP request logging is handled separately by morgan in server.js.
 * Audit logging (user actions) is handled by utils/auditLogger.js.
 */

const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

const currentLevel =
  LOG_LEVELS[String(process.env.LOG_LEVEL || "DEBUG").toUpperCase()] ??
  LOG_LEVELS.DEBUG;

function formatEntry(level, message, meta = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  });
}

function shouldLog(level) {
  return LOG_LEVELS[level] >= currentLevel;
}

const logger = {
  debug(message, meta) {
    if (shouldLog("DEBUG")) console.debug(formatEntry("DEBUG", message, meta));
  },
  info(message, meta) {
    if (shouldLog("INFO")) console.log(formatEntry("INFO", message, meta));
  },
  warn(message, meta) {
    if (shouldLog("WARN")) console.warn(formatEntry("WARN", message, meta));
  },
  error(message, meta) {
    if (shouldLog("ERROR")) {
      // If meta contains an Error instance, serialize it properly
      if (meta?.error instanceof Error) {
        meta = {
          ...meta,
          error: {
            name: meta.error.name,
            message: meta.error.message,
            stack: meta.error.stack,
          },
        };
      }
      console.error(formatEntry("ERROR", message, meta));
    }
  },
};

module.exports = logger;
