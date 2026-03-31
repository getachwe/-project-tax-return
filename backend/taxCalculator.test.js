const {
  calculateTax,
  calcCreditPointsWithBreakdown,
  getCreditPointValueForYear,
} = require("./taxCalculator");

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
      console.log(result);

      expect(result.income).toBe(100000);
      expect(result.grossTax).toBeGreaterThan(0);
      expect(result.creditPoints).toBe(4.25); // 2.25 base + 2 for children
      const cpv = getCreditPointValueForYear(result.taxYear);
      expect(result.creditValue).toBe(4.25 * cpv);
      expect(result.refund).toBeDefined();
      const defaultYear = new Date().getFullYear() - 1;
      expect(result.explanation).toContain(
        `חישוב מס הכנסה לשנת ${defaultYear}`,
      );
    });

    test("handles female with no children", () => {
      const result = calculateTax({
        income: 150000,
        taxPaid: 20000,
        gender: "female",
        children: 0,
      });
      console.log(result);

      expect(result.creditPoints).toBe(2.75); // 2.25 base + 0.5 for female
    });

    test("handles string inputs", () => {
      const result = calculateTax({
        income: "200000",
        taxPaid: "30000",
        gender: "male",
        children: "3",
      });
      console.log(result);

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
      console.log(result);

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
      console.log(result);

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
      console.log(result);

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
      console.log(result);

      expect(result.grossTax).toBe(50000 * 0.1);
    });

    test("calculates correct tax for multiple brackets", () => {
      const result = calculateTax({
        income: 150000,
        taxPaid: 0,
        gender: "male",
        children: 0,
      });
      console.log(result);

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
      console.log(result);

      const expectedPoints = 2.25 + 0.5 + 2; // base + female + children
      expect(result.creditPoints).toBe(expectedPoints);
      expect(result.creditValue).toBe(
        expectedPoints * getCreditPointValueForYear(result.taxYear),
      );
    });

    test("credit point NIS is 2904 for tax year 2024 and later", () => {
      expect(getCreditPointValueForYear(2024)).toBe(2904);
      expect(getCreditPointValueForYear(2025)).toBe(2904);
      expect(getCreditPointValueForYear(2023)).toBe(2352);
    });
  });

  describe("Withholding 040 / 043 (סה״כ ניכוי לעומת חבות)", () => {
    test("taxPaidEffective is 042 plus optional 040 and 043; refund adjusts", () => {
      const base = calculateTax({
        income: 100000,
        taxPaid: 10000,
        gender: "male",
        children: 0,
        taxYear: 2024,
      });
      const withExtra = calculateTax({
        income: 100000,
        taxPaid: 10000,
        taxWithheld040: 500,
        taxWithheld043: 200,
        gender: "male",
        children: 0,
        taxYear: 2024,
      });
      expect(withExtra.taxPaid).toBe(10000);
      expect(withExtra.taxWithheld040).toBe(500);
      expect(withExtra.taxWithheld043).toBe(200);
      expect(withExtra.taxPaidEffective).toBe(10700);
      expect(withExtra.refund).toBe(base.refund + 700);
    });

    test("without 040/043, taxPaidEffective equals taxPaid (042)", () => {
      const r = calculateTax({
        income: 80000,
        taxPaid: 6000,
        gender: "female",
        children: 0,
      });
      expect(r.taxPaidEffective).toBe(r.taxPaid);
      expect(r.taxWithheld040).toBe(0);
      expect(r.taxWithheld043).toBe(0);
    });

    test("rejects negative optional withholding", () => {
      expect(() =>
        calculateTax({
          income: 100000,
          taxPaid: 1000,
          taxWithheld040: -50,
          gender: "male",
          children: 0,
        }),
      ).toThrow("taxWithheld040 must be a non-negative number");
    });
  });

  describe("Joint filing (filingStatus joint)", () => {
    test("uses combined income for brackets and sums spouse withholding", () => {
      const single200 = calculateTax({
        income: 200000,
        taxPaid: 50000,
        gender: "male",
        children: 0,
        taxYear: 2024,
      });
      const joint = calculateTax({
        income: 100000,
        spouseIncome: 100000,
        taxPaid: 25000,
        spouseTaxPaid: 25000,
        filingStatus: "joint",
        gender: "male",
        children: 0,
        taxYear: 2024,
      });
      expect(joint.filingStatus).toBe("joint");
      expect(joint.combinedIncome).toBe(200000);
      expect(joint.grossTax).toBe(single200.grossTax);
      expect(joint.netTax).toBe(single200.netTax);
      expect(joint.householdTaxPaidEffective).toBe(50000);
      expect(joint.refund).toBe(single200.refund);
    });

    test("single filing keeps combinedIncome equal to primary income", () => {
      const r = calculateTax({
        income: 120000,
        taxPaid: 10000,
        gender: "female",
        children: 1,
      });
      expect(r.filingStatus).toBe("single");
      expect(r.combinedIncome).toBe(120000);
      expect(r.spouseIncome).toBe(0);
      expect(r.householdTaxPaidEffective).toBe(r.taxPaidEffective);
    });

    test("rejects spouse income out of range", () => {
      expect(() =>
        calculateTax({
          income: 100000,
          taxPaid: 0,
          filingStatus: "joint",
          spouseIncome: 99999999,
          gender: "male",
          children: 0,
        }),
      ).toThrow("Spouse income");
    });
  });

  describe("STEP F — credit breakdown & additionalCreditPoints", () => {
    test("calcCreditPointsWithBreakdown matches prior totals", () => {
      const { standardPoints, breakdown } = calcCreditPointsWithBreakdown({
        gender: "male",
        children: 2,
        childrenUnder6: 0,
      });
      expect(standardPoints).toBe(4.25);
      expect(breakdown.baseResident).toBe(2.25);
      expect(breakdown.female).toBe(0);
      expect(breakdown.childrenUnder18).toBe(2);
    });

    test("additionalCreditPoints adds to credit value and refund when netTax positive", () => {
      const base = calculateTax({
        income: 200000,
        taxPaid: 40000,
        gender: "male",
        children: 0,
        taxYear: 2024,
      });
      const withExtra = calculateTax({
        income: 200000,
        taxPaid: 40000,
        gender: "male",
        children: 0,
        taxYear: 2024,
        additionalCreditPoints: 1,
      });
      const cpv = getCreditPointValueForYear(2024);
      expect(withExtra.standardCreditPoints).toBe(base.standardCreditPoints);
      expect(withExtra.additionalCreditPoints).toBe(1);
      expect(withExtra.creditPoints).toBe(base.creditPoints + 1);
      expect(withExtra.creditValue - base.creditValue).toBe(cpv);
      expect(withExtra.netTax).toBe(Math.max(0, base.netTax - cpv));
      expect(withExtra.refund - base.refund).toBe(
        base.netTax - withExtra.netTax,
      );
    });

    test("rejects additionalCreditPoints above 5", () => {
      expect(() =>
        calculateTax({
          income: 100000,
          taxPaid: 0,
          gender: "male",
          children: 0,
          additionalCreditPoints: 6,
        }),
      ).toThrow("additionalCreditPoints");
    });
  });
});
