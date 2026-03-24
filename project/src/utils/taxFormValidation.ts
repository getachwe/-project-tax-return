/** שדות חובה לפני חישוב מס / מעבר לתוצאות — כולל תמיכה במס שנוכה 0 */
export function validateRequiredTaxCalculationFields(
  values: Record<string, unknown>
): Record<string, string> {
  const err: Record<string, string> = {};

  const income = Number(values.income);
  if (
    values.income === "" ||
    values.income === undefined ||
    values.income === null ||
    Number.isNaN(income) ||
    income <= 0
  ) {
    err.income = "שדה חובה";
  }

  const tp = values.taxPaid;
  if (tp === "" || tp === undefined || tp === null) {
    err.taxPaid = "שדה חובה";
  } else {
    const n = Number(tp);
    if (Number.isNaN(n) || n < 0) err.taxPaid = "שדה חובה";
  }

  const yMin = new Date().getFullYear() - 6;
  const yMax = new Date().getFullYear() - 1;
  const rawYear = values.taxYear;
  if (rawYear === "" || rawYear === undefined || rawYear === null) {
    err.taxYear = "שדה חובה";
  } else {
    const ty =
      typeof rawYear === "string"
        ? Number(rawYear.trim())
        : Number(rawYear);
    if (Number.isNaN(ty)) {
      err.taxYear = "שדה חובה";
    } else if (ty < yMin || ty > yMax) {
      err.taxYear = `יש לבחור שנה בין ${yMin} ל־${yMax}`;
    }
  }

  const ms = values.maritalStatus;
  if (ms === undefined || ms === null || String(ms).trim() === "") {
    err.maritalStatus = "שדה חובה";
  }

  return err;
}

export function hasRequiredTaxCalculationData(
  values: Record<string, unknown>
): boolean {
  return Object.keys(validateRequiredTaxCalculationFields(values)).length === 0;
}
