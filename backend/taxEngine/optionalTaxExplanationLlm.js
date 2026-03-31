/**
 * שכבת LLM אופציונלית להסבר תוצאת מס בלבד (על פי AGENT_TAX_SIMULATOR_ROLLOUT — AI LAYER).
 * אסור לחשב מס מחדש או לשנות מספרים; רק ניסוח/המלצות טקסטואליות.
 */

const SYSTEM_PROMPT_HE = `אתה עוזר להסביר תוצאת חישוב מס ישראלי שכבר חושב במערכת.

חוקים קריטיים:
- אסור לחשב מס, החזר או חוב מחדש. אסור לשנות או להמציא סכומים.
- כל מספר שאתה מציין חייב להופיע כבר ב־figures או ב־deterministicNarrative (העתקה בלבד).
- אם אין לך ביטחון במספר — אל תציין מספר; כתוב בהכללה בלבד.
- אל תייעץ כעורך דין או רואה חשבון; זו הדרכה כללית בלבד.
- החזר אך ורק JSON תקני (בלי טקסט לפני או אחרי) בצורה:
{"simpleExplanation":"מחרוזת בעברית עד כ-800 תווים","additionalFollowUps":["שאלה קצרה 1","שאלה 2"]}
- additionalFollowUps: לכל היותר 3 פריטים; אפשר מערך ריק.
- simpleExplanation: פסקה קצרה וברורה למשתמש שאינו מומחה, על בסיס הנתונים שקיבלת.`;

const MAX_SIMPLE_LEN = 1200;
const MAX_FOLLOWUPS = 3;

function isOptionalTaxExplanationLlmEnabled() {
  const v = process.env.TAX_EXPLANATION_LLM;
  if (v !== "1" && v !== "true") return false;
  return !!process.env.OPENAI_API_KEY;
}

/**
 * @param {string} raw
 * @returns {{ simpleExplanation?: string, additionalFollowUps?: string[] } | null}
 */
function parseTaxExplanationLlmJson(raw) {
  if (raw == null || typeof raw !== "string") return null;
  let t = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```\s*$/m.exec(t);
  if (fence) t = fence[1].trim();
  try {
    const o = JSON.parse(t);
    if (!o || typeof o !== "object") return null;
    return {
      simpleExplanation:
        typeof o.simpleExplanation === "string" ? o.simpleExplanation : "",
      additionalFollowUps: Array.isArray(o.additionalFollowUps)
        ? o.additionalFollowUps.filter((x) => typeof x === "string")
        : [],
    };
  } catch {
    return null;
  }
}

function sanitizeLlmOutput(parsed) {
  if (!parsed) return null;
  let exp = String(parsed.simpleExplanation || "").trim();
  if (exp.length > MAX_SIMPLE_LEN) exp = `${exp.slice(0, MAX_SIMPLE_LEN)}…`;
  const ups = (parsed.additionalFollowUps || [])
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, MAX_FOLLOWUPS);
  if (!exp && ups.length === 0) return null;
  return { simpleExplanation: exp, additionalFollowUps: ups };
}

/**
 * @param {object} layer – פלט מ־composeTaxExplanationLayer
 * @param {{ engineValidation?: { warnings?: string[] } }} [opts]
 * @returns {Promise<object>}
 */
async function augmentExplanationLayerWithOptionalLlm(layer, opts = {}) {
  if (!layer || typeof layer !== "object") return layer;
  if (!isOptionalTaxExplanationLlmEnabled()) return layer;

  const engineValidation = opts.engineValidation || {};
  const userPayload = {
    figures: layer.figures || {},
    deterministicNarrative: layer.narrative || "",
    suggestedFollowUps: layer.suggestedFollowUps || [],
    validationWarnings: Array.isArray(engineValidation.warnings)
      ? engineValidation.warnings
      : [],
  };

  try {
    const OpenAI = require("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model =
      process.env.TAX_EXPLANATION_LLM_MODEL ||
      process.env.CHAT_LLM_MODEL ||
      process.env.LLM_MODEL ||
      "gpt-4o-mini";

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT_HE },
        {
          role: "user",
          content: JSON.stringify(userPayload),
        },
      ],
      temperature: 0.25,
      max_tokens: 600,
    });

    const text = response.choices?.[0]?.message?.content?.trim();
    const parsed = sanitizeLlmOutput(parseTaxExplanationLlmJson(text || ""));
    if (!parsed) return layer;

    const llmFollowUps = [...new Set(parsed.additionalFollowUps)];
    return {
      ...layer,
      source: "deterministic+llm",
      llmSimpleExplanation: parsed.simpleExplanation || undefined,
      llmFollowUps: llmFollowUps.length ? llmFollowUps : undefined,
    };
  } catch (err) {
    console.error(
      "[optionalTaxExplanationLlm]",
      err && err.message ? err.message : err,
    );
    return layer;
  }
}

module.exports = {
  isOptionalTaxExplanationLlmEnabled,
  parseTaxExplanationLlmJson,
  augmentExplanationLayerWithOptionalLlm,
  SYSTEM_PROMPT_HE,
};
