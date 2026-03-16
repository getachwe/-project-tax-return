/**
 * Document processing pipeline – מריץ את כל ה-agents על נתונים מחולצים.
 * מופעל רק כאשר AI_AGENTS_ENABLED=true.
 * לא משנה את התשובה הבסיסית – מוסיף שדות: confidenceScore, riskLevel, recommendations, validation.
 */

const {
  DocumentAnalyzerAgent,
  TaxRulesAgent,
  ValidationAgent,
  RecommendationAgent,
  RiskAgent,
  ExplanationAgent,
} = require("./index");

/**
 * מריץ את הצינור על אובייקט נתונים שכבר חולץ (מ-extract106 / LLM).
 * @param {Record<string, unknown>} extractedData - נתונים מחולצים מהמסמך
 * @returns {Promise<{
 *   structuredData: Record<string, unknown>,
 *   validation: { valid: boolean, errors: string[], warnings: string[], missing: string[] },
 *   taxResult: { refundEstimate: number, eligibility: boolean, rulesApplied: string[], rawResult: object },
 *   risk: { riskLevel: string, confidenceScore: number },
 *   recommendations: string[],
 *   confidenceScore: number,
 *   riskLevel: string
 * }>}
 */
async function runPipeline(extractedData) {
  const structuredData = DocumentAnalyzerAgent.analyze(extractedData || {});
  const validation = ValidationAgent.validate(structuredData);
  const taxResult = TaxRulesAgent.applyTaxRules(structuredData);
  const risk = RiskAgent.evaluateRisk(structuredData, validation, taxResult);
  const { recommendations } = RecommendationAgent.recommend(
    structuredData,
    taxResult
  );
  const explanationEnhancement = ExplanationAgent.explain(extractedData || {}, taxResult.rawResult || {});

  return {
    structuredData,
    validation,
    taxResult,
    risk,
    recommendations,
    confidenceScore: risk.confidenceScore,
    riskLevel: risk.riskLevel,
    whyRefund: explanationEnhancement.whyRefund,
    rulesApplied: explanationEnhancement.rulesApplied,
    documentSource: explanationEnhancement.documentSource,
  };
}

module.exports = { runPipeline };
