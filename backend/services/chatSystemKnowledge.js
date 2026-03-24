/**
 * טעינת מדריך המוצר (עברית) לצ'אט — קובץ Markdown ב-backend/content.
 * נטען מחדש כשקובץ המקור משתנה (mtime).
 */

const fs = require("fs");
const path = require("path");

const DEFAULT_RELATIVE = "../content/chat-system-knowledge-he.md";

let cachedText = null;
let cachedMtimeMs = null;

function resolveKnowledgePath() {
  const override = process.env.CHAT_SYSTEM_KNOWLEDGE_PATH;
  if (override && String(override).trim()) {
    return path.resolve(process.cwd(), String(override).trim());
  }
  return path.join(__dirname, DEFAULT_RELATIVE);
}

/**
 * @returns {string}
 */
function getChatSystemKnowledgeHe() {
  const filePath = resolveKnowledgePath();
  try {
    const stat = fs.statSync(filePath);
    const m = stat.mtimeMs;
    if (cachedText != null && cachedMtimeMs === m) {
      return cachedText;
    }
    cachedText = fs.readFileSync(filePath, "utf8");
    cachedMtimeMs = m;
    return cachedText;
  } catch (err) {
    console.error("[chatSystemKnowledge] read failed:", filePath, err.message);
    return [
      "[שגיאה: לא נטען קובץ ידע המערכת. בדקו שקיים backend/content/chat-system-knowledge-he.md או הגדרו CHAT_SYSTEM_KNOWLEDGE_PATH.]",
    ].join("\n");
  }
}

/**
 * בלוק טקסט מוכן להדבקה בהקשר ה-LLM
 */
function getChatSystemKnowledgeContextBlock() {
  if (process.env.CHAT_INCLUDE_SYSTEM_KNOWLEDGE === "0") {
    return "";
  }
  const body = getChatSystemKnowledgeHe().trim();
  if (!body) return "";
  return [
    "",
    "### ידע_מערכת (מדריך המוצר — מקור חובה לשאלות על המערכת, מסכים, ניווט וגבולות השירות)",
    body,
    "",
  ].join("\n");
}

/** כותרת H2 בקובץ ה-MD — חילוץ סעיף להגשה רשמית */
const OFFICIAL_FILING_SECTION_HEADING = "## הגשה רשמית מול רשות המיסים";

/**
 * מחלץ מתוך Markdown סעיף שמתחיל בכותרת נתונה עד לפני ## הבאה
 * @param {string} fullMd
 * @param {string} headingLine כולל "## "
 */
function extractMarkdownSectionHe(fullMd, headingLine) {
  if (!fullMd || typeof fullMd !== "string") return "";
  const idx = fullMd.indexOf(headingLine);
  if (idx === -1) return "";
  const from = fullMd.slice(idx);
  const next = from.search(/\n## /);
  const block = next === -1 ? from : from.slice(0, next);
  return block.trim();
}

/**
 * סעיף "איך מגישים מול רשות המיסים" מהמדריך — ל-mock ולעקביות עם ה-LLM
 */
function getOfficialFilingHowToSectionHe() {
  return extractMarkdownSectionHe(
    getChatSystemKnowledgeHe(),
    OFFICIAL_FILING_SECTION_HEADING,
  );
}

module.exports = {
  getChatSystemKnowledgeHe,
  getChatSystemKnowledgeContextBlock,
  getOfficialFilingHowToSectionHe,
  resolveKnowledgePath,
};
