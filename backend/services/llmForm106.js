/**
 * שירות LLM לחילוץ/העשרת נתונים מטופס 106.
 * מקבל רק טקסט מאנונימי (אחרי anonymizeFormText) – לא שולח מידע מזהה ל-API.
 */

const { anonymizeFormText } = require("../utils/anonymizeFormText");

// שדות שמזהים אישית – לא לוקחים מהתשובה של ה-LLM, רק מהחילוץ המקומי (regex)
const PII_KEYS = new Set([
  "employeeName",
  "employeeId",
  "employerName",
  "employerId",
  "address",
  "phoneNumber",
  "email",
  "birthDate",
  "managerName",
]);

// שדות שהמערכת צריכה – ה-LLM מחזיר JSON עם המפתחות האלה (ערכים לא מזהים)
const EXTRACTION_KEYS = [
  "income",
  "taxPaid",
  "taxCredits",
  "employmentType",
  "children",
  "workPeriod",
  "creditPoints",
  "additionalIncome",
  "taxYear",
  "workStartDate",
  "workEndDate",
  "childAllowance",
  "disabilityAllowance",
  "oldAgeAllowance",
  "maritalStatus",
  "residency",
  "department",
  "jobTitle",
  "deductions991",
  "deductions182",
  "deductions505",
  "deductions184",
  "deductions176",
  "pension201",
  "pension230",
  "pension2560",
  "pension31446",
  "pension59523",
  "pension11926",
  "formDate",
  "fileNumber",
  "positionNumber",
  "bankAccount",
  "formNumber",
];

// מיפוי קודי טופס 106 לשדות JSON – ה-LLM משתמש בזה לחילוץ מדויק
const FORM106_CODE_MAP = `טופס 106 – חלץ לפי קודים (החזר JSON עם המפתחות באנגלית):
income = קוד 158/172 (סה"כ הכנסה חייבת)
taxPaid = קוד 042 (סה"כ ניכויי מס / מס שנוכה)
taxCredits = קוד 248/249 (נקודות זיכוי / הפרשות מעביד לקופות גמל)
additionalIncome = קוד 045/086 (הכנסה נוספת / הפקדות לקופ"ג)
taxYear = שנת המס (4 ספרות)
creditPoints = מספר נקודות זיכוי
children = מספר ילדים מתחת לגיל 18
workPeriod = תקופת עבודה (חודשים או תיאור)
workStartDate, workEndDate = תאריכים DD/MM/YYYY
maritalStatus = single|married|divorced|widowed
employmentType = full|part|other
employeeId = מספר זהות (9 ספרות)
employeeName / firstName, lastName = שם עובד
employerName = שם המעביד
employerId = ח.פ. / מספר תיק ניכויים
birthDate = תאריך לידה DD/MM/YYYY
address = כתובת
childAllowance, disabilityAllowance, oldAgeAllowance = קצבאות (מספר)
deductions991, deductions182, deductions505, deductions184, deductions176 = ניכויים לפי קוד
pension201, pension230, pension2560, pension31446, pension59523, pension11926 = פנסיה/קופ"ג לפי קוד
formDate, formNumber, fileNumber, positionNumber, bankAccount = מתאריך הטופס`;

const SYSTEM_PROMPT = `אתה מומחה לטופס 106 (דף סיכום שנתי למעסיק). חלץ את כל השדות לפי הקודים והמפתחות שניתנו.
החזר JSON בלבד – בלי markdown, בלי הסברים. מספרים כמספר, תאריכים כ-DD/MM/YYYY או YYYY, מחרוזות בעברית או באנגלית לפי הרשימה.`;

const ALL_KEYS_FOR_RAW = [
  "income",
  "taxPaid",
  "taxCredits",
  "additionalIncome",
  "taxYear",
  "creditPoints",
  "children",
  "workPeriod",
  "workStartDate",
  "workEndDate",
  "maritalStatus",
  "employmentType",
  "employeeId",
  "employeeName",
  "firstName",
  "lastName",
  "employerName",
  "employerId",
  "birthDate",
  "address",
  "phoneNumber",
  "email",
  "childAllowance",
  "disabilityAllowance",
  "oldAgeAllowance",
  "department",
  "jobTitle",
  "deductions991",
  "deductions182",
  "deductions505",
  "deductions184",
  "deductions176",
  "pension201",
  "pension230",
  "pension2560",
  "pension31446",
  "pension59523",
  "pension11926",
  "formDate",
  "fileNumber",
  "positionNumber",
  "bankAccount",
  "formNumber",
  "managerName",
];

function buildUserPrompt(text, useRawKeys = false) {
  const keys = useRawKeys ? ALL_KEYS_FOR_RAW : EXTRACTION_KEYS;
  return `${FORM106_CODE_MAP}

מפתחות JSON (באנגלית): ${keys.join(", ")}

טקסט הטופס:
---
${text}
---

החזר JSON בלבד.`;
}

function buildVisionPrompt() {
  return `${FORM106_CODE_MAP}

מפתחות JSON (באנגלית): ${ALL_KEYS_FOR_RAW.join(", ")}

החזר JSON בלבד.`;
}

/**
 * mergה תוצאות LLM לתוך data – רק שדות לא-PII, ורק כשהערך חסר או ריק.
 * שדות PII תמיד נשארים מהחילוץ המקומי.
 */
function mergeLlmIntoData(data, llmJson) {
  const out = { ...data };
  if (!llmJson || typeof llmJson !== "object") return out;

  for (const key of EXTRACTION_KEYS) {
    if (PII_KEYS.has(key)) continue;
    const current = out[key];
    const fromLlm = llmJson[key];
    if (fromLlm === undefined || fromLlm === null) continue;
    const str = String(fromLlm).trim();
    if (str.startsWith("[") && str.endsWith("]")) continue;
    if (!str) continue;
    if (current === undefined || current === null || String(current).trim() === "") {
      out[key] = typeof fromLlm === "number" ? fromLlm : str;
    }
  }
  return out;
}

