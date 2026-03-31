/**
 * שכבת הסבר לתוצאת המנוע — אחרי validateEngineOutput.
 * דטרמיניסטית: לא מחשבת מס, לא משנה את result. אופציונלית לשימוש ב-LLM (הקשר בלבד).
 */

const { explain } = require("../ai-agents/ExplanationAgent");

const FIGURE_KEYS = [
  "income",
  "filingStatus",
  "children",
  "childrenUnder6",
  "spouseIncome",
  "combinedIncome",
  "grossTax",
  "standardCreditPoints",
  "additionalCreditPoints",
  "creditPoints",
  "creditValue",
  "netTax",
  "taxPaid",
  "taxWithheld040",
  "taxWithheld043",
  "taxPaidEffective",
  "spouseTaxPaid",
  "householdTaxPaidEffective",
  "refund",
  "taxYear",
];

/**
 * צילום מספרים והקשר לצורך הסבר (מקור: פלט calculateTax בלבד).
 * @param {Record<string, unknown>} result
 * @returns {Record<string, unknown>}
 */
function buildTaxExplanationFigures(result) {
  const out = {};
  if (!result || typeof result !== "object") return out;
  for (const k of FIGURE_KEYS) {
    if (result[k] !== undefined && result[k] !== null) out[k] = result[k];
  }
  return out;
}

/**
 * @param {Record<string, unknown>} summaryData
 * @param {Record<string, unknown>} figures
 * @param {{ warnings?: string[] }} [engineValidation]
 * @returns {string[]}
 */
function buildSuggestedFollowUps(summaryData, figures, engineValidation) {
  const s = summaryData && typeof summaryData === "object" ? summaryData : {};
  const f = figures && typeof figures === "object" ? figures : {};
  const out = [];
  const refund = Number(f.refund);
  const filing = f.filingStatus ?? s.filingStatus;

  if (Number.isFinite(refund) && refund > 0) {
    out.push("האם יש הכנסות נוספות שלא הוזנו (קצבה, עצמאות, השקעות)?");
  }
  if (Number.isFinite(refund) && refund < 0) {
    out.push("האם סכומי הניכוי בשדות 042, 040 ו-043 תואמים לטופס השכר ול-106?");
  }
  if (filing === "joint") {
    out.push("האם הוזנה הכנסת בן/בת הזוג וניכוי המס שלהם במלואו?");
  }
  const ch = Number(s.children ?? f.children ?? 0);
  if (ch > 0) {
    out.push("האם מספר הילדים והגילאים תואמים למציאות לצורך נקודות זיכוי?");
  }

  const warns = Array.isArray(engineValidation?.warnings)
    ? engineValidation.warnings
    : [];
  if (warns.includes("gross_tax_high_vs_income")) {
    out.push("כדאי לבדוק שוב את ההכנסה ואת המס הגולמי מול נתוני הטופס.");
  }
  if (warns.includes("tax_paid_high_vs_income")) {
    out.push("כדאי לבדוק את סכומי הניכויים ביחס להכנסה — נראה נתון חריג.");
  }
  if (warns.includes("refund_exceeds_income_plus_tax_paid_042")) {
    out.push("ההחזר גבוה מאוד ביחס להכנסה — כדאי לוודא את כל שדות הניכוי.");
  }

  return [...new Set(out)].slice(0, 6);
}

/**
 * @param {{ result: object, summaryData?: object, engineValidation?: object }} args
 * @returns {{
 *   narrative: string,
 *   suggestedFollowUps: string[],
 *   rulesApplied: string[],
 *   documentSource: string,
 *   figures: Record<string, unknown>,
 * }}
 */
function composeTaxExplanationLayer({ result, summaryData, engineValidation }) {
  const data = summaryData && typeof summaryData === "object" ? summaryData : {};
  const enhanced = explain(data, result || {});
  const figures = buildTaxExplanationFigures(result || {});
  const narrative = [enhanced.whyRefund, result && result.explanation]
    .filter((x) => x != null && String(x).trim() !== "")
    .join("\n\n");

  const suggestedFollowUps = buildSuggestedFollowUps(data, figures, engineValidation);

  return {
    narrative,
    suggestedFollowUps,
    rulesApplied: enhanced.rulesApplied || [],
    documentSource: enhanced.documentSource || "הזנה ידנית",
    figures,
    source: "deterministic",
  };
}

module.exports = {
  buildTaxExplanationFigures,
  buildSuggestedFollowUps,
  composeTaxExplanationLayer,
};
