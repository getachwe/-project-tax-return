/**
 * DocumentAnalyzerAgent – חילוץ נתונים מובנים ממסמכי מס.
 * אחריות יחידה: parse document text, detect tax fields, extract structured values.
 * לא משנה לוגיקה קיימת – מקבל טקסט או אובייקט מחולץ ומחזיר מבנה אחיד.
 */

const FORM_106_KEYS = [
  "income",
  "taxPaid",
  "taxWithheld040",
  "taxWithheld043",
  "taxCredits",
  "pensionContribution",
  "additionalIncome",
  "taxYear",
  "creditPoints",
  "children",
  "filingStatus",
  "spouseIncome",
  "spouseTaxPaid",
  "additionalCreditPoints",
];

/**
 * מנרמל אובייקט שדות מחילוץ קיים (regex/LLM) למבנה אחיד עם שדות מספריים.
 * @param {Record<string, unknown>} extracted - אובייקט מחולץ (מ-extract106 או LLM)
 * @returns {{ income: number, taxPaid: number, pensionContribution: number, donations: number, [key: string]: unknown }}
 */
function normalizeExtractedFields(extracted) {
  if (!extracted || typeof extracted !== "object") {
    return { income: 0, taxPaid: 0, pensionContribution: 0, donations: 0 };
  }

  const num = (v) => {
    if (v === undefined || v === null || v === "") return 0;
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    const s = String(v).replace(/,/g, "").trim();
    const n = parseFloat(s);
    return Number.isNaN(n) ? 0 : n;
  };

  return {
    income: num(extracted.income ?? extracted.fee158),
    taxPaid: num(extracted.taxPaid),
    taxWithheld040: num(extracted.taxWithheld040),
    taxWithheld043: num(extracted.taxWithheld043),
    pensionContribution: num(extracted.pensionContribution ?? extracted.pension201 ?? extracted.pension230),
    donations: num(extracted.donations ?? extracted.deductions991),
    taxCredits: num(extracted.taxCredits),
    additionalIncome: num(extracted.additionalIncome),
    taxYear: num(extracted.taxYear) || new Date().getFullYear() - 1,
    creditPoints: num(extracted.creditPoints) || 2.25,
    children: Math.max(0, Math.floor(num(extracted.children))),
    spouseIncome: num(extracted.spouseIncome),
    spouseTaxPaid: num(extracted.spouseTaxPaid),
    additionalCreditPoints: num(extracted.additionalCreditPoints),
    ...extracted,
  };
}

/**
 * מנתח מסמך – מקבל אובייקט מחולץ (מהמערכת הקיימת) ומחזיר מבנה אחיד לשאר ה-agents.
 * @param {Record<string, unknown>} extractedFromPipeline - נתונים שכבר חולצו (מ-extract106 / LLM)
 * @returns {Record<string, unknown>}
 */
function analyze(extractedFromPipeline) {
  return normalizeExtractedFields(extractedFromPipeline);
}

module.exports = { analyze, normalizeExtractedFields, FORM_106_KEYS };
