const { applyTaxRules } = require("./TaxRulesAgent");
const { calculateFromUserInput } = require("../taxEngine/calculateFromUserInput");

describe("TaxRulesAgent.applyTaxRules", () => {
  test("returns zeros for null/invalid input", () => {
    expect(applyTaxRules(null).refundEstimate).toBe(0);
    expect(applyTaxRules(undefined).rawResult).toEqual({});
    expect(applyTaxRules("x").rulesApplied).toEqual([]);
  });

  test("rawResult matches calculateFromUserInput for same payload", () => {
    const structuredData = {
      income: 120000,
      taxPaid: 10000,
      taxYear: 2024,
      gender: "male",
      children: 0,
    };
    const out = applyTaxRules(structuredData);
    const direct = calculateFromUserInput(structuredData);
    expect(out.rawResult.refund).toBe(direct.refund);
    expect(out.rawResult.netTax).toBe(direct.netTax);
    expect(out.refundEstimate).toBe(direct.refund);
  });

  test("coerces string numbers like API normalize path", () => {
    const structuredData = {
      income: "100,000",
      taxPaid: "15,000",
      taxYear: 2024,
      gender: "male",
      children: 0,
    };
    const out = applyTaxRules(structuredData);
    const direct = calculateFromUserInput(structuredData);
    expect(out.refundEstimate).toBe(direct.refund);
    expect(Array.isArray(out.rulesApplied)).toBe(true);
    expect(out.rulesApplied).toContain("מדרגות מס הכנסה");
  });

  test("eligibility false when refund negative", () => {
    const out = applyTaxRules({
      income: 200000,
      taxPaid: 0,
      taxYear: 2024,
      gender: "male",
      children: 0,
    });
    expect(out.refundEstimate).toBeLessThan(0);
    expect(out.eligibility).toBe(false);
    expect(out.rulesApplied.some((r) => r.includes("חוב"))).toBe(true);
  });

  test("adds disability rule when disabilityPercent >= 40", () => {
    const out = applyTaxRules({
      income: 80000,
      taxPaid: 5000,
      taxYear: 2024,
      gender: "male",
      children: 0,
      disabilityPercent: 45,
    });
    expect(out.rulesApplied).toContain("פטור נכות");
  });
});
