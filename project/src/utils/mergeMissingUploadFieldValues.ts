/**
 * אותה לוגיקה כמו תצוגת MissingDataForm — כדי שוולידציה ושמירה יתאימו למה שהמשתמש רואה בשדות.
 */
export function coerceBool(v: unknown): boolean {
  if (v === true || v === 1 || v === "1") return true;
  if (typeof v === "string" && v.toLowerCase() === "true") return true;
  return false;
}

export function mergeMissingUploadFieldValues(
  extractedData: Record<string, string | number | undefined>,
  missingValues: Record<string, string | number | boolean>
): Record<string, unknown> {
  const yMax = new Date().getFullYear() - 1;
  const defaultTaxYear = yMax;
  const has = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

  const merged: Record<string, unknown> = {
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
    taxWithheld040:
      (Object.prototype.hasOwnProperty.call(missingValues, "taxWithheld040")
        ? missingValues.taxWithheld040
        : extractedData.taxWithheld040) ?? 0,
    taxWithheld043:
      (Object.prototype.hasOwnProperty.call(missingValues, "taxWithheld043")
        ? missingValues.taxWithheld043
        : extractedData.taxWithheld043) ?? 0,
    taxCredits:
      (Object.prototype.hasOwnProperty.call(missingValues, "taxCredits")
        ? missingValues.taxCredits
        : extractedData.pensionContribution ?? extractedData.taxDeductions) ??
      0,
    workPeriod:
      (Object.prototype.hasOwnProperty.call(missingValues, "workPeriod")
        ? (missingValues as Record<string, string | number | boolean>)[
            "workPeriod"
          ]
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

  merged.academicDegree = coerceBool(
    has(missingValues, "academicDegree")
      ? missingValues.academicDegree
      : extractedData.academicDegree
  );
  merged.newImmigrant = coerceBool(
    has(missingValues, "newImmigrant")
      ? missingValues.newImmigrant
      : extractedData.newImmigrant
  );
  merged.livingInPeriphery = coerceBool(
    has(missingValues, "livingInPeriphery")
      ? missingValues.livingInPeriphery
      : extractedData.livingInPeriphery
  );
  const rawYears = has(missingValues, "yearsSinceAliyah")
    ? missingValues.yearsSinceAliyah
    : extractedData.yearsSinceAliyah;
  const nYears = Number(rawYears);
  merged.yearsSinceAliyah = Number.isFinite(nYears) ? nYears : 0;

  const rawFs = has(missingValues, "filingStatus")
    ? missingValues.filingStatus
    : extractedData.filingStatus;
  const fsStr = String(rawFs ?? "single").trim().toLowerCase();
  merged.filingStatus = fsStr === "joint" ? "joint" : "single";

  const rawSpInc = has(missingValues, "spouseIncome")
    ? missingValues.spouseIncome
    : extractedData.spouseIncome;
  const nSpInc = Number(rawSpInc);
  merged.spouseIncome = Number.isFinite(nSpInc) ? nSpInc : 0;

  const rawSpTax = has(missingValues, "spouseTaxPaid")
    ? missingValues.spouseTaxPaid
    : extractedData.spouseTaxPaid;
  const nSpTax = Number(rawSpTax);
  merged.spouseTaxPaid = Number.isFinite(nSpTax) ? nSpTax : 0;

  const rawAcp = has(missingValues, "additionalCreditPoints")
    ? missingValues.additionalCreditPoints
    : extractedData.additionalCreditPoints;
  const nAcp = Number(rawAcp);
  merged.additionalCreditPoints = Number.isFinite(nAcp) ? nAcp : 0;

  return merged;
}
