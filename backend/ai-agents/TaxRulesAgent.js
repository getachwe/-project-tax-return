/**
 * TaxRulesAgent – החלת חוקי מס וקביעת זכאות להחזר.
 * אחריות יחידה: apply tax rules, calculate estimated refund, validate calculation logic.
 * משתמש ב-taxCalculator הקיים – לא משנה אותו.
 */

const { calculateFromUserInput } = require("../taxEngine/calculateFromUserInput");

/**
 * מפעיל את חוקי המס ומחשב החזר משוער.
 * @param {Record<string, unknown>} structuredData - נתונים מובנים (מ-DocumentAnalyzerAgent)
 * @returns {{ refundEstimate: number, eligibility: boolean, rulesApplied: string[], rawResult: object }}
 */
function applyTaxRules(structuredData) {
  if (!structuredData || typeof structuredData !== "object") {
    return {
      refundEstimate: 0,
      eligibility: false,
      rulesApplied: [],
      rawResult: {},
    };
  }

  try {
    const rawResult = calculateFromUserInput(structuredData);
    const refund = Number(rawResult.refund) || 0;
    const rulesApplied = [
      "מדרגות מס הכנסה",
      "נקודות זיכוי",
      refund >= 0 ? "זכאות להחזר" : "חוב מס",
    ];
    if (rawResult.calculationDetails?.childrenUnder6) {
      rulesApplied.push("זיכוי ילדים מתחת לגיל 6");
    }
    if (Number(structuredData.disabilityPercent) >= 40) {
      rulesApplied.push("פטור נכות");
    }

    return {
      refundEstimate: refund,
      eligibility: refund >= 0,
      rulesApplied,
      rawResult,
    };
  } catch (err) {
    return {
      refundEstimate: 0,
      eligibility: false,
      rulesApplied: [],
      rawResult: {},
      error: err.message,
    };
  }
}

module.exports = { applyTaxRules };
