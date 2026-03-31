const {
  defaultFilingStatusFromMarital,
} = require("./intakeFilingDefaults");

describe("intakeFilingDefaults (STEP 0)", () => {
  test("married → joint", () => {
    expect(defaultFilingStatusFromMarital("married")).toBe("joint");
    expect(defaultFilingStatusFromMarital("MARRIED")).toBe("joint");
  });

  test("other marital → single", () => {
    expect(defaultFilingStatusFromMarital("single")).toBe("single");
    expect(defaultFilingStatusFromMarital("divorced")).toBe("single");
    expect(defaultFilingStatusFromMarital("widowed")).toBe("single");
    expect(defaultFilingStatusFromMarital("")).toBe("single");
    expect(defaultFilingStatusFromMarital(undefined)).toBe("single");
  });
});
