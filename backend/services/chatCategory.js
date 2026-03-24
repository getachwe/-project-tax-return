/**
 * קטגוריות ניתוח לצ'אט — לפי ai-chatbot-tax-system.prompt.md
 */

const ChatCategory = {
  REPORT_SUMMARY: "REPORT_SUMMARY",
  TRENDS: "TRENDS",
  ANOMALIES: "ANOMALIES",
  DATA_EXPLANATION: "DATA_EXPLANATION",
  YEAR_COMPARISON: "YEAR_COMPARISON",
  INSIGHTS: "INSIGHTS",
  GENERAL_INFO: "GENERAL_INFO",
};

const VALID = new Set(Object.values(ChatCategory));

function normalizeChatCategory(input) {
  if (input == null || typeof input !== "string") return null;
  const u = input.trim().toUpperCase().replace(/-/g, "_");
  return VALID.has(u) ? u : null;
}

/**
 * סיווג + רמת ודאות (לפי chatbot_prompt — כוונה לפני ניתוח מלא)
 * @param {string} message
 * @param {string|null|undefined} explicitCategory
 * @returns {{ category: string, confidence: number }}
 */
function classifyChatCategoryWithConfidence(message, explicitCategory) {
  const norm = normalizeChatCategory(explicitCategory);
  if (norm) return { category: norm, confidence: 1 };

  const t = (message || "").trim();
  if (!t) return { category: ChatCategory.GENERAL_INFO, confidence: 0.35 };

  if (
    /השוואה\s*בין\s*שנים|השווה\s*בין|לעומת\s*שנת|בין\s+הדוחות|שנה\s+מול\s+שנה|year\s*-?\s*comparison|compare\s+years/i.test(
      t,
    )
  ) {
    return { category: ChatCategory.YEAR_COMPARISON, confidence: 0.92 };
  }
  if (
    /סיכום\s*דוח|סיכום\s+הדוח|סקירת\s*דוח|מה\s+יש\s+בדוח|תמצת|overview|report\s*summary|\bsummary\b/i.test(
      t,
    )
  ) {
    return { category: ChatCategory.REPORT_SUMMARY, confidence: 0.9 };
  }
  /**
   * שאלות ממוקדות על החזר/מס/הכנסה בדוח (כולל "למה", "אפס", "הדוח האחרון") —
   * כוונה ברורה להסבר מנתונים; לא ליפול לתפריט הבהרה גנרי.
   */
  if (
    /(?:למה|מדוע|איך\s+ייתכן|איך\s+זה)\s+.*החזר|(?:למה|מדוע)\s+ההחזר|ההחזר\s+של|החזר\s+של|החזר\s*הוא/i.test(
      t,
    ) ||
    /החזר[^\n]{0,48}(\b0\b|אפס)|(\b0\b|אפס)[^\n]{0,24}החזר/i.test(t) ||
    /הדוח\s+האחרון[^\n]{0,56}(החזר|הכנסה|מס\b|\b0\b|אפס)/i.test(t) ||
    /(?:החזר|הכנסה|מס\s*ששולם|מס\s*נטו)[^\n]{0,40}הדוח\s+האחרון|בדוח\s+האחרון/i.test(
      t,
    ) ||
    /(?:למה|מדוע)\s+.*(מס\s*ששולם|מס\s*נטו|הכנסה\b|מס\s*גולמי|נקודות\s*זיכוי)/i.test(
      t,
    ) ||
    /חוב|יתרת\s*חוב|החזר\s*שלילי|מינוס[^\n]{0,12}החזר|זה\s+חוב|האם\s+זה\s+חוב/i.test(
      t,
    )
  ) {
    return { category: ChatCategory.DATA_EXPLANATION, confidence: 0.93 };
  }
  if (/חריג|מוזר|לא\s*רגיל|חשוד|anomal/i.test(t)) {
    return { category: ChatCategory.ANOMALIES, confidence: 0.88 };
  }
  if (
    /מה\s*זה|מה\s*המשמעות|מה\s*זה\s*אומר|מושג|שדה|לא\s+הבנתי|בפשטות|explain|מה\s+אומרים\s+המספרים/i.test(
      t,
    )
  ) {
    return { category: ChatCategory.DATA_EXPLANATION, confidence: 0.9 };
  }
  if (/מגמה|מגמות|שינוי\s*לאורך|לאורך\s*זמן|trend/i.test(t)) {
    return { category: ChatCategory.TRENDS, confidence: 0.88 };
  }
  if (/תובנות|מסקנות|insight/i.test(t)) {
    return { category: ChatCategory.INSIGHTS, confidence: 0.88 };
  }

  const len = t.length;
  const conf =
    len < 8 ? 0.52 : len < 18 ? 0.62 : len < 40 ? 0.68 : 0.74;
  return { category: ChatCategory.GENERAL_INFO, confidence: conf };
}

/**
 * סיווג לפי בחירת משתמש (אם תקינה) או לפי תוכן ההודעה
 * @param {string} message
 * @param {string|null|undefined} explicitCategory
 */
function classifyChatCategory(message, explicitCategory) {
  return classifyChatCategoryWithConfidence(message, explicitCategory).category;
}

function getCategoryInstructionHe(category) {
  const c = normalizeChatCategory(category) || ChatCategory.GENERAL_INFO;
  const M = {
    [ChatCategory.REPORT_SUMMARY]:
      "משימה: **סיכום דוח(ות)** — רק לפי הנתונים בבלוק: שנת דוח, הכנסה, מס, החזר, עיקרי החישוב. בלי להמציא שדות.",
    [ChatCategory.TRENDS]:
      "משימה: **מגמות** — אם יש כמה דוחות, תאר שינוי בהכנסה/מס/החזר בין תקופות; אם דוח אחד, הסבר שמגמה דורשת השוואה בין דוחות שמורים.",
    [ChatCategory.ANOMALIES]:
      "משימה: **חריגות** — רק חריגות הנתמכות מהנתונים (למשל פערים בין מס גולמי, נטו, מס ששולם והחזר).",
    [ChatCategory.DATA_EXPLANATION]:
      "משימה: **הסבר נתונים** — הסבר שדות ומונחים לפי ההקשר. **אל תבקש** מהמשתמש להזין הכנסה, מס או החזר.",
    [ChatCategory.YEAR_COMPARISON]:
      "משימה: **השוואת שנים/דוחות** — השווה לפי מה שמופיע בבלוק בלבד (טבלה או נקודות).",
    [ChatCategory.INSIGHTS]:
      "משימה: **תובנות** — רק מהנתונים; לא ייעוץ מס חיצוני ולא המלצות שלא נשענות על הדוחות.",
    [ChatCategory.GENERAL_INFO]:
      "משימה: **כללי** — ענה **ישירות** על ניסוח השאלה. אם השאלה אינה על נתוני דוח (למשל איך המערכת עובדת, ניווט, האם האפליקציה מגישה, **איך מגישים מול רשות המיסים**) — **אל** תפתחו בסיכום הכנסה/מס מהדוח; לשאלות הגשה מול הרשות השתמשו בסעיף «הגשה רשמית מול רשות המיסים» בידע_מערכת.",
  };
  return M[c] || M[ChatCategory.GENERAL_INFO];
}

module.exports = {
  ChatCategory,
  normalizeChatCategory,
  classifyChatCategory,
  classifyChatCategoryWithConfidence,
  getCategoryInstructionHe,
};
