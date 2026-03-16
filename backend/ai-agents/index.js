/**
 * AI Agents – כניסה מרכזית לכל הסוכנים.
 * כל agent עם אחריות יחידה; אין שינוי לוגיקה קיימת.
 */

const DocumentAnalyzerAgent = require("./DocumentAnalyzerAgent");
const TaxRulesAgent = require("./TaxRulesAgent");
const ValidationAgent = require("./ValidationAgent");
const RecommendationAgent = require("./RecommendationAgent");
const RiskAgent = require("./RiskAgent");
const ExplanationAgent = require("./ExplanationAgent");

module.exports = {
  DocumentAnalyzerAgent,
  TaxRulesAgent,
  ValidationAgent,
  RecommendationAgent,
  RiskAgent,
  ExplanationAgent,
};
