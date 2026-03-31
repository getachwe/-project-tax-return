const { calculateTax } = require("../taxCalculator");
const { normalizeToEnginePayload } = require("./normalizeToEnginePayload");

describe("normalizeToEnginePayload", () => {
  test("coerces income, taxPaid and comma-formatted strings", () => {
    const raw = { income: " 120,000 ", taxPaid: "5,000.5" };
    const p = normalizeToEnginePayload(raw);
    expect(p.income).toBe(120000);
    expect(p.taxPaid).toBe(5000.5);
  });

  test("normalizes filingStatus to single or joint", () => {
    expect(
      normalizeToEnginePayload({ income: 1, taxPaid: 0, filingStatus: "JOINT" })
        .filingStatus,
    ).toBe("joint");
    expect(
      normalizeToEnginePayload({ income: 1, taxPaid: 0, filingStatus: "married" })
        .filingStatus,
    ).toBe("single");
  });

  test("defaults filingStatus from maritalStatus when filingStatus absent (STEP 0)", () => {
    expect(
      normalizeToEnginePayload({
        income: 100000,
        taxPaid: 5000,
        maritalStatus: "married",
      }).filingStatus,
    ).toBe("joint");
    expect(
      normalizeToEnginePayload({
        income: 100000,
        taxPaid: 5000,
        maritalStatus: "single",
      }).filingStatus,
    ).toBe("single");
  });

  test("coerces additionalCreditPoints", () => {
    const p = normalizeToEnginePayload({
      income: 50000,
      taxPaid: 5000,
      additionalCreditPoints: "1.5",
    });
    expect(p.additionalCreditPoints).toBe(1.5);
  });

  test("coerces taxWithheld040 and taxWithheld043", () => {
    const p = normalizeToEnginePayload({
      income: 100000,
      taxPaid: 8000,
      taxWithheld040: "100",
      taxWithheld043: 50,
    });
    expect(p.taxWithheld040).toBe(100);
    expect(p.taxWithheld043).toBe(50);
  });

  test("maps fee158 to income when income is absent", () => {
    const p = normalizeToEnginePayload({ fee158: 88000, taxPaid: 10000 });
    expect(p.income).toBe(88000);
    expect(p.fee158).toBe(88000);
  });

  test("does not override explicit income with fee158", () => {
    const p = normalizeToEnginePayload({
      income: 100000,
      fee158: 99999,
      taxPaid: 10000,
    });
    expect(p.income).toBe(100000);
  });

  test("sets pensionDeposits from pension aliases", () => {
    const p = normalizeToEnginePayload({
      income: 100000,
      taxPaid: 5000,
      pensionContribution: 12000,
    });
    expect(p.pensionDeposits).toBe(12000);
    const p2 = normalizeToEnginePayload({
      income: 100000,
      taxPaid: 5000,
      pension201: 8000,
    });
    expect(p2.pensionDeposits).toBe(8000);
  });

  test("normalizes gender whitespace and case", () => {
    const p = normalizeToEnginePayload({
      income: 100000,
      taxPaid: 5000,
      gender: " FEMALE ",
    });
    expect(p.gender).toBe("female");
  });

  test("numeric children and taxYear", () => {
    const p = normalizeToEnginePayload({
      income: 100000,
      taxPaid: 5000,
      children: "2",
      taxYear: "2024",
    });
    expect(p.children).toBe(2);
    expect(p.taxYear).toBe(2024);
  });

  test("throws on non-object raw", () => {
    expect(() => normalizeToEnginePayload(null)).toThrow();
    expect(() => normalizeToEnginePayload([])).toThrow();
  });

  test("calculateTax(normalize(raw)) matches calculateTax for string inputs", () => {
    const rawIncomeTaxPaid = {
      income: "200000",
      taxPaid: "30000",
      gender: "male",
      children: "3",
    };
    const n = normalizeToEnginePayload(rawIncomeTaxPaid);
    expect(calculateTax(n)).toEqual(calculateTax(rawIncomeTaxPaid));
  });
});
