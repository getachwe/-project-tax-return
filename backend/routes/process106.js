const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadsDir = path.join(__dirname, "..", "uploads");
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
} catch (_) {}

const upload = multer({ dest: uploadsDir });
const { extract106 } = require("../extract106");
const { calculateTax } = require("../taxCalculator");
const { runPipeline } = require("../ai-agents/pipeline");
const auditService = require("../services/auditService");

const AI_AGENTS_ENABLED = process.env.AI_AGENTS_ENABLED === "true";

function auditProcess106(result, opts = {}) {
  try {
    if (!auditService.isEnabled()) return;
    auditService.logCalculation({
      eventType: "process_106",
      refundAmount: result.refund,
      documentSource: opts.documentSource || "form_106",
      rulesApplied: opts.rulesApplied,
      hasAiOutput: opts.hasAiOutput,
      confidenceScore: opts.confidenceScore,
      riskLevel: opts.riskLevel,
      userId: opts.userId || "anonymous",
    });
  } catch (_) {}
}

const REQUIRED_FIELDS_MIN = ["income", "taxPaid", "taxYear"];
function getMissingFieldsByName(data) {
  const source = data || {};
  return REQUIRED_FIELDS_MIN.filter(
    (key) => {
      const v = source[key];
      return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
    }
  );
}

router.post("/", upload.single("file"), async (req, res) => {
  try {
    let codeMap, missingFields;
    if (req.file) {
      const result = await extract106(req.file.path, req.file.mimetype);
      if (!result.success)
        return res.status(400).json({ success: false, error: result.error });
      codeMap = result.data;
      missingFields = Array.isArray(result.missingFields)
        ? result.missingFields
        : getMissingFieldsByName(codeMap);
    } else {
      codeMap = req.body || {};
      missingFields = getMissingFieldsByName(codeMap);
    }
    if (missingFields.length > 0)
      return res.json({ success: true, data: codeMap, missingFields }); // data = JSON מלא להצגה בטופס

    const taxResult = calculateTax(codeMap);

    if (AI_AGENTS_ENABLED) {
      try {
        const pipelineResult = await runPipeline(codeMap);
        auditProcess106(taxResult, {
          documentSource: pipelineResult.documentSource || "form_106",
          rulesApplied: pipelineResult.rulesApplied,
          hasAiOutput: true,
          confidenceScore: pipelineResult.confidenceScore,
          riskLevel: pipelineResult.riskLevel,
        });
        return res.json({
          success: true,
          data: {
            ...taxResult,
            confidenceScore: pipelineResult.confidenceScore,
            riskLevel: pipelineResult.riskLevel,
            recommendations: pipelineResult.recommendations,
            validation: pipelineResult.validation,
            whyRefund: pipelineResult.whyRefund,
            rulesApplied: pipelineResult.rulesApplied,
            documentSource: pipelineResult.documentSource,
          },
        });
      } catch (_) {
        // fallback: return same as without agents
      }
    }

    auditProcess106(taxResult, { documentSource: "form_106" });
    res.json({ success: true, data: taxResult });
  } catch (err) {
    console.error("[process-106] Error:", err.message || err);
    res.status(500).json({ success: false, error: err.message || "שגיאה בעיבוד הטופס" });
  }
});

module.exports = router;
