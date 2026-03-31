const { calculateTax } = require("../taxCalculator");
const {
  buildTaxExplanationFigures,
  composeTaxExplanationLayer,
  buildSuggestedFollowUps,
} = require("./taxExplanationLayer");

describe("taxExplanationLayer", () => {
  test("buildTaxExplanationFigures copies canonical keys from calculateTax", () => {
    const result = calculateTax({
      income: 120000,
      taxPaid: 8000,
      gender: "male",
      children: 1,
      taxYear: 2024,
    });
    const fig = buildTaxExplanationFigures(result);
    expect(fig.income).toBe(120000);
    expect(fig.refund).toBe(result.refund);
    expect(fig.creditPoints).toBe(result.creditPoints);
    expect(fig.taxYear).toBe(2024);
    expect(fig).not.toHaveProperty("explanation");
  });

  test("composeTaxExplanationLayer returns narrative, follow-ups, rules, source", () => {
    const result = calculateTax({
      income: 100000,
      taxPaid: 20000,
      gender: "female",
      children: 0,
      taxYear: 2024,
    });
    const engineValidation = { valid: true, errors: [], warnings: [] };
    const layer = composeTaxExplanationLayer({
      result,
      summaryData: { ...result, hasFormData: false },
      engineValidation,
    });
    expect(layer.source).toBe("deterministic");
    expect(layer.narrative).toContain("החזר");
    expect(Array.isArray(layer.suggestedFollowUps)).toBe(true);
    expect(layer.suggestedFollowUps.length).toBeGreaterThan(0);
    expect(Array.isArray(layer.rulesApplied)).toBe(true);
    expect(layer.figures.refund).toBe(result.refund);
  });

  test("suggested follow-ups include validation warning hints", () => {
    const summary = { filingStatus: "single", children: 0 };
    const figures = { refund: 0, filingStatus: "single" };
    const ups = buildSuggestedFollowUps(summary, figures, {
      warnings: ["gross_tax_high_vs_income"],
    });
    expect(ups.some((u) => u.includes("מס הגולמי"))).toBe(true);
  });
});
