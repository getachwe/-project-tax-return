/**
 * הבהרת כוונה — לפי chatbot_prompt.txt (STEP 3, 7, 8)
 * ללא בקשת נתונים פיננסיים מהמשתמש; שימוש בטוקן מוסתר בהיסטוריה.
 */

const CLARIFY_TOKEN = "[[CLARIFY_PENDING]]";

function recentClarificationCount(historyMessages) {
  const arr = historyMessages || [];
  let n = 0;
  const start = Math.max(0, arr.length - 8);
  for (let i = arr.length - 1; i >= start; i--) {
    const m = arr[i];
    if (
      m &&
      m.role === "assistant" &&
      typeof m.content === "string" &&
      m.content.includes(CLARIFY_TOKEN)
    ) {
      n += 1;
    }
  }
  return n;
}

/** האם ההודעה האחרונה של העוזר הייתה בקשת הבהרה */
function lastAssistantWasClarification(historyMessages) {
  const arr = historyMessages || [];
  for (let i = arr.length - 1; i >= 0; i--) {
    const m = arr[i];
    if (!m) continue;
    if (m.role === "assistant") {
      return (
        typeof m.content === "string" && m.content.includes(CLARIFY_TOKEN)
      );
    }
    if (m.role === "user") return false;
  }
  return false;
}

function stripClarifyTokenForDisplay(text) {
  if (typeof text !== "string") return text;
  return text.replace(/\s*\[\[CLARIFY_PENDING\]\]\s*$/, "").trim();
}

/**
 * תשובת הבהרה — בלי לבקש הכנסה/מס; מפנה לנסח מחדש בטקסט חופשי
 * @param {boolean} hasReports
 */
function buildClarificationReplyHe(hasReports) {
  const intro = hasReports
    ? "לא זיהיתי במדויק **מה בדיוק תרצו לדעת** לפי השאלה האחרונה — לפני שאמשיך, כדאי לדייק במילים."
    : "השאלה כללית או שאין דוחות שמורים — לפני שאמשיך, כדאי לדייק במילים.";

  const body = [
    intro,
    "",
    "**נסחו מחדש בקצרה** (בלי להקליד סכומים — רק מה סוג העזרה):",
    "• **סיכום** — תמצית מהדוח האחרון",
    "• **השוואה** — בין דוחות שונים (כשיש יותר מדוח אחד)",
    "• **הסבר** — מה משמעות המספרים והשדות",
    "• **מגמות / חריגות / תובנות** — מה מעניין אתכם בנתונים",
    "",
    "שלחו שוב בשדה הטקסט משפט אחד או שניים — למשל: \"תסביר למה ההחזר 0\" או \"השווה בין שני הדוחות האחרונים\".",
    "",
    CLARIFY_TOKEN,
  ].join("\n");

  return body;
}

module.exports = {
  CLARIFY_TOKEN,
  recentClarificationCount,
  lastAssistantWasClarification,
  stripClarifyTokenForDisplay,
  buildClarificationReplyHe,
};