/**
 * מחזיר אובייקט אחד: LLM כראשי לכל השדות (חוץ מ-PII), PII רק מ-regex.
 * מתאים לזרימה: "שלח ל-API, קבל JSON מלא, הצג בטופס".
 */
function mergeLlmAsPrimary(regexData, llmJson) {
  const out = { ...regexData };
  if (!llmJson || typeof llmJson !== "object") return out;

  for (const key of EXTRACTION_KEYS) {
    if (PII_KEYS.has(key)) {
      if (regexData[key] !== undefined && regexData[key] !== null && String(regexData[key]).trim() !== "")
        out[key] = regexData[key];
      continue;
    }
    const fromLlm = llmJson[key];
    if (fromLlm === undefined || fromLlm === null) continue;
    const str = String(fromLlm).trim();
    if (str.startsWith("[") && str.endsWith("]")) continue;
    if (str !== "") out[key] = typeof fromLlm === "number" ? fromLlm : str;
  }
  return out;
}

/**
 * קורא ל-OpenAI עם טקסט ומחזיר אובייקט שדות (או null אם נכשל).
 * @param {string} text - טקסט לשליחה (מאנונימי או גולמי לפי skipAnonymization)
 * @param {boolean} useRawKeys - אם true, לבקש גם שדות PII (employeeName, employeeId וכו')
 */
async function enrichFromLlm(text, _currentData, useRawKeys = false) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !text || text.length < 30) {
    return null;
  }

  try {
    const OpenAI = require("openai");
    const openai = new OpenAI({ apiKey });
    const model = process.env.LLM_MODEL || "gpt-4o-mini";

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(text, useRawKeys) },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) return null;

    const cleaned = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const json = JSON.parse(cleaned);
    return json;
  } catch (err) {
    console.error("LLM enrich error:", err.message);
    return null;
  }
}

/**
 * שולח תמונה ישירות ל-Vision API (בלי OCR) – מהיר כמו ChatGPT.
 * מחזיר JSON שחולץ מהתמונה או null.
 */
async function extractForm106ViaVision(imagePath) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !imagePath) return null;

  const fs = require("fs");
  let base64;
  try {
    const buf = fs.readFileSync(imagePath);
    base64 = buf.toString("base64");
  } catch (e) {
    console.error("Vision: cannot read image", e.message);
    return null;
  }

  const mime = (require("path").extname(imagePath) || "").toLowerCase();
  const mediaType = mime === ".png" ? "image/png" : "image/jpeg";

  try {
    const OpenAI = require("openai");
    const openai = new OpenAI({ apiKey });
    const model = process.env.LLM_VISION_MODEL || process.env.LLM_MODEL || "gpt-4o-mini";

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mediaType};base64,${base64}` },
            },
            { type: "text", text: buildVisionPrompt() },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) return null;

    const cleaned = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Vision extract error:", err.message);
    return null;
  }
}

/**
 * מקבל טקסט גולמי (עם PII), מאנונמן, קורא ל-LLM, ומחזיר data מעודכן (merge עם currentData).
 * מידע מזהה נשאר רק מ-currentData.
 */
async function enrichForm106WithLlm(rawText, currentData) {
  if (!rawText || typeof rawText !== "string") return currentData;
  const anonymized = anonymizeFormText(rawText);
  const llmJson = await enrichFromLlm(anonymized, currentData, false);
  if (!llmJson) return currentData;
  return mergeLlmIntoData(currentData, llmJson);
}

/**
 * mergה את תשובת ה-LLM עם regex: כל ערך שה-LLM החזיר נשמר, חסר ממלאים מ-regex.
 */
function mergeLlmResponseAsPrimary(regexData, llmJson) {
  const out = { ...regexData };
  if (!llmJson || typeof llmJson !== "object") return out;
  const allKeys = [...new Set([...Object.keys(out), ...Object.keys(llmJson)])];
  for (const key of allKeys) {
    const fromLlm = llmJson[key];
    if (fromLlm === undefined || fromLlm === null) continue;
    const str = String(fromLlm).trim();
    if (str !== "" && !(str.startsWith("[") && str.endsWith("]")))
      out[key] = typeof fromLlm === "number" ? fromLlm : str;
  }
  return out;
}

/**
 * חילוץ מלא דרך API: שולחים טקסט ל-LLM, מקבלים JSON, מציגים על הטופס.
 *משתנה LLM_SKIP_ANONYMIZATION=true – נשלח הטקסט הגולמי (בלי סינונים) וה-LLM מחזיר גם שדות מזהים.
 */
async function extractForm106ViaLlm(rawText, regexData) {
  if (!rawText || typeof rawText !== "string" || rawText.length < 30) return regexData;

  const skipAnonymization = process.env.LLM_SKIP_ANONYMIZATION === "true" || process.env.LLM_SKIP_ANONYMIZATION === "1";
  const textToSend = skipAnonymization ? rawText : anonymizeFormText(rawText);
  const useRawKeys = skipAnonymization;

  const llmJson = await enrichFromLlm(textToSend, regexData, useRawKeys);
  if (!llmJson) return regexData;

  if (skipAnonymization) {
    return mergeLlmResponseAsPrimary(regexData, llmJson);
  }
  return mergeLlmAsPrimary(regexData, llmJson);
}

module.exports = {
  enrichForm106WithLlm,
  extractForm106ViaLlm,
  extractForm106ViaVision,
  enrichFromLlm,
  mergeLlmIntoData,
  mergeLlmAsPrimary,
  PII_KEYS,
  EXTRACTION_KEYS,
};
