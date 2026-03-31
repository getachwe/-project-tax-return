/**
 * אורקסטרטור לפי ai_main_prompt_v1.txt — פלט JSON: skill, answer, needsClarification, suggestedFollowUps
 */

const fs = require("fs");
const path = require("path");
const { normalizeChatCategory } = require("./chatCategory");
const { normalizeReportsForSkillsPayload } = require("./skills/normalizeForSkills");
const { getChatSystemKnowledgeContextBlock } = require("./chatSystemKnowledge");

const PROMPT_FILE = path.join(
  __dirname,
  "..",
  "..",
  "docs",
  "prompts",
  "ai_main_prompt_v1.txt",
);

let cachedPromptText = null;

function isMainPromptV1Enabled() {
  const v = process.env.CHAT_MAIN_PROMPT_V1;
  return v === "1" || v === "true";
}

function loadPromptSystemText() {
  if (cachedPromptText != null) return cachedPromptText;
  try {
    cachedPromptText = fs.readFileSync(PROMPT_FILE, "utf8");
  } catch (e) {
    console.error(
      "[mainPromptOrchestrator] missing prompt file:",
      PROMPT_FILE,
      e.message,
    );
    cachedPromptText = "";
  }
  return cachedPromptText;
}

function isChatLlmEnabledForOrchestrator() {
  const v = process.env.CHAT_LLM_ENABLED;
  if (v === "0" || v === "false") return false;
  return !!process.env.OPENAI_API_KEY;
}

/**
 * @param {string} raw
 * @returns {object|null}
 */
function parseModelJsonObject(raw) {
  if (raw == null || typeof raw !== "string") return null;
  let t = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```\s*$/m.exec(t);
  if (fence) t = fence[1].trim();
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

/**
 * @param {string} skillRaw
 * @returns {string} ChatCategory value
 */
function mapOrchestratorSkillToCategory(skillRaw) {
  const s = String(skillRaw || "")
    .trim()
    .toUpperCase()
    .replace(/-/g, "_");
  if (s === "GENERAL") return "GENERAL_INFO";
  return normalizeChatCategory(s) || "GENERAL_INFO";
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
 * @param {{ userMessage: string, contextObject: object, historyMessages?: object[] }} args
 * @returns {Promise<null | { ok: true, answer: string, category: string, needsClarification: boolean, suggestedFollowUps: string[], rawSkill: string }>}
 */
async function callMainPromptOrchestrator({
  userMessage,
  contextObject,
  historyMessages = [],
}) {
  if (!isMainPromptV1Enabled() || !isChatLlmEnabledForOrchestrator()) return null;

  const systemText = loadPromptSystemText();
  if (!systemText.trim()) return null;

  const rows = normalizeReportsForSkillsPayload(contextObject);
  const payload = {
    reports: rows,
    mode: contextObject.mode === "guest" ? "guest" : "authenticated",
  };

  /** הקשר קצר למוצר — רק כשאין דוחות או אורח, כדי שלא יאבדו כיוון GENERAL */
  let knowledgeBlock = "";
  if (rows.length === 0 || contextObject.mode === "guest") {
    try {
      knowledgeBlock = getChatSystemKnowledgeContextBlock() || "";
    } catch {
      knowledgeBlock = "";
    }
  }

  const history = trimHistory(historyMessages, 3);
  const historyText =
    history.length > 0
      ? `\n\nהיסטוריית שיחה אחרונה (תמצית):\n${history
          .map((m) => `${m.role}: ${m.content.slice(0, 1200)}`)
          .join("\n")}`
      : "";

  const guestNote =
    contextObject.mode === "guest"
      ? "\n(משתמש אורח — אין דוחות אישיים בנתונים; ענה לפי מצב guest וידע המערכת אם סופק.)"
      : "";

  const userBlock = `שאלת המשתמש:
${String(userMessage || "").trim()}${guestNote}

נתונים (JSON — דוחות מנורמלים ללא PII):
${JSON.stringify(payload)}${knowledgeBlock ? `\n\nעזר נוסף (מוצר / מסכים — כשאין דוח אישי):\n${knowledgeBlock.slice(0, 14_000)}` : ""}${historyText}`;

  const apiKey = process.env.OPENAI_API_KEY;
  const OpenAI = require("openai");
  const openai = new OpenAI({ apiKey });
  const model =
    process.env.CHAT_MAIN_PROMPT_MODEL ||
    process.env.CHAT_LLM_MODEL ||
    process.env.LLM_MODEL ||
    "gpt-4o-mini";

  const maxTokens = Math.min(
    4096,
    Math.max(400, parseInt(process.env.CHAT_MAIN_PROMPT_MAX_TOKENS || "2500", 10)),
  );
  const temperature = Math.min(
    1,
    Math.max(
      0,
      parseFloat(process.env.CHAT_MAIN_PROMPT_TEMPERATURE || "0.35"),
    ),
  );

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemText },
      { role: "user", content: userBlock },
    ],
    response_format: { type: "json_object" },
    temperature,
    max_tokens: maxTokens,
  });

  const raw = response.choices?.[0]?.message?.content;
  const obj = parseModelJsonObject(raw);
  if (!obj || typeof obj !== "object") return null;

  const answer = typeof obj.answer === "string" ? obj.answer.trim() : "";
  if (!answer) return null;

  const rawSkill = typeof obj.skill === "string" ? obj.skill : "GENERAL";
  const category = mapOrchestratorSkillToCategory(rawSkill);
  const needsClarification = Boolean(obj.needsClarification);

  let suggestedFollowUps = [];
  if (Array.isArray(obj.suggestedFollowUps)) {
    suggestedFollowUps = obj.suggestedFollowUps
      .filter((x) => typeof x === "string" && x.trim())
      .map((x) => x.trim())
      .slice(0, 3);
  }

  return {
    ok: true,
    answer,
    category,
    needsClarification,
    suggestedFollowUps,
    rawSkill: rawSkill.trim().toUpperCase(),
  };
}

module.exports = {
  callMainPromptOrchestrator,
  isMainPromptV1Enabled,
  loadPromptSystemText,
  PROMPT_FILE,
};
