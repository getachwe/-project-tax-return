const express = require("express");
const router = express.Router();
const { calculateTax } = require("../taxCalculator");
const auditService = require("../services/auditService");

const AI_AGENTS_ENABLED = process.env.AI_AGENTS_ENABLED === "true";

function auditCalculation(result, opts = {}) {
  if (!auditService.isEnabled()) return;
  auditService.logCalculation({
    eventType: "calculation",
    refundAmount: result.refund,
    documentSource: opts.documentSource || "manual",
    rulesApplied: opts.rulesApplied,
    hasAiOutput: opts.hasAiOutput,
    confidenceScore: opts.confidenceScore,
    riskLevel: opts.riskLevel,
    userId: opts.userId || "anonymous",
  });
}

router.post("/calculate-tax", async (req, res) => {
  try {
    const taxData = req.body || {};
    const result = calculateTax(taxData);

    if (AI_AGENTS_ENABLED) {
      try {
        const { runPipeline } = require("../ai-agents/pipeline");
        const pipelineResult = await runPipeline(taxData);
        auditCalculation(result, {
          documentSource: pipelineResult.documentSource || "manual",
          rulesApplied: pipelineResult.rulesApplied,
          hasAiOutput: true,
          confidenceScore: pipelineResult.confidenceScore,
          riskLevel: pipelineResult.riskLevel,
        });
        return res.json({
          ...result,
          confidenceScore: pipelineResult.confidenceScore,
          riskLevel: pipelineResult.riskLevel,
          recommendations: pipelineResult.recommendations,
          validation: pipelineResult.validation,
          whyRefund: pipelineResult.whyRefund,
          rulesApplied: pipelineResult.rulesApplied,
          documentSource: pipelineResult.documentSource,
        });
      } catch (_) {
        // fallback: return result without pipeline extras
      }
    }

    auditCalculation(result, { documentSource: "manual" });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "failed to calculate tax" });
  }
});

module.exports = router;
