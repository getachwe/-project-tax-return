/**
 * Audit Service – רישום אירועי חישוב ושקיפות.
 * שומר: צעדי חישוב, כללים שהופעלו, מקור מסמך, פלט AI, timestamp.
 * לא שומר PII (ת.ז, מסמך מלא).
 */

const AUDIT_ENABLED = process.env.AUDIT_ENABLED !== "false";
const MAX_LOGS = 500;
const inMemoryLogs = [];

/**
 * בודק אם האודיט מופעל.
 */
function isEnabled() {
  return AUDIT_ENABLED;
}

/**
 * רושם אירוע חישוב (ללא שדות מזהה אישי).
 * @param {{
 *   eventType: string,
 *   userId?: string,
 *   refundAmount?: number,
 *   rulesApplied?: string[],
 *   documentSource?: string,
 *   hasAiOutput?: boolean,
 *   calculationSteps?: string[],
 *   [key: string]: unknown
 * }} entry
 */
function logCalculation(entry) {
  if (!AUDIT_ENABLED) return;

  const safe = {};
  const allowed = [
    "eventType",
    "userId",
    "refundAmount",
    "rulesApplied",
    "documentSource",
    "hasAiOutput",
    "calculationSteps",
    "timestamp",
    "riskLevel",
    "confidenceScore",
  ];
  for (const key of allowed) {
    if (entry[key] !== undefined) safe[key] = entry[key];
  }
  if (!safe.timestamp) safe.timestamp = new Date().toISOString();

  inMemoryLogs.push(safe);
  if (inMemoryLogs.length > MAX_LOGS) inMemoryLogs.shift();
}

/**
 * מחזיר את הרשומות האחרונות (לבדיקות / מנהל).
 * @param {number} [limit=50]
 * @returns {Array<Record<string, unknown>>}
 */
function getLogs(limit = 50) {
  const n = Math.min(limit, inMemoryLogs.length);
  return inMemoryLogs.slice(-n);
}

/** תאימות לשם getRecentLogs */
function getRecentLogs(limit = 50) {
  return getLogs(limit);
}

module.exports = {
  isEnabled,
  logCalculation,
  log: logCalculation,
  getLogs,
  getRecentLogs,
};
