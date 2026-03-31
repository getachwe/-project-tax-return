/**
 * כללי ברירת מחדל מ־STEP 0 — מסונכרן עם project/src/utils/intakeFilingDefaults.ts
 */
function defaultFilingStatusFromMarital(maritalStatus) {
  return String(maritalStatus || "").toLowerCase() === "married"
    ? "joint"
    : "single";
}

module.exports = { defaultFilingStatusFromMarital };
