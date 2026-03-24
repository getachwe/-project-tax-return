/**
 * אותה לוגיקה כמו תצוגת MissingDataForm — כדי שוולידציה ושמירה יתאימו למה שהמשתמש רואה בשדות.
 */
export function mergeMissingUploadFieldValues(
  extractedData: Record<string, string | number | undefined>,
  missingValues: Record<string, string | number>
): Record<string, unknown> {
  const yMax = new Date().getFullYear() - 1;
  const defaultTaxYear = yMax;

  return {
    ...extractedData,
    ...missingValues,
    income:
      (Object.prototype.hasOwnProperty.call(missingValues, "income")
        ? missingValues.income
        : extractedData.income) ?? 0,
    taxPaid:
      (Object.prototype.hasOwnProperty.call(missingValues, "taxPaid")
        ? missingValues.taxPaid
        : extractedData.taxPaid) ?? 0,
    taxCredits:
      (Object.prototype.hasOwnProperty.call(missingValues, "taxCredits")
        ? missingValues.taxCredits
        : extractedData.pensionContribution ?? extractedData.taxDeductions) ??
      0,
    workPeriod:
      (Object.prototype.hasOwnProperty.call(missingValues, "workPeriod")
        ? (missingValues as Record<string, string | number>)["workPeriod"]
        : extractedData.workPeriod) ??
      (extractedData.workMonths ? `${extractedData.workMonths} חודשים` : ""),
    creditPoints:
      (Object.prototype.hasOwnProperty.call(missingValues, "creditPoints")
        ? missingValues.creditPoints
        : extractedData.creditPoints) ?? 0,
    children:
      (Object.prototype.hasOwnProperty.call(missingValues, "children")
        ? missingValues.children
        : extractedData.children) ?? 0,
    taxYear:
      (Object.prototype.hasOwnProperty.call(missingValues, "taxYear")
        ? missingValues.taxYear
        : extractedData.taxYear) ?? defaultTaxYear,
  };
}
