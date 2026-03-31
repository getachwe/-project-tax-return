/**
 * מבנה נתונים לסקילים — בלי מזהי DB, בלי נתיבי אחסון.
 * מבוסס על אובייקטי הדוח שכבר עברו prepareReportsForAiContext ב-contextObject.
 */

/**
 * @param {{ reports?: object[] }} contextObject
 * @returns {object[]}
 */
function normalizeReportsForSkillsPayload(contextObject) {
  const reports = contextObject?.reports;
  if (!Array.isArray(reports)) return [];

  return reports.map((r, i) => ({
    ordinal: i + 1,
    label: typeof r.label === "string" ? r.label : `דוח ${i + 1}`,
    reportYear: r.reportYear ?? null,
    createdAt: r.createdAt ?? null,
    taxData: r.taxData && typeof r.taxData === "object" ? r.taxData : {},
    calculation:
      r.calculation && typeof r.calculation === "object" ? r.calculation : {},
    insights: r.insights && typeof r.insights === "object" ? r.insights : {},
  }));
}

module.exports = {
  normalizeReportsForSkillsPayload,
};
