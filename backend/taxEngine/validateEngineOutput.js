/**
 * validateEngineOutput(result)
 * בדיקות דטרמיניסטיות על פלט המנוע — ללא AI.
 * לא משנה תוצאות; רק דיווח valid / errors / warnings.
 */

const REQUIRED_KEYS = [
  "income",
  "grossTax",
  "creditPoints",
  "creditValue",
  "netTax",
  "taxPaid",
  "taxPaidEffective",
  "householdTaxPaidEffective",
  "refund",
  "taxYear",
];

/** שיעור מס גולמי מעל היחס הזה לעומת הכנסה — חריג (שולי מקסימלי ~47%) */
const GROSS_TAX_TO_INCOME_WARN_RATIO = 0.51;

/** מקדם לעומת הכנסה — מס ששולם גבוה מדי (החזקה מופרזת / קלט) */
const TAX_PAID_TO_INCOME_WARN_RATIO = 3;

/**
 * @param {unknown} result
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
function validateEngineOutput(result) {
  const errors = [];
  const warnings = [];

  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return {
      valid: false,
      errors: ["result_object_required"],
      warnings,
    };
  }

  for (const key of REQUIRED_KEYS) {
    if (result[key] === undefined || result[key] === null) {
      errors.push(`missing:${key}`);
    }
  }

  for (const key of REQUIRED_KEYS) {
    const v = result[key];
    if (typeof v === "number" && Number.isNaN(v)) {
      errors.push(`nan:${key}`);
    }
  }

  if (typeof result.income === "number" && result.income < 0) {
    errors.push("negative:income");
  }
  if (typeof result.taxPaid === "number" && result.taxPaid < 0) {
    errors.push("negative:taxPaid");
  }
  if (typeof result.grossTax === "number" && result.grossTax < 0) {
    errors.push("negative:grossTax");
  }
  if (typeof result.netTax === "number" && result.netTax < 0) {
    errors.push("negative:netTax");
  }
  if (typeof result.creditPoints === "number" && result.creditPoints < 0) {
    errors.push("negative:creditPoints");
  }
  if (typeof result.creditValue === "number" && result.creditValue < 0) {
    errors.push("negative:creditValue");
  }
  if (
    typeof result.taxPaidEffective === "number" &&
    result.taxPaidEffective < 0
  ) {
    errors.push("negative:taxPaidEffective");
  }
  if (
    typeof result.householdTaxPaidEffective === "number" &&
    result.householdTaxPaidEffective < 0
  ) {
    errors.push("negative:householdTaxPaidEffective");
  }
  for (const k of ["taxWithheld040", "taxWithheld043", "spouseTaxPaid"]) {
    const x = result[k];
    if (typeof x === "number" && x < 0) {
      errors.push(`negative:${k}`);
    }
  }

  const income = result.income;
  const combinedIncome =
    typeof result.combinedIncome === "number" &&
    Number.isFinite(result.combinedIncome)
      ? result.combinedIncome
      : income;
  const grossTax = result.grossTax;
  const taxPaid042 = result.taxPaid;
  const householdTaxPaidEffective = result.householdTaxPaidEffective;

  if (
    typeof combinedIncome === "number" &&
    typeof grossTax === "number" &&
    Number.isFinite(combinedIncome) &&
    Number.isFinite(grossTax) &&
    combinedIncome >= 0 &&
    grossTax > combinedIncome * GROSS_TAX_TO_INCOME_WARN_RATIO
  ) {
    warnings.push("gross_tax_high_vs_income");
  }

  if (
    typeof combinedIncome === "number" &&
    typeof householdTaxPaidEffective === "number" &&
    Number.isFinite(combinedIncome) &&
    Number.isFinite(householdTaxPaidEffective) &&
    combinedIncome > 0 &&
    householdTaxPaidEffective > combinedIncome * TAX_PAID_TO_INCOME_WARN_RATIO
  ) {
    warnings.push("tax_paid_high_vs_income");
  }

  const refund = result.refund;
  const netTax = result.netTax;
  if (
    typeof householdTaxPaidEffective === "number" &&
    typeof netTax === "number" &&
    typeof refund === "number" &&
    Number.isFinite(householdTaxPaidEffective) &&
    Number.isFinite(netTax) &&
    Number.isFinite(refund) &&
    Math.abs(refund - (householdTaxPaidEffective - netTax)) > 0.02
  ) {
    errors.push("refund_mismatch_effective_minus_net");
  }

  if (
    typeof income === "number" &&
    typeof taxPaid042 === "number" &&
    typeof refund === "number" &&
    Number.isFinite(income) &&
    Number.isFinite(taxPaid042) &&
    Number.isFinite(refund) &&
    income >= 0 &&
    refund > income + taxPaid042 + 1e-6
  ) {
    warnings.push("refund_exceeds_income_plus_tax_paid_042");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

module.exports = { validateEngineOutput };
