const { calculateTax } = require("../taxCalculator");
const { calculateFromUserInput } = require("./calculateFromUserInput");

describe("calculateFromUserInput", () => {
  test("matches calculateTax(normalize(...)) for stringy numbers", () => {
    const raw = {
      income: "100,000",
      taxPaid: "15,000",
      taxYear: 2024,
      gender: "male",
      children: 0,
    };
    const { normalizeToEnginePayload } = require("./normalizeToEnginePayload");
    const direct = calculateTax(normalizeToEnginePayload(raw));
    const via = calculateFromUserInput(raw);
    expect(via.refund).toBe(direct.refund);
    expect(via.netTax).toBe(direct.netTax);
  });
});
