const { calculateTax } = require("../taxCalculator");
const { validateEngineOutput } = require("./validateEngineOutput");

describe("validateEngineOutput", () => {
  test("accepts real calculateTax output", () => {
    const result = calculateTax({
      income: 100000,
      taxPaid: 15000,
      gender: "male",
      children: 2,
      taxYear: 2024,
    });
    const v = validateEngineOutput(result);
    expect(v.valid).toBe(true);
    expect(v.errors).toEqual([]);
  });

  test("accepts joint filing calculateTax output", () => {
    const result = calculateTax({
      income: 80000,
      spouseIncome: 80000,
      taxPaid: 5000,
      spouseTaxPaid: 5000,
      filingStatus: "joint",
      gender: "male",
      children: 0,
      taxYear: 2024,
    });
    const v = validateEngineOutput(result);
    expect(v.valid).toBe(true);
  });

  test("rejects null or non-object", () => {
    expect(validateEngineOutput(null).valid).toBe(false);
    expect(validateEngineOutput([]).valid).toBe(false);
    expect(validateEngineOutput(null).errors[0]).toBe("result_object_required");
  });

  test("detects missing required fields", () => {
    const v = validateEngineOutput({
      income: 1,
      grossTax: 0,
      creditPoints: 2.25,
      creditValue: 0,
      netTax: 0,
      taxPaid: 0,
      // refund, taxPaidEffective, householdTaxPaidEffective missing
      taxYear: 2024,
    });
    expect(v.valid).toBe(false);
    expect(v.errors.some((e) => e === "missing:refund")).toBe(true);
    expect(v.errors.some((e) => e === "missing:taxPaidEffective")).toBe(true);
    expect(v.errors.some((e) => e === "missing:householdTaxPaidEffective")).toBe(
      true,
    );
  });

  test("detects NaN", () => {
    const v = validateEngineOutput({
      income: 100000,
      grossTax: NaN,
      creditPoints: 2.25,
      creditValue: 100,
      netTax: 0,
      taxPaid: 5000,
      taxPaidEffective: 5000,
      householdTaxPaidEffective: 5000,
      refund: 5000,
      taxYear: 2024,
    });
    expect(v.valid).toBe(false);
    expect(v.errors).toContain("nan:grossTax");
  });

  test("detects negative numeric violations", () => {
    const base = {
      income: 100000,
      grossTax: 10000,
      creditPoints: 2.25,
      creditValue: 5000,
      netTax: 5000,
      taxPaid: 15000,
      taxPaidEffective: 15000,
      householdTaxPaidEffective: 15000,
      refund: 10000,
      taxYear: 2024,
    };
    expect(validateEngineOutput({ ...base, income: -1 }).errors).toContain(
      "negative:income",
    );
    expect(validateEngineOutput({ ...base, taxPaid: -1 }).errors).toContain(
      "negative:taxPaid",
    );
    expect(validateEngineOutput({ ...base, grossTax: -1 }).errors).toContain(
      "negative:grossTax",
    );
    expect(validateEngineOutput({ ...base, netTax: -1 }).errors).toContain(
      "negative:netTax",
    );
  });

  test("warns when gross tax is implausibly high vs income", () => {
    const v = validateEngineOutput({
      income: 100000,
      grossTax: 60000,
      creditPoints: 2.25,
      creditValue: 0,
      netTax: 60000,
      taxPaid: 70000,
      taxPaidEffective: 70000,
      householdTaxPaidEffective: 70000,
      refund: 10000,
      taxYear: 2024,
    });
    expect(v.valid).toBe(true);
    expect(v.warnings).toContain("gross_tax_high_vs_income");
  });

  test("warns when tax paid is very high vs income", () => {
    const v = validateEngineOutput({
      income: 100000,
      grossTax: 10000,
      creditPoints: 2.25,
      creditValue: 0,
      netTax: 10000,
      taxPaid: 400000,
      taxPaidEffective: 400000,
      householdTaxPaidEffective: 400000,
      refund: 390000,
      taxYear: 2024,
    });
    expect(v.valid).toBe(true);
    expect(v.warnings).toContain("tax_paid_high_vs_income");
  });
});
