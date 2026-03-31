/**
 * normalizeToEnginePayload(rawData)
 * מיפוי וניקוי בלבד — ללא לוגיקת עסקים וללא חישובי מס.
 * מטרה: אובייקט עקבי למנוע כלפי calculateTax ולשכבות עתידיות (validate וכו').
 */

const { defaultFilingStatusFromMarital } = require("./intakeFilingDefaults");

const OPTIONAL_NUMERIC_KEYS = [
  "taxYear",
  "children",
  "childrenUnder6",
  "disabilityPercent",
  "yearsSinceAliyah",
  "childAllowance",
  "taxCredits",
  "additionalIncome",
  "creditPoints",
  "taxWithheld040",
  "taxWithheld043",
  "spouseIncome",
  "spouseTaxPaid",
  "additionalCreditPoints",
];

/**
 * @param {unknown} value
 * @returns {number|undefined}
 */
function toFiniteNumber(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const s = String(value).replace(/,/g, "").trim();
  if (s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * @param {Record<string, unknown>} raw
 * @returns {Record<string, unknown>}
 */
function normalizeToEnginePayload(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("normalizeToEnginePayload: raw data object is required");
  }

  const base = { ...raw };

  let income = toFiniteNumber(base.income);
  if (income === undefined) {
    income = toFiniteNumber(base.fee158);
  }
  if (income !== undefined) {
    base.income = income;
  }

  const taxPaid = toFiniteNumber(base.taxPaid);
  if (taxPaid !== undefined) {
    base.taxPaid = taxPaid;
  }

  for (const key of OPTIONAL_NUMERIC_KEYS) {
    const n = toFiniteNumber(base[key]);
    if (n !== undefined) base[key] = n;
  }

  const pensionDeposits =
    toFiniteNumber(base.pensionDeposits) ??
    toFiniteNumber(base.pensionContribution) ??
    toFiniteNumber(base.pension201) ??
    toFiniteNumber(base.pension230);
  if (pensionDeposits !== undefined) {
    base.pensionDeposits = pensionDeposits;
  }

  if (base.gender != null && typeof base.gender === "string") {
    base.gender = base.gender.trim().toLowerCase();
  }

  if (base.filingStatus != null && typeof base.filingStatus === "string") {
    const fs = base.filingStatus.trim().toLowerCase();
    base.filingStatus = fs === "joint" ? "joint" : "single";
  }

  if (base.filingStatus === undefined || base.filingStatus === null) {
    if (base.maritalStatus != null && String(base.maritalStatus).trim() !== "") {
      base.filingStatus = defaultFilingStatusFromMarital(
        String(base.maritalStatus),
      );
    }
  }

  return base;
}

module.exports = { normalizeToEnginePayload };
