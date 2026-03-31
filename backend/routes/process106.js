const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const os = require("os");
const multer = require("multer");

// Vercel / serverless: only os.tmpdir() is writable — repo "uploads" causes multer EACCES → 500
const uploadsDir = path.join(os.tmpdir(), "tax-return-106-uploads");
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
} catch (_) {}

const upload = multer({ dest: uploadsDir });
const { extract106 } = require("../extract106");
const { calculateTax } = require("../taxCalculator");
const { normalizeToEnginePayload } = require("../taxEngine/normalizeToEnginePayload");
const { validateEngineOutput } = require("../taxEngine/validateEngineOutput");
const {
  expandEngineValidationForClient,
} = require("../taxEngine/engineValidationI18n");
const { composeTaxExplanationLayer } = require("../taxEngine/taxExplanationLayer");
const {
  augmentExplanationLayerWithOptionalLlm,
} = require("../taxEngine/optionalTaxExplanationLlm");
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
  return REQUIRED_FIELDS_MIN.filter((key) => {
    const v = source[key];
    return (
      v === undefined ||
      v === null ||
      (typeof v === "string" && v.trim() === "")
    );
  });
}

router.post("/", upload.single("file"), async (req, res) => {
  try {
    // העלאת קובץ: תמיד מחזירים נתונים שחולצו + רשימת חוסרים — בלי חישוב מס בבקשה זו.
    // אחרת כשאין חוסרים ה-API החזיר תוצאת חישוב ב-data והפרונט דילג על שלב ההשלמה (תואר / עולה חדש וכו').
    if (req.file) {
      const result = await extract106(req.file.path, req.file.mimetype);
      try {
        fs.unlinkSync(req.file.path);
      } catch (_) {}
      if (!result.success) {
        return res
          .status(400)
          .json({ success: false, error: result.error });
      }
      const codeMap = result.data;
      const missingFields = Array.isArray(result.missingFields)
        ? result.missingFields
        : getMissingFieldsByName(codeMap);
      return res.json({
        success: true,
        data: codeMap,
        missingFields,
      });
    }

    const codeMap = req.body || {};
    const missingFields = getMissingFieldsByName(codeMap);
    if (missingFields.length > 0) {
      return res.json({ success: true, data: codeMap, missingFields });
    }

    const enginePayload = normalizeToEnginePayload(codeMap);
    const taxResult = calculateTax(enginePayload);
    const engineValidation = expandEngineValidationForClient(
      validateEngineOutput(taxResult),
    );
    let explanationLayer = composeTaxExplanationLayer({
      result: taxResult,
      summaryData: {
        ...enginePayload,
        hasFormData: codeMap.hasFormData === true,
      },
      engineValidation,
    });
    explanationLayer = await augmentExplanationLayerWithOptionalLlm(
      explanationLayer,
      { engineValidation },
    );

    if (AI_AGENTS_ENABLED) {
      try {
        const pipelineResult = await runPipeline(enginePayload);
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
            engineValidation,
            explanationLayer,
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
    res.json({
      success: true,
      data: { ...taxResult, engineValidation, explanationLayer },
    });
  } catch (err) {
    console.error("[process-106] Error:", err.message || err);
    res
      .status(500)
      .json({ success: false, error: err.message || "שגיאה בעיבוד הטופס" });
  }
});

module.exports = router;
