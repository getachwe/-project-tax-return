/**
 * אנונימיזציה של טקסט טופס 106 לפני שליחה ל-LLM חיצוני.
 * מידע מזהה (שם, ת.ז., כתובת, מעביד, טלפון, אימייל) מוחלף ב-placeholders
 * כך שאף נתון אישי לא נשלח ל-API חיצוני.
 *
 * שימוש: רק כאשר מחליטים לשלוח טקסט ל-LLM בענן – קוראים ל-anonymizeFormText(text)
 * ומשתמשים בתוצאה לשליחה. הערכים האמיתיים נשארים רק בחילוץ המקומי (regex).
 */

const PLACEHOLDERS = {
  employeeId: "[ת_ז]",
  employeeName: "[שם_עובד]",
  employerName: "[שם_מעביד]",
  employerId: "[ח_פ]",
  address: "[כתובת]",
  phone: "[טלפון]",
  email: "[אימייל]",
  birthDate: "[תאריך_לידה]",
  managerName: "[שם_מנהל]",
};

/**
 * מחליף מספר זהות ישראלי (9 ספרות, אופציונלי מקף) ב-placeholder
 */
function maskIsraeliId(text) {
  // 9 digits, optional dash in the middle (e.g. 123456789 or 123-456-789)
  return text.replace(/\b(\d{1,3}[-]?\d{1,3}[-]?\d{1,3})\b/g, (match) => {
    const digits = match.replace(/-/g, "");
    if (digits.length === 9) return PLACEHOLDERS.employeeId;
    return match;
  });
}

/**
 * מחליף ערך שמופיע אחרי תווית (label) – למשל "שם העובד: ישראל ישראלי" -> "שם העובד: [שם_עובד]"
 */
function maskAfterLabel(text, labelPattern, placeholder) {
  const regex = new RegExp(
    `(${labelPattern})([^\\n]*?)(?=\\n|$|\\s{2,})`,
    "gu"
  );
  return text.replace(regex, (_, label, value) => {
    const trimmed = value.trim();
    if (!trimmed) return _;
    return label + placeholder;
  });
}

/**
 * מחזיר טקסט טופס 106 מאנונימי – מוכן לשליחה ל-LLM חיצוני בלי PII.
 * @param {string} text - טקסט גולמי שחולץ מהטופס (PDF/OCR)
 * @returns {string} טקסט עם placeholders במקום מידע מזהה
 */
function anonymizeFormText(text) {
  if (!text || typeof text !== "string") return text;

  let out = text;

  // מספר זהות (9 ספרות)
  out = maskIsraeliId(out);

  // ח.פ. / ע.מ. (מספרים אחרי התווית)
  out = out.replace(
    /(ח\.פ\.|ע\.מ\.|מספר\s*תיק\s*ניכויים|מס['']?\s*תיק)[\s:\-]+[\d\s\-]+/gi,
    (m) => m.replace(/[\d\s\-]+$/, " " + PLACEHOLDERS.employerId)
  );

  // שם עובד – אחרי תוויות נפוצות
  const nameLabels =
    "שם\\s*העוב[דת]|שם\\s*העובד|שם\\s*פרטי|שם\\s*משפחה|שם\\s*מלא";
  out = maskAfterLabel(out, nameLabels, " " + PLACEHOLDERS.employeeName);

  // שם מעביד/חברה
  const employerLabels = "שם\\s*המעסיק|שם\\s*החברה|שם\\s*המעביד";
  out = maskAfterLabel(out, employerLabels, " " + PLACEHOLDERS.employerName);

  // כתובת
  out = maskAfterLabel(
    out,
    "כתובת\\s*(העובד|מגורים)?|כתובת\\s*בית",
    " " + PLACEHOLDERS.address
  );

  // טלפון
  out = out.replace(
    /(טלפון|מספר\s*טלפון|נייד)[\s:\-]*[\d\-]{7,}/g,
    "$1 " + PLACEHOLDERS.phone
  );

  // אימייל
  out = out.replace(
    /(דוא["']ל|אימייל|E-?mail)[\s:]*[^\s\n]+@[^\s\n]+/g,
    "$1 " + PLACEHOLDERS.email
  );

  // תאריך לידה (מבנה dd/mm/yyyy)
  out = out.replace(
    /(תאריך\s*לידה|תאריך\s*לידת\s*העובד)[\s:\-]*\d{1,2}\/\d{1,2}\/\d{4}/g,
    "$1 " + PLACEHOLDERS.birthDate
  );

  // שם מנהל (אם מופיע)
  out = maskAfterLabel(out, "שם\\s*מנהל|מנהל\\s*מחלקה", " " + PLACEHOLDERS.managerName);

  return out;
}

module.exports = { anonymizeFormText, PLACEHOLDERS };
