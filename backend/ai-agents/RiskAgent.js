/**
 * RiskAgent – הערכת רמת סיכון וביטחון בתביעה.
 * אחריות יחידה: detect unusually large refunds, unclear data, confidence level.
 */

/**
 * מעריך רמת סיכון וציון ביטחון.
 * @param {Record<string, unknown>} structuredData - נתונים מובנים
 * @param {{ valid: boolean, errors: string[], warnings: string[] }} validationResult - מ-ValidationAgent
 * @param {{ refundEstimate: number, rawResult?: object }} taxResult - מ-TaxRulesAgent
 * @returns {{ riskLevel: 'low'|'medium'|'high', confidenceScore: number }}
 */
function evaluateRisk(structuredData, validationResult, taxResult = {}) {
  const data = structuredData || {};
  const validation = validationResult || { valid: true, errors: [], warnings: [] };
  const refund = Number(taxResult.refundEstimate ?? taxResult.rawResult?.refund) || 0;
  const income = Number(data.income) || 0;

  let score = 100;
  let riskLevel = "low";

  if (!validation.valid || (validation.errors && validation.errors.length > 0)) {
    score -= 30;
    riskLevel = "high";
  }
  if (validation.warnings && validation.warnings.length > 0) {
    score -= Math.min(20, validation.warnings.length * 5);
    if (riskLevel !== "high") riskLevel = "medium";
  }

  const refundRatio = income > 0 ? refund / income : 0;
  if (refundRatio > 0.5 && refund > 50000) {
    score -= 15;
    if (riskLevel === "low") riskLevel = "medium";
  }
  if (income === 0 && refund > 0) {
    score -= 25;
    riskLevel = "high";
  }

  const confidenceScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    riskLevel,
    confidenceScore,
  };
}

module.exports = { evaluateRisk };
