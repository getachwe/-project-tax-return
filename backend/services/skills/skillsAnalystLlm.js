/**
 * קריאת LLM ממוקדת לפי מפרט skills_system_prompt:
 * נתונים מנורמלים ב-JSON + הוראת סקיל + שאלת משתמש.
 */

const {
  ChatCategory,
  classifyChatCategoryWithConfidence,
  getCategoryInstructionHe,
} = require("../chatCategory");
const { skillModuleForChatCategory } = require("./skillRegistry");
const { normalizeReportsForSkillsPayload } = require("./normalizeForSkills");

const SKILLS_ANALYST_BASE_HE = `אתה אנליסט פיננסי. ענה **אך ורק** לפי מפתח "נתונים" (JSON) שמצורף להודעת המשתמש.

כללים:
- אסור להמציא מספרים, שנים או שדות שלא מופיעים ב-JSON.
- אסור להניח ערכים חסרים.
- אם אין בנתונים מספיק כדי לענות — התחל **בדיוק** במשפט:
  "אין מספיק מידע כדי לענות על השאלה"
  ואז אפשר משפט קצר אחד להבהרה (בלי לבקש מהמשתמש להקליד סכומים).
- ניתוח עזר (ממוצע/הפרש בין דוחות) מותר רק כשהוא נגזר ישירות מהערכים ב-JSON.

סגנון: עברית, ברור, מקצועי. זה חישוב משוער לפי קלט במערכת — לא ייעוץ מס מחייב.`;

function isSkillsPipelineEnabled() {
  const v = process.env.CHAT_SKILLS_PIPELINE;
  return v === "1" || v === "true";
}

function isChatLlmEnabledForSkills() {
  const v = process.env.CHAT_LLM_ENABLED;
  if (v === "0" || v === "false") return false;
  return !!process.env.OPENAI_API_KEY;
}

function trimHistory(historyMessages, maxPairs = 3) {
  const h = (historyMessages || []).filter(
    (m) =>
      m &&
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string",
  );
  const cap = maxPairs * 2;
  return h.length <= cap ? h : h.slice(-cap);
}

/**
 * @param {{ contextObject: object, userMessage: string, chatCategory: string|null, historyMessages?: object[] }} args
 * @returns {Promise<string|null>}
 */
async function callSkillsAnalystLlm({
  contextObject,
  userMessage,
  chatCategory,
  historyMessages = [],
}) {
  if (!isSkillsPipelineEnabled() || !isChatLlmEnabledForSkills()) return null;
  if (!contextObject || contextObject.mode !== "authenticated") return null;

  const rows = normalizeReportsForSkillsPayload(contextObject);
  if (!rows.length) return null;

  const classified = classifyChatCategoryWithConfidence(
    userMessage,
    chatCategory,
  );
  /** כללי — נשארים על callOpenAiChat עם ידע_מערכת והקשר מלא */
  if (classified.category === ChatCategory.GENERAL_INFO) return null;

  const skillMeta = skillModuleForChatCategory(classified.category);
  const categoryInstruction = getCategoryInstructionHe(classified.category);

  const systemContent = `${SKILLS_ANALYST_BASE_HE}

### זיהוי סקיל (פנימי): ${skillMeta.id}
### הוראת משימה לסקיל הנוכחי
${categoryInstruction}`;

  const dataJson = JSON.stringify({ reports: rows }, null, 0);

  const userPayload = `שאלת המשתמש:
${userMessage.trim()}

נתונים (JSON — המקור היחיד למספרים):
${dataJson}`;

  const apiKey = process.env.OPENAI_API_KEY;
  const OpenAI = require("openai");
  const openai = new OpenAI({ apiKey });
  const model =
    process.env.CHAT_SKILLS_MODEL ||
    process.env.CHAT_LLM_MODEL ||
    process.env.LLM_MODEL ||
    "gpt-4o-mini";

  const history = trimHistory(historyMessages, 3).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const messages = [
    { role: "system", content: systemContent },
    ...history,
    { role: "user", content: userPayload },
  ];

  const maxTokens = Math.min(
    4096,
    Math.max(256, parseInt(process.env.CHAT_MAX_TOKENS || "2000", 10)),
  );
  const temperature = Math.min(
    1,
    Math.max(0, parseFloat(process.env.CHAT_SKILLS_TEMPERATURE || "0.35")),
  );

  const response = await openai.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  });

  const text = response.choices?.[0]?.message?.content?.trim();
  return text || null;
}

module.exports = {
  callSkillsAnalystLlm,
  isSkillsPipelineEnabled,
  SKILLS_ANALYST_BASE_HE,
};
