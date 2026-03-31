/**
 * תרגום קודי שגיאה/אזהרה מ־validateEngineOutput לעברית (לתצוגת משתמש).
 * הקודים המקוריים נשמרים ב־errors / warnings.
 */

const ERROR_LITERAL = {
  result_object_required: "פלט המנוע חסר או אינו אובייקט תקין.",
  refund_mismatch_effective_minus_net:
    "סכום ההחזר אינו תואם לניכוי המס המשוקי ולמס הנטו — נדרשת בדיקה טכנית.",
};

const WARNING_LITERAL = {
  gross_tax_high_vs_income:
    "המס הגולמי גבוה יחסית להכנסה — כדאי לבדוק את הנתונים מול טופס 106.",
  tax_paid_high_vs_income:
    "סכום הניכויים גבוה יחסית להכנסה — וודא שדות 042, 040 ו-043.",
  refund_exceeds_income_plus_tax_paid_042:
    "סכום ההחזר גבוה במיוחד ביחס להכנסה — מומלץ לבדוק שוב את נתוני הניכוי.",
};

/**
 * @param {string} code
 * @returns {string}
 */
function translateEngineErrorCode(code) {
  if (!code || typeof code !== "string") return String(code);
  if (ERROR_LITERAL[code]) return ERROR_LITERAL[code];
  if (code.startsWith("missing:")) {
    const key = code.slice("missing:".length);
    return `בפלט החישוב חסר ערך לשדה «${key}».`;
  }
  if (code.startsWith("nan:")) {
    const key = code.slice("nan:".length);
    return `השדה «${key}» אינו מספר תקף.`;
  }
  if (code.startsWith("negative:")) {
    const key = code.slice("negative:".length);
    return `השדה «${key}» שלילי — לא אמור בפלט תקין.`;
  }
  return code;
}

/**
 * @param {string} code
 * @returns {string}
 */
function translateEngineWarningCode(code) {
  if (!code || typeof code !== "string") return String(code);
  if (WARNING_LITERAL[code]) return WARNING_LITERAL[code];
  return code;
}

/**
 * מוסיף errorsHe / warningsHe ללא שינוי errors / warnings.
 * @param {{ valid: boolean, errors: string[], warnings: string[] } | null | undefined} validation
 * @returns {{ valid: boolean, errors: string[], warnings: string[], errorsHe: string[], warningsHe: string[] }}
 */
function expandEngineValidationForClient(validation) {
  if (
    !validation ||
    typeof validation !== "object" ||
    Array.isArray(validation)
  ) {
    return {
      valid: false,
      errors: [],
      warnings: [],
      errorsHe: ["תוצאת אימות המנוע חסרה או אינה תקינה."],
      warningsHe: [],
    };
  }
  const errors = Array.isArray(validation.errors) ? validation.errors : [];
  const warnings = Array.isArray(validation.warnings)
    ? validation.warnings
    : [];
  return {
    valid: validation.valid === true,
    errors,
    warnings,
    errorsHe: errors.map(translateEngineErrorCode),
    warningsHe: warnings.map(translateEngineWarningCode),
  };
}

module.exports = {
  translateEngineErrorCode,
  translateEngineWarningCode,
  expandEngineValidationForClient,
  ERROR_LITERAL,
  WARNING_LITERAL,
};
