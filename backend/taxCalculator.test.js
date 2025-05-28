const { calculateTax } = require("./taxCalculator");

describe("Tax Calculator", () => {
  // Test valid inputs
  describe("Valid Inputs", () => {
    test("calculates tax for basic case", () => {
      const result = calculateTax({
        income: 100000,
        taxPaid: 15000,
        gender: "male",
        children: 2,
      });

      expect(result.income).toBe(100000);
      expect(result.grossTax).toBeGreaterThan(0);
      expect(result.creditPoints).toBe(4.25); // 2.25 base + 2 for children
      expect(result.creditValue).toBe(4.25 * 2352);
      expect(result.refund).toBeDefined();
      expect(result.explanation).toContain("חישוב מס הכנסה לשנת 2023");
    });

    test("handles female with no children", () => {
      const result = calculateTax({
        income: 150000,
        taxPaid: 20000,
        gender: "female",
        children: 0,
      });

      expect(result.creditPoints).toBe(2.75); // 2.25 base + 0.5 for female
    });

    test("handles string inputs", () => {
      const result = calculateTax({
        income: "200000",
        taxPaid: "30000",
        gender: "male",
        children: "3",
      });

      expect(result.income).toBe(200000);
      expect(result.taxPaid).toBe(30000);
      expect(result.creditPoints).toBe(5.25); // 2.25 base + 3 for children
    });
  });

  // Test edge cases
  describe("Edge Cases", () => {
    test("handles zero income", () => {
      const result = calculateTax({
        income: 0,
        taxPaid: 0,
        gender: "male",
        children: 0,
      });

      expect(result.grossTax).toBe(0);
      expect(result.netTax).toBe(0);
      expect(result.refund).toBe(0);
    });

    test("handles very high income", () => {
      const result = calculateTax({
        income: 1000000,
        taxPaid: 300000,
        gender: "male",
        children: 0,
      });

      expect(result.grossTax).toBeGreaterThan(0);
      expect(result.netTax).toBeGreaterThan(0);
    });

    test("handles maximum refund", () => {
      const result = calculateTax({
        income: 50000,
        taxPaid: 10000,
        gender: "female",
        children: 5,
      });

      expect(result.refund).toBeGreaterThan(0);
    });
  });

  // Test input validation
  describe("Input Validation", () => {
    test("throws error for missing data", () => {
      expect(() => calculateTax()).toThrow("Input data is required");
    });

    test("throws error for invalid income", () => {
      expect(() =>
        calculateTax({
          income: -1000,
          taxPaid: 0,
          gender: "male",
          children: 0,
        })
      ).toThrow("Income must be between");
    });

    test("throws error for invalid tax paid", () => {
      expect(() =>
        calculateTax({
          income: 100000,
          taxPaid: -1000,
          gender: "male",
          children: 0,
        })
      ).toThrow("Tax paid must be a non-negative number");
    });

    test("throws error for invalid gender", () => {
      expect(() =>
        calculateTax({
          income: 100000,
          taxPaid: 0,
          gender: "invalid",
          children: 0,
        })
      ).toThrow('Gender must be either "male" or "female"');
    });

    test("throws error for invalid children count", () => {
      expect(() =>
        calculateTax({
          income: 100000,
          taxPaid: 0,
          gender: "male",
          children: -1,
        })
      ).toThrow("Number of children must be between");
    });
  });

  // Test tax calculations
  describe("Tax Calculations", () => {
    test("calculates correct tax for first bracket", () => {
      const result = calculateTax({
        income: 50000,
        taxPaid: 0,
        gender: "male",
        children: 0,
      });

      expect(result.grossTax).toBe(50000 * 0.1);
    });

    test("calculates correct tax for multiple brackets", () => {
      const result = calculateTax({
        income: 150000,
        taxPaid: 0,
        gender: "male",
        children: 0,
      });

      // First bracket: 83760 * 0.10
      // Second bracket: (120960 - 83760) * 0.14
      // Third bracket: (150000 - 120960) * 0.20
      const expectedTax = Math.round(
        83760 * 0.1 + (120960 - 83760) * 0.14 + (150000 - 120960) * 0.2
      );

      expect(result.grossTax).toBe(expectedTax);
    });

    test("calculates correct credit points value", () => {
      const result = calculateTax({
        income: 100000,
        taxPaid: 0,
        gender: "female",
        children: 2,
      });

      const expectedPoints = 2.25 + 0.5 + 2; // base + female + children
      expect(result.creditPoints).toBe(expectedPoints);
      expect(result.creditValue).toBe(expectedPoints * 2352);
    });
  });
});
