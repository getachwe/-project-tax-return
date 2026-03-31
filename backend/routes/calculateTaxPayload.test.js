/**
 * מאמת שהצינור של POST /api/calculate-tax תואם ל־process106 (נורמליזציה → מנוע → validate → הסבר).
 */
const { normalizeToEnginePayload } = require("../taxEngine/normalizeToEnginePayload");
const { calculateTax } = require("../taxCalculator");
const { validateEngineOutput } = require("../taxEngine/validateEngineOutput");
const { expandEngineValidationForClient } = require("../taxEngine/engineValidationI18n");
const { composeTaxExplanationLayer } = require("../taxEngine/taxExplanationLayer");

describe("calculate-tax response pipeline", () => {
  test("returns engineValidation and explanationLayer alongside tax fields", () => {
    const raw = {
      income: 100000,
      taxPaid: 15000,
      taxYear: 2024,
      gender: "male",
      children: 0,
    };
    const enginePayload = normalizeToEnginePayload(raw);
    const result = calculateTax(enginePayload);
    const engineValidation = expandEngineValidationForClient(
      validateEngineOutput(result),
    );
    const explanationLayer = composeTaxExplanationLayer({
      result,
      summaryData: { ...enginePayload, hasFormData: false },
      engineValidation,
    });
    expect(engineValidation.valid).toBe(true);
    expect(engineValidation.errorsHe.length).toBe(engineValidation.errors.length);
    expect(engineValidation.warningsHe.length).toBe(
      engineValidation.warnings.length,
    );
    expect(explanationLayer.source).toBe("deterministic");
    expect(typeof explanationLayer.narrative).toBe("string");
    expect(Array.isArray(explanationLayer.suggestedFollowUps)).toBe(true);
    expect(typeof result.refund).toBe("number");
  });
});
