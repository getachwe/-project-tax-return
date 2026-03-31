const { validateEngineOutput } = require("./validateEngineOutput");
const { calculateTax } = require("../taxCalculator");
const {
  translateEngineErrorCode,
  translateEngineWarningCode,
  expandEngineValidationForClient,
} = require("./engineValidationI18n");

describe("engineValidationI18n", () => {
  test("translateEngineErrorCode handles prefixes and literals", () => {
    expect(translateEngineErrorCode("result_object_required")).toContain(
      "פלט המנוע",
    );
    expect(translateEngineErrorCode("missing:refund")).toContain("refund");
    expect(translateEngineErrorCode("nan:income")).toContain("income");
    expect(translateEngineErrorCode("negative:taxPaid")).toContain("taxPaid");
    expect(translateEngineErrorCode("refund_mismatch_effective_minus_net")).toContain(
      "החזר",
    );
    expect(translateEngineErrorCode("unknown_code_xyz")).toBe("unknown_code_xyz");
  });

  test("translateEngineWarningCode maps known warnings", () => {
    expect(translateEngineWarningCode("gross_tax_high_vs_income")).toContain(
      "גולמי",
    );
    expect(translateEngineWarningCode("tax_paid_high_vs_income")).toContain(
      "ניכוי",
    );
    expect(translateEngineWarningCode("custom_warn")).toBe("custom_warn");
  });

  test("expandEngineValidationForClient adds Hebrew arrays", () => {
    const v = validateEngineOutput(
      calculateTax({
        income: 100000,
        taxPaid: 15000,
        gender: "male",
        children: 0,
        taxYear: 2024,
      }),
    );
    const expanded = expandEngineValidationForClient(v);
    expect(expanded.valid).toBe(true);
    expect(expanded.errorsHe.length).toBe(expanded.errors.length);
    expect(expanded.warningsHe.length).toBe(expanded.warnings.length);
  });

  test("expandEngineValidationForClient invalid input fallback", () => {
    const x = expandEngineValidationForClient(null);
    expect(x.valid).toBe(false);
    expect(x.errorsHe.length).toBeGreaterThan(0);
  });
});
