/**
 * ValidationAgent – וידוא איכות נתונים וזיהוי אי-התאמות.
 * אחריות יחידה: detect missing values, inconsistent data, suspicious inputs.
 */

const REQUIRED_FOR_CALC = ["income", "taxPaid", "taxYear"];

/**
 * בודק שדות חסרים.
 * @param {Record<string, unknown>} data
 * @returns {{ missing: string[] }}
 */
function detectMissing(data) {
  const missing = REQUIRED_FOR_CALC.filter((key) => {
    const v = data[key];
    return v === undefined || v === null || String(v).trim() === "";
  });
  return { missing };
}

/**
 * בודק אי-התאמות (למשל הכנסה גבוהה אבל מס שנוכה אפס).
 * @param {Record<string, unknown>} data
 * @returns {{ warnings: string[] }}
 */
function detectInconsistencies(data) {
  const warnings = [];
  const income = Number(data.income) || 0;
  const taxPaid = Number(data.taxPaid) || 0;

  if (income > 100000 && taxPaid === 0) {
    warnings.push("הכנסה גבוהה אך מס שנוכה 0 – ייתכן שחסר נתון");
  }
  if (income > 0 && taxPaid > income) {
    warnings.push("מס שנוכה גבוה מההכנסה – ייתכן טעות בהזנה");
  }
  const taxYear = Number(data.taxYear) || 0;
  const currentYear = new Date().getFullYear();
  if (taxYear > currentYear || taxYear < currentYear - 10) {
    warnings.push("שנת מס חריגה – בדוק שהערך נכון");
  }

  return { warnings };
}

/**
 * בודק קלט חשוד (ערכים קיצוניים).
 * @param {Record<string, unknown>} data
 * @returns {{ suspicious: string[] }}
 */
function detectSuspicious(data) {
  const suspicious = [];
  const income = Number(data.income) || 0;
  if (income > 5000000) {
    suspicious.push("הכנסה גבוהה מאוד – מומלץ לוודא");
  }
  const children = Math.floor(Number(data.children) || 0);
  if (children > 15) {
    suspicious.push("מספר ילדים חריג");
  }
  return { suspicious };
}

/**
 * מריץ את כל הבדיקות ומחזיר סיכום.
 * @param {Record<string, unknown>} structuredData
 * @returns {{ valid: boolean, errors: string[], warnings: string[], missing: string[] }}
 */
function validate(structuredData) {
  const { missing } = detectMissing(structuredData || {});
  const { warnings } = detectInconsistencies(structuredData || {});
  const { suspicious } = detectSuspicious(structuredData || {});

  const errors = [...missing.map((m) => `שדה חסר: ${m}`)];
  const allWarnings = [...warnings, ...suspicious];
  const valid = errors.length === 0;

  return {
    valid,
    errors,
    warnings: allWarnings,
    missing,
  };
}

module.exports = { validate, detectMissing, detectInconsistencies, detectSuspicious };
