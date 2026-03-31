/**
 * שירות תשובות לצ'אט: OpenAI (אם מוגדר מפתח) + נפילה ל-mock.
 */

const {
  classifyChatCategory,
  classifyChatCategoryWithConfidence,
  normalizeChatCategory,
  getCategoryInstructionHe,
} = require("./chatCategory");
const {
  buildClarificationReplyHe,
  recentClarificationCount,
  lastAssistantWasClarification,
  stripClarifyTokenForDisplay,
} = require("./chatClarification");
const {
  getChatSystemKnowledgeContextBlock,
  getOfficialFilingHowToSectionHe,
} = require("./chatSystemKnowledge");
const {
  callSkillsAnalystLlm,
  isSkillsPipelineEnabled,
} = require("./skills");
const {
  callMainPromptOrchestrator,
  isMainPromptV1Enabled,
} = require("./mainPromptOrchestrator");

const OUT_OF_CONTEXT_HE =
  "אין מספיק מידע כדי לענות על השאלה.";

const SYSTEM_INSTRUCTIONS_HE = `אתה אנליסט פיננסי-מס במערכת ישראלית. הנתונים בבלוק "הקשר" נשלפים מהמערכת (דוחות שמורים) ועברו סניטציה — ללא מזהים אישיים. זהו מקביל ל־User Data ללא PII: ענו **רק** לפי מה שמופיע שם ובהיסטוריית השיחה.

**דיוק לפני ניחוש:** דיוק ואמינות חשובים מניחוש. אין להמציא או להניח נתונים שלא מופיעים בבלוק ההקשר.

**חוסר מידע:**
- אם **אין כלל** נתון רלוונטי בהקשר כדי לגעת בשאלה (לא ניתן לענות אפילו חלקית בלי להמציא) — **התחל** במשפט המדויק הבא בעברית:
  **אין מספיק מידע כדי לענות על השאלה.**
  אחריו, **אופציונלית**, שאלת הבהרה **אחת** בלבד וקצרה — **בלי** לבקש מהמשתמש להקליד הכנסה, מס או החזר.
- אם **יש** נתונים חלקיים — **אל** תסתפקו במשפט הקצר בלבד: ציינו מה **כן** ידוע מהנתונים, והמשיכו לפי הכללים למטה.

**ניתוח השאלה:** קראו את הודעת המשתמש האחרונה (והיסטוריה אם רלוונטי), זהו במדויק מה הוא שואל — הסבר, השוואה בין דוחות, סיבה למספר מסוים, סיכום וכו'. ענו **ישירות** על השאלה, תוך שימוש **אך ורק** במה שמופיע בבלוק "הקשר" ובשיחה. אין להחזיר תפריט כללי של "בחרו כיוון" אלא אם באמת אין בשאלה שום אפשרות סבירה לקשר להקשר — וגם אז העדיפו לענות ממה ש**כן** ידוע בנתונים.

**שאלות על הגשה רשמית / שליחה לרשות / חיבור ממשלתי (לא נתוני דוח):**
- אם השאלה היא האם **האפליקציה** מגישה/שולחת בשם המשתמש — ענו **ישירות** **לא**; המערכת מספקת חישוב משוער ושמירה אצל המשתמש בלבד; **אסור** לענות במספרי דוח בלבד.
- אם השאלה היא **איך המשתמש מגיש** בקשה/דוח **מול רשות המיסים** (תהליך חיצוני) — ענו לפי סעיף **«הגשה רשמית מול רשות המיסים»** בתוך בלוק **ידע_מערכת** (כיוון כללי: שע"ם / ערוצים רשמיים, בלי פירוט משפטי מחייב). **אל** תסתפקו במשפט "האפליקציה לא מגישה" בלי להסביר מה עושים **מחוץ** לאפליקציה.

**בלוק «ידע_מערכת» בהקשר:** אם מופיע בבלוק "הקשר" כותרת **### ידע_מערכת** — זהו מדריך המוצר (מסכים, נתיבים, מה מותר/אסור בשירות, **והגשה מול רשות המיסים**). לשאלות על **איך משתמשים במערכת**, **איפה מסך**, **ניווט**, **הגדרות**, **התחברות**, **מה האפליקציה עושה או לא עושה**, ו**איך מגישים מול הרשות** — ענו לפי התוכן שם. אם משהו לא מופיע שם — אמרו במפורש שאין בידע המערכת פירוט מדויק, **בלי** להמציא כפתורים או תכונות.

**קישורי ניווט בצ'אט:** כשמפנים למסך באפליקציה, עדיפו תחביר Markdown \`[שם המסך](/נתיב)\` — לדוגמה \`[העלאת מסמכים](/incomes)\`, \`[היסטוריה](/history)\`, \`[עוזר מס](/assistant)\`, \`[הגדרות](/settings)\`, \`[דשבורד](/results)\` או \`[/](/)\`. רק נתיבים שמתחילים ב־\`/\` ואלו הנתיבים בלבד; בלי קישורים חיצוניים בתחביר זה.

**שאלות מושגיות על „מה זה החזר מס” / „איך זה עובד”:** ענו **בהסבר עקרוני** (מה משמעות החזר מס בישראל ברמת כלליות, קשר לניכויים/זיכויים ולמס ששולם). **אל** תחליפו הסבר כזה בתשובה שמציגה **רק** מספר מהדוח. אם יש בבלוק ההקשר החזר משוער — אפשר **בסוף** להוסיף משפט אחד קצר שמציין את המספר כהדגמה מהדוח, אחרי ההסבר.

**שאלות „מה לעשות עם זה” / צעדים / המשך אחרי סיכום:**
כשהמשתמש שואל אחרי סיכום או מספרים מהדוח — למשל „מה אני צריך לעשות”, „מה הצעד הבא”, „איך משתמשים במידע”, „זה אומר ש…” — **אל** תענו בתבנית קבועה וזהה בכל פעם. התאימו את הניסוח ל**מה שכבר נאמר בשיחה** ול**מספרים בפועל** בהקשר (החזר חיובי, שלילי, או אפס; הכנסה; מס ששולם).
- הסבירו **בקצרה** מה המשמעות **העקרונית** של התוצאה במסגרת המערכת (חישוב משוער לפי מה שהוזן), והבדל מול **החלטה רשמית** של רשות המיסים.
- הציעו **כיווני פעולה כלליים** המתאימים למצב: לוודא מול טופס 106; לשמור את הדוח/לעיין בהיסטוריה במערכת; אם הנתונים לא מדויקים — להריץ חישוב מחדש אחרי תיקון; כשיש ספק או מורכבות — לשקול ייעוץ מס מקצועי (בלי לומר „חובה” או לתת ייעוץ משפטי).
- **אסור** לבקש מהמשתמש להקליד סכומים בצ'אט; **אסור** להבטיח החזר או תוצאה מול רשות המיסים.

**מקור נתונים (קריטי — לפי מפרט המערכת):**
- כל מספר פיננסי חייב לבוא **רק** מבלוק "הקשר" (נתונים מהמסד). הניתוח הוא **קריאה** מנתונים קיימים — לא הזנה חדשה על ידי המשתמש בצ'אט.
- **אסור** לבקש מהמשתמש להקליד או לשלוח הכנסה, מס ששולם, החזר או כל נתון פיננסי כדי "לחשב" או להשלים ניתוח.
- **אסור** להסתמך על מספרים שהמשתמש מציע בשיחה כעובדה; אם חסר נתון בקשר — ציין זאת.
- חישובי צבירה (ממוצע/סכום על פני דוחות) מותרים **רק** כשהם נגזרים אך ורק מהשורות שמופיעות בבלוק (או כשחישוב כזה סופק כבר על ידי המערכת בתשובה).

**ניסוח:** התחל ניתוח דוחות בניסוח בסגנון "לפי הדוחות השמורים במערכת…" / "על בסיס הנתונים שסופקו…".

אם אין דוחות בהקשר — אמור במפורש שאין נתונים זמינים לניתוח והסבר מה המערכת מאפשרת באופן כללי (בלי לבקש סכומים).

סגנון ואיכות:
- נתח, הסבר, השווה — לפי הקשר והיסטוריית השיחה בלבד.
- כשיש נתונים חלקיים: **אסור לסיים רק** במשפט חוסר המידע המלא — ציינו מה **כן** ידוע, והצע המשך (סיכום / השוואה / הסבר מושגים) **בלי** לבקש מהמשתמש להזין סכומים.
- הודעות כלליות ("מה אתה יודע?"): הסבר תפקיד, הצע סוגי ניתוח (קטגוריות) והפנה לדוחות כשקיימים.
- שאלות "מה זה אומר?" — התייחס לדוח העדכני ביותר ולפירוט בקשר.

אם יש דוח יחיד ושואלים על ממוצע — הסבר שהממוצע שווה לערך בדוח זה.

**המשכים (אחרי ניתוח מלא):** בסוף התשובה הוסיפו פסקה קצרה עם **1–3** הצעות לשאלות המשך רלוונטיות בעברית (למשל "אפשרויות המשך: … · … · …") — **בלי** לבקש מהמשתמש להקליד סכומים או נתוני מס.

סיים בתזכורת קצרה: חישוב משוער, לא ייעוץ מס, לא מחייב את רשות המיסים.`;

function fmtMoneyHe(n) {
  if (n == null || !Number.isFinite(Number(n))) return null;
  return `${Math.round(Number(n)).toLocaleString("he-IL")} ₪`;
}

/** תשובת עזרה כשאין התאמה טובה — אורח */
function buildGuestHelpReply(userMessage) {
  const msg = (userMessage || "").trim();
  const taxAdjacent =
    /מע״מ|מע"מ|מקדם|החזר|ניכוי|טופס|עובד|שכיר|מס\s*הכנסה|ביטוח\s*לאומי|ילדים|זיכוי/i.test(
      msg,
    );
  if (taxAdjacent) {
    return [
      "במצב **אורח** אין לי גישה לדוח או לסכומים האישיים שלך — רק למידע כללי על המערכת.",
      "",
      "באופן כללי: אפשר להעלות טופס 106 (PDF) או למלא שדות ידנית, והמערכת מחשבת **החזר משוער** לפי מה שהוזן. זה לא ייעוץ מס ולא מחליף החלטת רשות המיסים.",
      "",
      "**כדי שאענה לפי המספרים שלך:** התחבר לחשבון ופתח את העוזר מתוך האפליקציה (דשבורד → עוזר מס), לא ממסך ההתחברות בלבד.",
      "",
      "דוגמאות לשאלות שכן מתאימות כאן כאורח:",
      "• איך מעלים טופס 106?",
      "• איפה נשמרת היסטוריית דוחות?",
      "• איך נרשמים או מתחברים?",
    ].join("\n");
  }
  return [
    "אני עוזר מס של האפליקציה — מתמקד בטופס 106, חישוב החזר משוער והנחיות שימוש.",
    "",
    "במצב **אורח** אין לי גישה לדוחות או לסכומים האישיים שלך.",
    "",
    "מה כן אפשר לשאול כאן:",
    "• איך מעלים מסמך או ממלאים טופס ידני",
    "• איפה רואים דוחות שמורים (אחרי התחברות)",
    "• איך עובד חישוב ההחזר ברמת עקרון",
    "",
    "**לשאלות לפי הדוח שלך** (החזר, הכנסה, פירוט) — התחברו ושאלו מתוך העוזר בדשבורד.",
    "",
    "טיפ: כתבו במילים פשוטות מה אתם רוצים לדעת — למשל \"מה ההחזר\" או \"תסביר את המספרים\" — אחרי שיש דוח שמור.",
  ].join("\n");
}

/** אין דוחות במערכת — משתמש מחובר */
function buildNoReportsHelpReply() {
  return [
    "**אין נתונים זמינים לניתוח** לפי המערכת — אין דוחות שמורים בחשבון.",
    "",
    "**מה לעשות עכשיו:**",
    "1. כנסו ל\"העלאת מסמכים\" — העלו PDF של טופס 106 או מלאו את השדות ידנית.",
    "2. הריצו חישוב ו**שמרו** את הדוח.",
    "3. חזרו לכאן ושאלו, למשל: \"מה ההחזר בדוח האחרון?\" או \"תסביר את המספרים בפשטות\".",
    "",
    "תזכורת: החישוב במערכת הוא משוער — לא ייעוץ מס ולא מחייב את רשות המיסים.",
  ].join("\n");
}

/** שאלה על מושג החזר מס / איך זה עובד — לא רק מספר מהדוח */
function wantsConceptualTaxRefundQuestion(msg) {
  const t = (msg || "").trim();
  if (!t) return false;
  return (
    /מה\s+זה\s+(החזר|ההחזר|חזר\s*מס|החזר\s*מס)/i.test(t) ||
    /מהו\s+(החזר|החזר\s*מס)/i.test(t) ||
    /תסביר.{0,100}(מה\s+זה\s+)?(החזר|החזר\s*מס|חזר\s*מס)/i.test(t) ||
    /איך\s+עובד.{0,60}(החזר|החזר\s*מס|חזר\s*מס)/i.test(t) ||
    (/איך\s+(זה\s+)?עובד.{0,20}\?/.test(t) &&
      /החזר|חזר\s*מס/i.test(t)) ||
    /הסבר\s+(על\s+)?(החזר|חזר\s*מס)/i.test(t) ||
    /מה\s+המשמעות.{0,40}(של\s+)?(החזר|החזר\s*מס)/i.test(t) ||
    /מה\s+ההבדל.{0,50}החזר/i.test(t) ||
    /למה\s+קור(א|ה)\s+החזר|למה\s+יש\s+החזר/i.test(t) ||
    /what\s+is\s+a\s+tax\s+refund|how\s+does\s+tax\s+refund/i.test(t)
  );
}

function buildConceptualTaxRefundReplyHe(contextObject) {
  const parts = [
    "**מה זה החזר מס (ברמת עקרון):** בדרך כלל מדובר במצב שבו לפי כללי מס הכנסה, אחרי חישוב המס החייב **לפי הנתונים** (הכנסה, ניכויים, נקודות זיכוי וכו'), מתקבל ש**שילמת יותר מס** ממה שנדרש לשנה הנבדקת. אזי, לפי כללי רשות המיסים, **עשוי** להיווצר יתר שמטופל כהחזר או כקיזוז — לפי הנהלים והדוח הרשמי שלך.",
    "",
    "**איך זה קשור לאפליקציה הזו:** כאן מחשבים **החזר משוער** על בסיס מה שהזנת (למשל מטופס 106): משווים בין המס \"המחושב\" לבין המס ששולם. **ערך חיובי** — לפי המודל יש החזר משוער; **ערך שלילי** — לפי המודל יש יתרת תשלום (לא החזר).",
    "",
    "זה **חישוב משוער** לפי הקלט — לא ייעוץ מס ולא מחליף החלטה של רשות המיסים.",
  ];
  const r = contextObject.latestReport;
  if (contextObject.mode === "authenticated" && r) {
    const calc = r.calculation || {};
    const refund =
      num(calc.refundAmount) ??
      num(calc.totalRefund) ??
      num(calc.refund);
    if (refund != null) {
      parts.push(
        "",
        `**לצורך הקשר:** בדוח האחרון ששמור אצלך במערכת ההחזר המשוער הוא בערך **${refund.toLocaleString("he-IL")} ₪** — זה **בנוסף** להסבר למעלה, לא במקום הסבר המושג.`,
      );
    }
  }
  return parts.join("\n");
}

/** יש דוחות אבל השאלה לא הותאמה — סיכום מה יש + הצעות */
function buildReportAwareHelpReply(contextObject, userMessage) {
  if (wantsCapabilityOrientationQuestion(userMessage)) {
    return buildCapabilityOrientationReply(contextObject, userMessage);
  }
  if (wantsConceptualTaxRefundQuestion(userMessage)) {
    return buildConceptualTaxRefundReplyHe(contextObject);
  }

  const r = contextObject.latestReport;
  if (!r) return buildNoReportsHelpReply();

  const nReports = getReportsArray(contextObject).length;

  const td = r.taxData || {};
  const calc = r.calculation || {};
  const ins = r.insights || {};
  const refund =
    ins.refund ??
    num(calc.refundAmount) ??
    num(calc.totalRefund) ??
    num(calc.refund);
  const income = ins.income ?? num(td.income);
  const paid = ins.taxPaid ?? num(td.taxPaid);
  const year = r.reportYear;

  const lines = [
    "לא הצלחתי לכוון בדיוק לחלק בשאלה — אבל הנה מה ש**כן** מופיע אצלי מהדוח **העדכני ביותר** במערכת:",
    "",
  ];
  if (year != null) lines.push(`• שנת דוח: ${year}`);
  if (income != null) lines.push(`• הכנסה (כפי שהוזנה): ${fmtMoneyHe(income)}`);
  if (paid != null) lines.push(`• מס ששולם: ${fmtMoneyHe(paid)}`);
  if (refund != null) lines.push(`• החזר משוער: ${fmtMoneyHe(refund)}`);
  if (ins.taxRate != null && Number.isFinite(ins.taxRate)) {
    lines.push(`• יחס מס להכנסה (משוער): כ-${(ins.taxRate * 100).toFixed(1)}%`);
  }
  const gTax = num(calc.grossTax);
  const nTax = num(calc.netTax);
  if (gTax != null) lines.push(`• מס גולמי בחישוב: ${fmtMoneyHe(gTax)}`);
  if (nTax != null) lines.push(`• מס נטו בחישוב: ${fmtMoneyHe(nTax)}`);

  if (lines.length <= 3) {
    lines.push(
      "• (חלק מהשדות לא מופיעים בדוח השמור — אם חסר פירוט, הריצו חישוב מחדש ושמרו דוח.)",
    );
  }

  lines.push(
    "",
    "אפשר לשאול שוב **במילים שלכם** בשדה הטקסט — למשל על החזר, מס נטו מול מס ששולם, או פירוט מהדוח.",
    nReports > 1 ? "כשיש כמה דוחות — אפשר לבקש השוואה בין שנים." : "",
    "",
    "אם השאלה על שדה ספציפי בטופס 106 — ציינו את מס השדה או את השם כפי שמופיע אצלכם בטופס.",
    "",
    "תזכורת: חישוב משוער, לא ייעוץ מס.",
  );
  return lines.join("\n");
}

/**
 * תשובת ברירת מחדל מועילה כשאין התאמה טובה (במקום משפט יבש בלבד)
 */
function buildContextualHelpReply(userMessage, contextObject, opts = {}) {
  if (opts.offTopicGuest) {
    return [
      "לא מתמחה בנושא הזה בצ'אט הזה.",
      "",
      buildGuestHelpReply(userMessage),
    ].join("\n");
  }
  if (contextObject.mode === "guest") {
    return buildGuestHelpReply(userMessage);
  }
  const reports = getReportsArray(contextObject);
  if (!reports.length) {
    return buildNoReportsHelpReply();
  }
  const data = tryDataDrivenFallback(userMessage, contextObject);
  if (data) return data;
  return buildReportAwareHelpReply(contextObject, userMessage);
}

/** האם תשובת המודל כמעט ריקה / גנרית מדי */
function looksLikeUnhelpfulModelReply(text) {
  if (text == null || typeof text !== "string") return true;
  const t = text.trim();
  if (!t) return true;
  /** תשובה מכוונת לפי מפרט — לא להחליף ב-mock */
  if (/^אין\s+מספיק\s+מידע\s+כדי\s+לענות\s+על\s+השאלה/.test(t)) {
    return false;
  }
  if (
    /אין\s+לי\s+מספיק\s+מידע|אין\s+מספיק\s+מידע|לא\s+ניתן\s+לענות|קשה\s+לי\s+לענות|לא\s+יודע\s+לענות|אין\s+בידי\s+מידע|לא\s+מצליח\s+לענות|אין\s+נתונים\s+מספיק/i.test(
      t,
    )
  ) {
    return true;
  }
  if (t.length < 40 && /לא\s+יודע|אין\s+לי|סליחה/i.test(t)) return true;
  return false;
}

function isChatLlmEnabled() {
  const v = process.env.CHAT_LLM_ENABLED;
  if (v === "0" || v === "false") return false;
  return !!process.env.OPENAI_API_KEY;
}

/**
 * בניית בקשת OpenAI לצ'אט (משותף ל-stream וללא stream).
 * @param {{ role: string, content: string }[]} historyMessages
 */
function buildOpenAiChatRequest({
  contextObject,
  userMessage,
  historyMessages,
  chatCategory,
}) {
  const model =
    process.env.CHAT_LLM_MODEL ||
    process.env.LLM_MODEL ||
    "gpt-4o-mini";

  const contextBlock = safeContextToPromptBlock(contextObject);
  const cat =
    chatCategory != null
      ? chatCategory
      : classifyChatCategory(userMessage, null);
  const categoryBlock = getCategoryInstructionHe(cat);

  const systemContent = `${SYSTEM_INSTRUCTIONS_HE}

### קטגוריית ניתוח (רמז בלבד — עדיפות מוחלטת לשאלת המשתמש): ${cat}
${categoryBlock}

### הקשר — מאגר המידע שאליו מותר לך לגשת (דוחות מהמערכת); כל מספר חייב לבוא משורות כאן
${contextBlock}`;

  const history = (historyMessages || []).filter(
    (m) =>
      m &&
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string",
  );

  const messages = [
    { role: "system", content: systemContent },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  const maxTokens = Math.min(
    8000,
    Math.max(256, parseInt(process.env.CHAT_MAX_TOKENS || "2000", 10)),
  );
  const temperature = Math.min(
    1,
    Math.max(0, parseFloat(process.env.CHAT_TEMPERATURE || "0.45")),
  );

  return { model, messages, temperature, max_tokens: maxTokens };
}

/**
 * @param {{ role: string, content: string }[]} historyMessages
 */
async function callOpenAiChat({
  contextObject,
  userMessage,
  historyMessages,
  chatCategory,
}) {
  if (!isChatLlmEnabled()) return null;

  const apiKey = process.env.OPENAI_API_KEY;
  const OpenAI = require("openai");
  const openai = new OpenAI({ apiKey });
  const { model, messages, temperature, max_tokens } = buildOpenAiChatRequest({
    contextObject,
    userMessage,
    historyMessages,
    chatCategory,
  });

  const response = await openai.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens,
  });

  const text = response.choices?.[0]?.message?.content?.trim();
  return text || null;
}

/**
 * אותה לוגיקה כמו callOpenAiChat אבל מחזירה טקסט תוך קריאה ל-onDelta על כל קטע.
 * @param {{ onDelta: (s: string) => void } & Parameters<typeof buildOpenAiChatRequest>[0]} args
 */
async function callOpenAiChatStream({
  contextObject,
  userMessage,
  historyMessages,
  chatCategory,
  onDelta,
}) {
  if (!isChatLlmEnabled()) return null;
  if (typeof onDelta !== "function") {
    return callOpenAiChat({
      contextObject,
      userMessage,
      historyMessages,
      chatCategory,
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const OpenAI = require("openai");
  const openai = new OpenAI({ apiKey });
  const { model, messages, temperature, max_tokens } = buildOpenAiChatRequest({
    contextObject,
    userMessage,
    historyMessages,
    chatCategory,
  });

  const stream = await openai.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens,
    stream: true,
  });

  let full = "";
  for await (const chunk of stream) {
    const piece = chunk.choices?.[0]?.delta?.content ?? "";
    if (piece) {
      full += piece;
      onDelta(piece);
    }
  }
  const text = full.trim();
  return text || null;
}

function num(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** הסבר מילולי פשוט למספרי דוח (כשאין LLM או כשהמשתמש שואל "מה זה אומר") */
function buildPlainMeaningHe(td, calc) {
  const inc = num(td.income);
  const paid = num(td.taxPaid);
  const refund =
    num(calc.refundAmount) ??
    num(calc.totalRefund) ??
    num(calc.refund);
  const gTax = num(calc.grossTax);
  const nTax = num(calc.netTax);
  const cPts = calc.creditPoints;
  const cVal = num(calc.creditValue);

  const fmt = (n) =>
    n == null ? "" : Math.round(n).toLocaleString("he-IL");

  const lines = ["בקצרה, לפי החישוב השמור במערכת:", ""];

  if (inc != null) {
    lines.push(
      `• ההכנסה החייבת במס (לפי מה שהוזן) היא בערך ${fmt(inc)} ₪ — על סכום זה מחושבים המס והזיכויים.`,
    );
  }
  if (gTax != null) {
    lines.push(
      `• "מס גולמי" (בערך ${fmt(gTax)} ₪) הוא המס התיאורטי לפני ניכוי נקודות זיכוי.`,
    );
  }
  if (cPts != null && String(cPts).trim() !== "") {
    lines.push(
      `• נקודות זיכוי (${cPts}) מקטינות את המס. שווי הנקודות בחישוב הוא בערך ${cVal != null ? `${fmt(cVal)} ₪` : "כפי שמופיע בפירוט המערכת"}.`,
    );
  }
  if (nTax != null) {
    lines.push(
      nTax <= 0
        ? `• "מס נטו" 0 ₪ אומר שלאחר ניכוי נקודות הזיכוי לא נשאר מס לשלם לפי החישוב (הזיכויים "כיסו" את המס הגולמי).`
        : `• "מס נטו" (בערך ${fmt(nTax)} ₪) הוא המס שנשאר לשלם אחרי זיכויים.`,
    );
  }
  if (paid != null) {
    lines.push(
      `• "מס ששולם" (בערך ${fmt(paid)} ₪) הוא מה שנוכה בפועל לפי הנתונים שהזנת.`,
    );
  }
  if (refund != null) {
    if (refund > 0) {
      lines.push(
        `• החזר משוער בערך ${fmt(refund)} ₪ — לרוב כששילמת יותר מס מהמס הנטו המחושב, נשאר עודף.`,
      );
    } else if (refund === 0) {
      lines.push(
        `• החזר 0 ₪: לפי הנתונים והחישוב, אין "עודף" מס שמזכה בהחזר (למשל אם לא שילמת מס בפועל מעבר למס הנטו, או שהמספרים מאוזנים).`,
      );
    } else {
      lines.push(
        `• מופיע יתרת חוב מס משוערת של כ-${fmt(Math.abs(refund))} ₪ — לפי ההפרש בין המס המחושב לבין מה ששולם.`,
      );
    }
  }

  lines.push(
    "",
    "זה חישוב משוער של המערכת בלבד — לא החלטת רשות המיסים ולא ייעוץ מס; כדאי לוודא מול טופס 106.",
  );
  return lines.join("\n");
}

function wantsPlainMeaningQuestion(msg) {
  const t = (msg || "").trim();
  return (
    /מה\s*זה\s*אומר|מה\s+זאת\s+אומרת|לא\s+הבנתי|בפשטות|תסביר\s+לי\s+בקצרה|מה\s+המספרים\s+אומרים|פשוט\s+מה/i.test(
      t,
    ) ||
    (/^מה\s+זה\??$/i.test(t) && t.length < 20)
  );
}

function getReportsArray(ctx) {
  if (ctx.reports && ctx.reports.length) return ctx.reports;
  return ctx.latestReport ? [ctx.latestReport] : [];
}

/** שאלה על ממוצע / סכום על פני דוחות */
function wantsAggregateOrSumQuestion(m) {
  const t = (m || "").trim();
  if (
    /ממוצע|ממוצעים|בממוצע|מה\s*הממוצע|חשב\s*ממוצע|average|\bmean\b/i.test(t)
  ) {
    return true;
  }
  if (
    /סה[\"״]כ|סך\s*הכל|סכום\s*כולל|כמה\s+בסך/i.test(t) &&
    /דוח|דוחות|כל\s*ה|יחד|ביחד|שנים|שנה|הכל/i.test(t)
  ) {
    return true;
  }
  return false;
}

function extractIncomeForAgg(rep) {
  const ins = rep?.insights?.income;
  if (ins != null && Number.isFinite(Number(ins))) return Number(ins);
  return num((rep?.taxData || {}).income);
}

function extractTaxPaidForAgg(rep) {
  const ins = rep?.insights?.taxPaid;
  if (ins != null && Number.isFinite(Number(ins))) return Number(ins);
  const td = rep?.taxData || {};
  const c = rep?.calculation || {};
  return num(td.taxPaid) ?? num(c.taxPaid);
}

function extractRefundForAgg(rep) {
  const ins = rep?.insights?.refund;
  if (ins != null && Number.isFinite(Number(ins))) return Number(ins);
  const c = rep?.calculation || {};
  return num(c.refundAmount) ?? num(c.totalRefund) ?? num(c.refund);
}

function extractGrossTaxForAgg(rep) {
  return num((rep?.calculation || {}).grossTax);
}

function extractNetTaxForAgg(rep) {
  return num((rep?.calculation || {}).netTax);
}

function formatAvgLine(label, vals) {
  if (!vals.length) return null;
  const n = vals.length;
  const sum = vals.reduce((a, b) => a + b, 0);
  const avg = sum / n;
  const rounded = Math.round(avg);
  if (n === 1) {
    return `• **${label}:** ${rounded.toLocaleString("he-IL")} ₪ — יש רק דוח אחד בהקשר, ולכן הממוצע זהה לערך בדוח הזה.`;
  }
  return `• **${label}:** ממוצע **${rounded.toLocaleString("he-IL")} ₪** (סכום ${Math.round(sum).toLocaleString("he-IL")} ₪ לפי ${n} דוחות עם ערך בשדה זה).`;
}

function formatSumLine(label, vals) {
  if (!vals.length) return null;
  const sum = vals.reduce((a, b) => a + b, 0);
  return `• **${label} (סכום):** ${Math.round(sum).toLocaleString("he-IL")} ₪ (על פני ${vals.length} דוחות עם ערך בשדה זה).`;
}

/**
 * חישוב ממוצעים/סכומים על פני כל הדוחות בקונטקסט (מתמטיקה בשרת — לא תלוי ב-LLM)
 */
function tryAggregateReportsReply(userMessage, contextObject) {
  if (contextObject.mode !== "authenticated") return null;
  if (!wantsAggregateOrSumQuestion(userMessage)) return null;

  const reports = getReportsArray(contextObject);
  if (!reports.length) return null;

  const wantsSumOnly =
    /סה[\"״]כ|סך\s*הכל|סכום\s*כולל|כמה\s+בסך/i.test(userMessage) &&
    !/ממוצע|average|\bmean\b/i.test(userMessage);

  const incs = reports.map(extractIncomeForAgg).filter((v) => v != null);
  const paids = reports.map(extractTaxPaidForAgg).filter((v) => v != null);
  const refs = reports.map(extractRefundForAgg).filter((v) => v != null);
  const gTaxes = reports.map(extractGrossTaxForAgg).filter((v) => v != null);
  const nTaxes = reports.map(extractNetTaxForAgg).filter((v) => v != null);

  const lines = [];
  if (wantsSumOnly) {
    lines.push(
      `**סיכום סכומים** על פי **${reports.length}** דוח(ות) שנטענו בהקשר (מהחדש לישן):`,
      "",
    );
    const s1 = formatSumLine("הכנסה (כפי שהוזנה)", incs);
    const s2 = formatSumLine("מס ששולם", paids);
    const s3 = formatSumLine("החזר משוער", refs);
    const s4 = formatSumLine("מס גולמי בחישוב", gTaxes);
    const s5 = formatSumLine("מס נטו בחישוב", nTaxes);
    [s1, s2, s3, s4, s5].forEach((x) => {
      if (x) lines.push(x);
    });
  } else {
    lines.push(
      `**ממוצעים** לפי **${reports.length}** דוח(ות) שנטענו בהקשר (מהחדש לישן):`,
      "",
    );
    const a1 = formatAvgLine("הכנסה (כפי שהוזנה)", incs);
    const a2 = formatAvgLine("מס ששולם", paids);
    const a3 = formatAvgLine("החזר משוער", refs);
    const a4 = formatAvgLine("מס גולמי בחישוב", gTaxes);
    const a5 = formatAvgLine("מס נטו בחישוב", nTaxes);
    [a1, a2, a3, a4, a5].forEach((x) => {
      if (x) lines.push(x);
    });
  }

  const anyNumbers =
    incs.length + paids.length + refs.length + gTaxes.length + nTaxes.length >
    0;
  if (!anyNumbers) {
    return [
      `יש ${reports.length} דוח(ות) בהקשר, אבל חסרים מספרים בשדות העיקריים — לא ניתן לחשב ממוצע או סכום.`,
      "",
      "מה לעשות: להריץ חישוב מחדש ב\"העלאת מסמכים\" ולוודא שהדוח נשמר עם הכנסה/מס/החזר.",
    ].join("\n");
  }

  lines.push("", "**ערכים לפי דוח (לצורך הבהרה):**");
  const cap = Math.min(reports.length, 18);
  for (let i = 0; i < cap; i++) {
    const rep = reports[i];
    const y = rep.reportYear ?? "—";
    const label = rep.label ? ` (${rep.label})` : "";
    const inc = extractIncomeForAgg(rep);
    const ref = extractRefundForAgg(rep);
    const paid = extractTaxPaidForAgg(rep);
    const bits = [];
    if (inc != null) bits.push(`הכנסה ${Math.round(inc).toLocaleString("he-IL")} ₪`);
    if (paid != null) bits.push(`מס ששולם ${Math.round(paid).toLocaleString("he-IL")} ₪`);
    if (ref != null) bits.push(`החזר ${Math.round(ref).toLocaleString("he-IL")} ₪`);
    if (bits.length) {
      lines.push(`• שנת ${y}${label}: ${bits.join(", ")}`);
    } else {
      lines.push(`• שנת ${y}${label}: אין סכומים מספריים מלאים בדוח זה בהקשר.`);
    }
  }
  if (reports.length > cap) {
    lines.push(`• …ועוד ${reports.length - cap} דוחות (לא הוצגו כאן).`);
  }

  lines.push(
    "",
    "חישוב לפי נתונים שמורים במערכת בלבד — משוער, לא ייעוץ מס ולא מחייב את רשות המיסים.",
  );
  return lines.join("\n");
}

/** JSON.stringify בטוח — BigInt / ערכים בעייתיים לא יפילו את הצ'אט */
function safeJsonStringify(obj, space = 2) {
  try {
    return JSON.stringify(
      obj,
      (_key, value) => {
        if (typeof value === "bigint") return value.toString();
        if (value instanceof Date) return value.toISOString();
        if (typeof value === "function") return undefined;
        return value;
      },
      space,
    );
  } catch (err) {
    return `{"_serialize_error":"${String(err.message).slice(0, 200)}"}`;
  }
}

const MAX_REPORT_BLOCK_CHARS = 55000;

function formatReportBlockForContext(rep, ordinal) {
  const td = rep.taxData || {};
  const calc = rep.calculation || {};
  const taxJson = safeJsonStringify(td, 2);
  const calcJson = safeJsonStringify(calc, 2);
  const combined = [
    `### דוח ${ordinal}`,
    rep.label ? `- תווית: ${rep.label}` : null,
    `- שנת דוח: ${rep.reportYear ?? "לא ידוע"}`,
    `- תאריך שמירה: ${rep.createdAt || "לא ידוע"}`,
    rep.fileName ? `- קובץ: ${rep.fileName}` : null,
    "#### tax_data (קלט / שדות טופס — ללא שדות מזהים שהוסרו)",
    taxJson,
    "#### calculation_result (פלט חישוב המערכת)",
    calcJson,
    "",
  ]
    .filter((line) => line != null && line !== "")
    .join("\n");
  if (combined.length > MAX_REPORT_BLOCK_CHARS) {
    return `${combined.slice(0, MAX_REPORT_BLOCK_CHARS)}\n[…חלק מדוח זה קוצר בגלל אורך]`;
  }
  return combined;
}

function safeContextToPromptBlock(ctx) {
  try {
    return contextToPromptBlock(ctx);
  } catch (err) {
    console.error("[chat] contextToPromptBlock failed:", err);
    const n = getReportsArray(ctx).length;
    return [
      "מצב: משתמש מחובר.",
      `[אזהרה: בניית הקשר המלא נכשלה — ${err.message}.]`,
      n > 0
        ? `יש ${n} דוח(ות) בחשבון; נסה שוב או צמצם maxReports / בדוק נתונים חריגים בדוח.`
        : "אין דוחות או לא ניתן לטעון הקשר.",
    ].join("\n");
  }
}

/**
 * מחרוזת הקשר ל-LLM: נתונים מעובדים לטקסט (ללא PII), ואופציונלית JSON אם CHAT_APPEND_COMPACT_JSON=1
 */
function contextToPromptBlock(ctx) {
  const systemKb = getChatSystemKnowledgeContextBlock();

  if (ctx.mode === "guest") {
    return [
      "מצב: אורח (ללא נתונים אישיים).",
      "ידע כללי בלבד:",
      ctx.guestKnowledge || "",
      systemKb,
    ]
      .filter((s) => s != null && String(s).trim() !== "")
      .join("\n");
  }

  const lines = [
    "מצב: משתמש מחובר. שמות ומזהים אישיים אינם מועברים לבלוק זה.",
  ];
  if (systemKb) lines.push(systemKb);

  const reports = getReportsArray(ctx);
  if (reports.length === 0) {
    lines.push(
      ctx.formattedReportsForAI ||
        "אין נתונים פיננסיים זמינים לניתוח — אין דוחות שמורים במערכת.",
    );
    return lines.join("\n");
  }

  lines.push(
    `נטענו ${reports.length} דוח(ות) (סדר: 1 = העדכני ביותר).`,
    "",
    "### נתונים לניתוח (מעובד, ללא מזהים אישיים)",
    ctx.formattedReportsForAI || "",
    "",
  );

  const budget = parseInt(process.env.CHAT_CONTEXT_MAX_CHARS || "120000", 10);
  let used = lines.join("\n").length;

  if (process.env.CHAT_APPEND_COMPACT_JSON === "1") {
    lines.push("### פירוט מובנה (JSON — אופציונלי)");
    let included = 0;
    for (let i = 0; i < reports.length; i++) {
      const block = formatReportBlockForContext(reports[i], i + 1);
      if (used + block.length > budget) {
        lines.push(
          `\n[מגבלת אורך: נכללו ${included} דוחות ב-JSON; ${reports.length - included} דוחות נוספים לא נכנסו.]`,
        );
        break;
      }
      lines.push(block);
      used += block.length;
      included++;
    }
    lines.push("");
  }

  lines.push(
    "שים לב: הנתונים מבוססים על הזנת המשתמש והחישוב במערכת — לא מחייבים את רשות המיסים.",
  );

  return lines.join("\n");
}

/**
 * ברכה / פתיחה חברתית בלבד (לא שאלת ניתוח) — לא לחסום בבהרת כוונה מ-regex
 */
function isTrivialSocialOpening(msg) {
  const t = (msg || "").trim();
  if (!t || t.length > 22) return false;
  return /^(היי+|שלום|הלו|בוקר\s*טוב|ערב\s*טוב|לילה\s*טוב|מה\s+נשמע|מה\s+קורה|תודה|סליחה|ok|okay|hi\b|hey\b|hello\b|good\s*(morning|evening|afternoon|day))[\s!?.…,:]*$/i.test(
    t,
  );
}

function buildTrivialSocialReplyHe(contextObject) {
  if (contextObject.mode === "guest") {
    return [
      "היי! איך אפשר לעזור?",
      "",
      "אפשר לכתוב כאן בחופשיות — למשל על העלאת טופס 106, התחברות, או איך עובד חישוב ההחזר במערכת (במצב אורח בלי נתונים אישיים).",
    ].join("\n");
  }
  const n = getReportsArray(contextObject).length;
  if (!contextObject.latestReport || n === 0) {
    return [
      "היי! כרגע **אין דוח שמור** בחשבון — אחרי שתעלה או תמלא טופס ותשמור דוח, אוכל לענות לפי המספרים.",
      "",
      "בינתיים אפשר לשאול איך המערכת עובדת או איפה מעלים מסמך.",
    ].join("\n");
  }
  return [
    "היי! אני כאן לעזור עם **הדוחות והחישובים** השמורים אצלך במערכת.",
    "",
    `יש לך **${n}** דוח(ות) בחשבון (נטען בהקשר לשיחה) — **כתוב בחופשיות** מה תרצה לדעת: החזר, הסבר מספרים, השוואה בין שנים, וכו'.`,
    "",
    "התשובות מבוססות רק על מה ששמור אצלך — חישוב משוער, לא ייעוץ מס ולא מחייב את רשות המיסים.",
  ].join("\n");
}

/**
 * שאלה על יכולות — העוזר/המערכת/האפליקציה (לא סיכום מספרים מהדוח)
 */
function wantsCapabilityOrientationQuestion(msg) {
  const t = (msg || "").trim();
  if (!t) return false;
  return (
    /מה\s+המערכת\s+(יודעת|יודע|עושה|מאפשרת|מציעה)(\s+לעשות)?/i.test(t) ||
    /מה\s+האפליקציה\s+(יודעת|עושה|מאפשרת|מציעה)(\s+לעשות)?/i.test(t) ||
    /מה\s+(זאת|זו)\s+המערכת|מה\s+המערכת\s+הזאת/i.test(t) ||
    /יכולות\s+(של\s+)?(ה)?(מערכת|אפליקציה|אתר)/i.test(t) ||
    /מה\s+אפשר\s+לעשות\s+(במערכת|באפליקציה|כאן|פה)/i.test(t) ||
    /איך\s+עובד(ת)?\s+(ה)?מערכת|איך\s+המערכת\s+עובדת/i.test(t) ||
    /למה\s+משמש(ת)?\s+(ה)?מערכת|למה\s+קיימ(ת)?\s+(ה)?מערכת/i.test(t) ||
    /מה\s+את\s+עוד\s+יודע/i.test(t) ||
    /מה\s+עוד\s+את\s+יודע/i.test(t) ||
    /מה\s+(עוד\s+)?(אתה|את)\s+(יודע|יודעת)(\s+לעשות)?/i.test(t) ||
    /מה\s+((אתה|את)\s+עוד|עוד\s+(אתה|את))\s+(יודע|יודעת)(\s+לעשות)?/i.test(t) ||
    /במה\s+(עוד\s+)?(אתה|את)\s+(עוזר|עוזרת|תעזור|תעזרי)/i.test(t) ||
    /איך\s+(אתה|את)\s+(עוזר|עוזרת|תעזור|תעזרי)/i.test(t) ||
    /מה\s+אפשר\s+לשאול/i.test(t) ||
    /איך\s+תעזור/i.test(t) ||
    /תכוון(\s+אותי)?/i.test(t) ||
    /מה\s+התפקיד(\s+שלך)?/i.test(t) ||
    /מה\s+(אתה|את)\s+יכול(ה)?(\s+לעשות)?/i.test(t) ||
    /מה\s+השירות/i.test(t) ||
    /עוד\s+משהו\s+ש(אתה|את)\s+/i.test(t) ||
    /what\s+does\s+(the\s+)?(app|system)\s+do/i.test(t) ||
    /what\s+can\s+(the\s+)?(app|system)/i.test(t) ||
    /what\s+else\s+can\s+you\s+do/i.test(t) ||
    /what\s+can\s+you\s+do/i.test(t) ||
    /how\s+can\s+you\s+help/i.test(t)
  );
}

/**
 * איך **אני** מגיש מול רשות המיסים — תהליך חיצוני (לא "האם האפליקציה מגישה")
 */
function wantsOfficialFilingHowToQuestion(msg) {
  const t = (msg || "").trim();
  if (!t) return false;
  const raContext =
    /מס\s*הכנסה|רשות\s+המיסים|דוח\s*מס|הגש(ה|ות)|בקש(ה|ות)|החזר\s*מס|שע[״\"]?ם|טופס\s*106/i.test(
      t,
    );
  if (!raContext) return false;
  return (
    /איך\s+(אני|אנחנו|אפשר|עושים|מגישים|להגיש|מבצעים)/i.test(t) ||
    /מה\s+התהליך|מה\s+צריך\s+לעשות\s+(כדי\s+)?(להגיש|לשלוח)/i.test(t) ||
    /איפה\s+(מגישים|שולחים|מגישים\s+את)/i.test(t) ||
    /באיזה\s+(אתר|מקום)\s+(מגישים|שולחים)/i.test(t) ||
    /איזה\s+צעדים.{0,40}(הגשה|רשות|מס)/i.test(t) ||
    /how\s+do\s+i\s+(file|submit)/i.test(t) ||
    /how\s+to\s+submit/i.test(t)
  );
}

/**
 * האם **האפליקציה/המערכת** מגישה בשם המשתמש — תשובת "לא" קצרה (בלי לחסום שאלות "איך אני מגיש")
 */
function wantsAppDoesNotSubmitToRaQuestion(msg) {
  const t = (msg || "").trim();
  if (!t) return false;
  if (wantsOfficialFilingHowToQuestion(t)) return false;
  if (
    /מגישים?\s+(את\s+)?(ה)?דוח|הגש(ה|ות)\s+(של\s+)?(ה)?דוח|שולחים?\s+(את\s+)?(ה)?דוח/i.test(
      t,
    )
  ) {
    return true;
  }
  if (
    /(מגיש|שולח|מעביר).{0,50}(לרשות|למס\s*הכנסה|לרשות\s+המיסים|רשות\s+המיסים)/i.test(
      t,
    )
  ) {
    return true;
  }
  if (
    /האם\s+(אתם|אתה|את|המערכת|האפליקציה|זה)\b/i.test(t) &&
    /(מגיש|שולח|מעביר|מוגש|מועבר)/i.test(t) &&
    /(דוח|106|רשות|מס\s*הכנסה|שע[״\"]?ם)/i.test(t)
  ) {
    return true;
  }
  if (
    /חיבור\s+(ל)?רשות|אינטגרציה\s+(עם\s+)?רשות|ממשק\s+(עם\s+)?(רשות|שע[״\"]?ם)|מתחברים?\s+(ל)?שע[״\"]?ם/i.test(
      t,
    )
  ) {
    return true;
  }
  if (
    /\b(do\s+you|does\s+(the\s+)?(app|system))\s+file\b/i.test(t) ||
    /\bsubmit\b.{0,40}\b(tax|return|irs|authority)\b/i.test(t)
  ) {
    return true;
  }
  return false;
}

function buildOfficialFilingScopeReplyHe(contextObject) {
  const lines = [
    "**לא** — המערכת **אינה** מגישה בשמך דוח למס הכנסה או לרשות המיסים, ואינה מחוברת להגשה רשמית או לשליחה אוטומטית של הדוח לרשות.",
    "",
    "**מה כן:** ניתן להעלות טופס 106 או להזין נתונים, לקבל **חישוב משוער**, לצפות בפירוט ולשמור דוח **באפליקציה** (אצלך בחשבון). ההגשה הרשמית מול רשות המיסים היא **באחריותך**, דרך הערוצים הרשמיים שלהם (למשל אתר שע\"ם).",
    "",
    "תזכורת: חישוב משוער — לא ייעוץ מס, ולא מחליף החלטת רשות המיסים.",
  ];
  const n = getReportsArray(contextObject || {}).length;
  if (contextObject?.mode === "authenticated" && n > 0) {
    lines.push(
      "",
      "אם רצית לדעת משהו **על המספרים בדוח** (הכנסה, החזר, מס) — כתוב במפורש מה לפרש או מה להשוות.",
    );
  }
  return lines.join("\n");
}

/** איך מגישים מול רשות המיסים — לפי סעיף במדריך + קשר לאפליקציה */
function buildOfficialFilingHowToReplyHe(contextObject) {
  let section = getOfficialFilingHowToSectionHe();
  if (section) {
    section = section.replace(/^##[^\n]+\n*/, "").trim();
  }
  if (!section) {
    section = [
      "ההגשה הרשמית של דוח או בקשה מול **רשות המיסים** נעשית **מחוץ** לאפליקציה, בערוצים הרשמיים של הרשות (לרוב דרך אתר **שע\"ם** לאחר זיהוי). הפרטים המדויקים תלויים במצבך ובשנת המס — יש לוודא מול האתר הרשמי של רשות המיסים או עם רואה חשבון.",
      "",
      "האפליקציה **מס החזר** עוזרת להכין **הערכה** לפי נתונים שתזין (טופס 106 וכו') ולשמור דוח **אצלך**; היא **אינה** מחליפה הגשה לרשות.",
    ].join("\n");
  }
  const parts = [
    section,
    "",
    "**בקצרה מהאפליקציה:** חישוב ושמירת דוח — מסך [העלאת מסמכים](/incomes); צפייה בדוחות שמורים — [היסטוריה](/history).",
    "",
    "תזכורת: אין כאן ייעוץ מס או הוראה משפטית מחייבת — רק כיוון כללי.",
  ];
  return parts.join("\n");
}

/** כיוון משתמש: מה העוזר יודע + שאלת הבהרה + דוגמאות */
function buildCapabilityOrientationReply(contextObject, userMessage) {
  const asksMore = /עוד/i.test(userMessage || "");

  if (contextObject.mode === "guest") {
    return [
      "אני העוזר של אפליקציית **מס החזר**. בלי התחברות אין לי גישה לדוחות או למספרים האישיים שלך.",
      "",
      "**מה אני יודע לעשות כאן:**",
      "• להסביר איך מעלים טופס 106 (PDF) או ממלאים טופס ידני",
      "• לכוון להתחברות, רישום ו**היסטוריית דוחות** אחרי התחברות",
      "• לענות בעקרון על **החזר משוער** ועל גבולות המערכת (לא ייעוץ מס ולא מחליף החלטת רשות המיסים)",
      "",
      "**כדי לדייק — מה הכי רלוונטי עכשיו?** העלאת מסמך, התחברות לחשבון, או הבנת איך עובד החישוב?",
      "",
      "**אפשר לשאול למשל:**",
      "• \"איך מעלים טופס 106?\"",
      "• \"איך מתחברים או נרשמים?\"",
      "• \"מה ההבדל בין החזר משוער לדוח מס רשמי?\"",
    ].join("\n");
  }

  const n = getReportsArray(contextObject).length;
  if (!contextObject.latestReport || n === 0) {
    return [
      "אתה מחובר — אבל **אין דוח שמור** בחשבון, ולכן אין לי עדיין מספרים אישיים לנתח.",
      "",
      "**מה אוכל לעשות אחרי שיש דוח שמור:**",
      "• להסביר הכנסה, מס ששולם, החזר, מס גולמי/נטו",
      "• להשוות בין שנים ולחשב ממוצעים על פני כמה דוחות",
      "• לעזור לפרש פירוט חישוב כשיש טקסט כזה בדוח",
      "",
      "**צעד הבא:** \"העלאת מסמכים\" → חישוב → **שמירת דוח**, ואז חזור לשאול כאן.",
      "",
      "**רוצה שאכוון לשירות במערכת?** אם תכתוב \"איפה מעלים מסמך\" או \"איפה היסטוריה\" — אפנה אותך לתפריט המתאים.",
    ].join("\n");
  }

  const head = asksMore
    ? `מעבר לסיכום המספרים מהדוח העדכני, **זה עוד מה שאני יודעת לעשות** (יש לך **${n}** דוח(ות) בהקשר):`
    : `אני רואה **${n}** דוח(ות) שמורים בהקשר (העדכני ביותר ראשון).`;

  return [
    head,
    "",
    asksMore
      ? "**יכולות נוספות:**"
      : "**מה אני יודע לעשות עם זה:**",
    "• לענות על **החזר**, **הכנסה** ומס ששולם — מהדוח האחרון או בהשוואה בין דוחות",
    "• להסביר את המספרים **בפשטות** (מה זה מס גולמי, נטו, נקודות זיכוי)",
    "• לחשב **ממוצעים** או סכומים על פני כל הדוחות שנטענו לשיחה",
    "",
    "**שאלה שתעזור לי לדייק:** מעניין אותך בעיקר **הדוח האחרון**, **השוואה בין שנים**, או **ממוצעים**?",
    "",
    "**דוגמאות לשאלות:**",
    "• \"מה ההחזר בדוח האחרון?\"",
    "• \"תסביר את המספרים בפשטות\"",
    "• \"השווה בין הדוחות שלי\" / \"מה הממוצע על פני הדוחות?\"",
    "",
    "תזכורת: חישוב משוער, לא ייעוץ מס.",
  ].join("\n");
}

/**
 * Mock: תשובות לפי מילות מפתח והקשר — בלי LLM
 */
function generateMockReply({ userMessage, contextObject }) {
  const msg = (userMessage || "").trim();
  if (!msg) {
    return { reply: "נא לכתוב שאלה.", usedContext: true };
  }

  if (isTrivialSocialOpening(msg)) {
    return {
      reply: buildTrivialSocialReplyHe(contextObject),
      usedContext: true,
    };
  }

  if (wantsCapabilityOrientationQuestion(msg)) {
    return {
      reply: buildCapabilityOrientationReply(contextObject, msg),
      usedContext: true,
    };
  }

  if (wantsOfficialFilingHowToQuestion(msg)) {
    return {
      reply: buildOfficialFilingHowToReplyHe(contextObject),
      usedContext: true,
    };
  }
  if (wantsAppDoesNotSubmitToRaQuestion(msg)) {
    return {
      reply: buildOfficialFilingScopeReplyHe(contextObject),
      usedContext: true,
    };
  }

  const trivialOffTopic =
    /מזג\s*אוויר|כדורגל|פוליטיק|סרט\s|מסעדה/i.test(msg);
  if (contextObject.mode === "guest" && trivialOffTopic) {
    return {
      reply: buildContextualHelpReply(msg, contextObject, { offTopicGuest: true }),
      usedContext: true,
    };
  }

  if (contextObject.mode === "guest") {
    if (
      /דוח האחרון|הדוח שלי|שלי\b|אצלי|בחשבון|החזר שלי|ההחזר שלי|ההכנסה שלי|כמה אקבל|מה מגיע לי|המס שלי/i.test(
        msg,
      )
    ) {
      return {
        reply:
          "כדי לענות לפי הדוח האחרון שלך (סכומים אישיים) צריך להיות מחובר ולשלוח את השאלה מתוך האפליקציה אחרי התחברות (תפריט → עוזר מס). כאן אתה במצב אורח — אין לי גישה לדוחות שלך, רק למידע כללי על המערכת.",
        usedContext: true,
      };
    }
    if (
      /106|טופס|העלא|קובץ|pdf|מסמך/i.test(msg)
    ) {
      return {
        reply:
          "לפי המידע הכללי במערכת: ניתן להעלות קובץ PDF של טופס 106 דרך \"העלאת מסמכים\" אחרי התחברות, או למלא את השדות ידנית. החילוץ מהקובץ תלוי באיכות הטופס.",
        usedContext: true,
      };
    }
    if (wantsConceptualTaxRefundQuestion(msg)) {
      return {
        reply: buildConceptualTaxRefundReplyHe(contextObject),
        usedContext: true,
      };
    }
    if (/החזר|מס|חישוב/i.test(msg)) {
      return {
        reply:
          "לפי המידע הכללי: המערכת מחשבת החזר משוער לפי הנתונים שהוזנו. זה אינו ייעוץ מס ואינו מחייב את רשות המיסים. למספרים מהדוח שלך — התחבר ופתח את העוזר מתוך האפליקציה (לא ממסך ההתחברות).",
        usedContext: true,
      };
    }
    if (/התחבר|חשבון|רישום|הרשמה/i.test(msg)) {
      return {
        reply:
          "נדרשת התחברות (אימייל/סיסמה או Google) כדי לשמור דוחות בהיסטוריה ולשלוח מייל. באותו מסך ניתן גם להירשם.",
        usedContext: true,
      };
    }
    return {
      reply: buildContextualHelpReply(msg, contextObject),
      usedContext: true,
    };
  }

  // authenticated
  if (!contextObject.latestReport) {
    if (/החזר|הכנס|כמה|דוח|ילדים|מס/i.test(msg)) {
      return {
        reply:
          "לפי הנתונים במערכת אין כרגע דוח שמור בחשבון שלך, ולכן אין לי סכומים אישיים להציג. אפשר ליצור דוח דרך \"העלאת מסמכים\" — אחרי שמירה אוכל להתייחס לנתונים מהדוח האחרון.",
        usedContext: true,
      };
    }
  } else {
    const r = contextObject.latestReport;
    const td = r.taxData || {};
    const calc = r.calculation || {};
    const refund =
      num(calc.refundAmount) ??
      num(calc.totalRefund) ??
      num(calc.refund);
    const inc = num(td.income);
    const paid = num(td.taxPaid);

    if (wantsConceptualTaxRefundQuestion(msg)) {
      return {
        reply: buildConceptualTaxRefundReplyHe(contextObject),
        usedContext: true,
      };
    }

    if (/החזר|כמה.*אקבל|סכום.*החזר/i.test(msg)) {
      if (refund != null) {
        return {
          reply: `לפי חישוב אחרון שמור במערכת, ההחזר המשוער הוא בערך ${refund} ש"ח. זה מבוסס על הנתונים ששמרת ואינו מחייב את רשות המיסים.`,
          usedContext: true,
        };
      }
      return {
        reply:
          "יש דוח שמור אבל אין בהקשר סכום החזר מחושב — ייתכן שהחישוב לא נשמר במלואו. נסה להריץ חישוב מחדש או לשמור דוח.",
        usedContext: true,
      };
    }
    if (/הכנס|שכר|משכורת/i.test(msg) && inc != null) {
      return {
        reply: `לפי הדוח האחרון במערכת, ההכנסה המדווחת (כפי שהוזנה) היא בערך ${inc}.`,
        usedContext: true,
      };
    }
    if (/ילד|נקודות|זיכוי/i.test(msg)) {
      const kids = td.children;
      if (kids !== undefined && kids !== null && kids !== "") {
        return {
          reply: `לפי הדוח האחרון, ערך שדה הילדים/זיכוי (כפי שהוזן) הוא: ${kids}.`,
          usedContext: true,
        };
      }
      return {
        reply:
          "בדוח האחרון לא מופיע אצלי ערך ברור לשדה ילדים/זיכוי — לא ניתן לענות מדויק מהנתונים השמורים.\n\nמה אפשר לעשות: לבדוק ב\"העלאת מסמכים\" שהשדה נשמר אחרי חישוב, או לשאול \"מה ההחזר?\" / \"תסביר את המספרים בפשטות\" לפי מה שכן מופיע בדוח.",
        usedContext: true,
      };
    }

    if (wantsPlainMeaningQuestion(msg)) {
      return {
        reply: buildPlainMeaningHe(td, calc),
        usedContext: true,
      };
    }

    if (
      /נתח|ניתוח|תנתח|פירוט|סיכום|מה\s*זה\s*אומר|מה\s*אומר|מה\s*המשמעות|תסביר|הסבר|analyze/i.test(
        msg,
      )
    ) {
      const explRaw = calc.explanation;
      if (explRaw != null && String(explRaw).trim()) {
        const full = String(explRaw).trim();
        const max = 3200;
        const tail = full.length > max ? "\n\n(חלק מהפירוט קוצר להצגה.)" : "";
        return {
          reply: `לפי הדוח והחישוב האחרון שמורים אצלך במערכת — זהו הפירוט שהמערכת הפיקה:\n\n${full.slice(0, max)}${tail}\n\nזה מסכם את אופן חישוב המס וההחזר לפי הנתונים שהוזנו; זה אינו ייעוץ מס ואינו מחייב את רשות המיסים.`,
          usedContext: true,
        };
      }
      const bits = [];
      if (inc != null) bits.push(`הכנסה חייבת (כפי שהוזנה): ${inc}`);
      if (paid != null) bits.push(`מס ששולם: ${paid}`);
      if (refund != null) bits.push(`החזר משוער: ${refund} ש"ח`);
      const gTax = num(calc.grossTax);
      const nTax = num(calc.netTax);
      if (gTax != null) bits.push(`מס ברוטו בחישוב: ${gTax}`);
      if (nTax != null) bits.push(`מס נטו בחישוב: ${nTax}`);
      if (bits.length) {
        return {
          reply: `לפי הנתונים השמורים בדוח האחרון (בלי טקסט פירוט מלא במערכת):\n${bits.join("\n")}\n\nלהסבר מפורט יותר מומלץ להריץ שוב חישוב במערכת ולוודא שהדוח נשמר — אז יופיע גם פירוט מילולי.`,
          usedContext: true,
        };
      }
      return {
        reply:
          "יש דוח שמור אבל אין בהקשר פירוט מספרי או טקסטואלי מספיק — נסה להריץ חישוב מחדש מ\"העלאת מסמכים\" ולשמור דוח.",
        usedContext: true,
      };
    }
  }

  if (/106|העלא|טופס/i.test(msg)) {
    return {
      reply:
        "ניתן להעלות טופס 106 ב-PDF תחת \"העלאת מסמכים\", או למלא ידנית. אם העלאה נכשלת, בדוק שהקובץ קריא ומלא.",
      usedContext: true,
    };
  }

  if (/היסטור|דוחות שמורים/i.test(msg)) {
    return {
      reply:
        "דוחות שמורים מופיעים תחת \"היסטוריה\" בתפריט (למשתמש מחובר).",
      usedContext: true,
    };
  }

  return {
    reply: buildContextualHelpReply(msg, contextObject),
    usedContext: true,
  };
}

/** ניסוח תשובה ישירות ממספרי הדוח האחרון כשהמילות המפתח של המוק לא תפסו */
function tryDataDrivenFallback(msg, contextObject) {
  if (contextObject.mode !== "authenticated" || !contextObject.latestReport) {
    return null;
  }
  const m = msg.trim();
  const agg = tryAggregateReportsReply(m, contextObject);
  if (agg) return agg;

  if (wantsConceptualTaxRefundQuestion(m)) return null;

  const r = contextObject.latestReport;
  const td = r.taxData || {};
  const calc = r.calculation || {};
  const refund =
    num(calc.refundAmount) ??
    num(calc.totalRefund) ??
    num(calc.refund);
  const inc = num(td.income);
  const paid = num(td.taxPaid);
  const tail =
    "\n\nזה לפי הדוח האחרון ששמור במערכת — חישוב משוער, לא ייעוץ מס ולא מחייב את רשות המיסים.";

  /** חוב / מינוס בהחזר — "זה חוב?", יתרת חוב, שלילי */
  if (
    refund != null &&
    /חוב|יתרת\s*חוב|חייבים?\s+עוד|עודף\s*מס\s*לשלם|שלילי|מינוס|למה\s+.*מינוס|מה\s+פירוש.*מינוס|החזר\s*שלילי|זה\s+חוב|אם\s+זה\s+חוב|האם\s+זה\s+חוב/i.test(
      m,
    )
  ) {
    if (refund < 0) {
      const absRef = Math.abs(refund);
      return [
        `לפי הדוח האחרון, **ההחזר המשוער שלילי** (${refund.toLocaleString("he-IL")} ₪) — במסגרת החישוב באפליקציה זה בדרך כלל אומר שיש **יתרת חוב מס משוערת** של בערך **${absRef.toLocaleString("he-IL")} ₪**: כלומר לפי הנתונים שהוזנו, המס המחושב (נטו) גבוה מסכום המס ששולם (או צירוף אחר שמוביל ליתרת תשלום), ולכן אין "החזר" אלא יתרה לטובת המס.`,
        "",
        "זה **אינו** גזירה משפטית של \"חוב\" מול רשות המיסים — רק תוצאה של המודל החישובי במערכת; ייתכנו טעויות בהזנה או הבדלים מול הדוח הרשמי.",
        tail,
      ].join("\n");
    }
    return [
      `לפי הדוח האחרון, ההחזר המשוער **אינו שלילי** (${refund.toLocaleString("he-IL")} ₪) — במצב כזה החישוב לא מציג יתרת חוב מס לפי ההגדרה של \"החזר שלילי\" במערכת.`,
      tail,
    ].join("\n");
  }

  const asksRefundAmountFromReport =
    /כמה\s+(יהיה\s+)?החזר|מה\s+ההחזר\b|ההחזר\s+שלי|החזר\s+שלי|כמה\s+יחזר|מה\s+מגיע\s+לי|מה\s+החזר\s+בדוח|הדוח\s+האחרון[^\n]{0,50}החזר/i.test(
      m,
    );
  if (
    asksRefundAmountFromReport &&
    /החזר|חזר מס|כמה יחזר/i.test(m) &&
    refund != null
  ) {
    return `לפי הדוח האחרון שלך, ההחזר המשוער הוא בערך ${refund.toLocaleString("he-IL")} ₪.${tail}`;
  }
  if (/הכנס|שכר|משכורת/i.test(m) && inc != null) {
    return `לפי הדוח האחרון, ההכנסה החייבת (כפי שהוזנה) בערך ${inc.toLocaleString("he-IL")} ₪.${tail}`;
  }
  if (/מס ששולם|ניכוי|כמה מס שילמתי/i.test(m) && paid != null) {
    return `לפי הדוח האחרון, מס ששולם (כפי שהוזן) בערך ${paid.toLocaleString("he-IL")} ₪.${tail}`;
  }
  if (
    /סיכום|מה יש בדוח|מה המצב|תן לי סקירה|כל המספרים/i.test(m) &&
    (refund != null || inc != null || paid != null)
  ) {
    const parts = [];
    if (inc != null) parts.push(`הכנסה מדווחת: בערך ${inc.toLocaleString("he-IL")} ₪`);
    if (paid != null) parts.push(`מס ששולם: בערך ${paid.toLocaleString("he-IL")} ₪`);
    if (refund != null) parts.push(`החזר משוער: בערך ${refund.toLocaleString("he-IL")} ₪`);
    return `סיכום מהדוח האחרון:\n${parts.join("\n")}${tail}\n\nלשאלות נוספות אפשר לנסות: "מה זה אומר בפשטות?", "למה ההחזר ככה?", או "השווה בין הדוחות" אם יש יותר מדוח אחד.`;
  }

  const gTax = num(calc.grossTax);
  const nTax = num(calc.netTax);
  if (/מס\s*גולמי|ברוטו|gross/i.test(m) && gTax != null) {
    return `לפי הדוח האחרון, **מס גולמי** (לפני ניכוי נקודות זיכוי) בערך ${gTax.toLocaleString("he-IL")} ₪.${tail}\n\nבקצרה: זה המס "התיאורטי" לפני זיכויים; אחרי זה מחושב מס נטו והשוואה למס ששולם קובעת אם יש החזר.`;
  }
  if (/מס\s*נטו|נטו|אחרי\s*זיכוי/i.test(m) && nTax != null) {
    return `לפי הדוח האחרון, **מס נטו** (אחרי ניכוי נקודות זיכוי) בערך ${nTax.toLocaleString("he-IL")} ₪.${tail}`;
  }
  if (/נקודות\s*זיכוי|נקודת\s*זיכוי/i.test(m)) {
    const pts = calc.creditPoints;
    const cVal = num(calc.creditValue);
    if (pts != null && String(pts).trim() !== "") {
      return `לפי הדוח האחרון: נקודות זיכוי — ${pts}. שווי נקודות בחישוב: ${cVal != null ? `בערך ${cVal.toLocaleString("he-IL")} ₪` : "כפי שמופיע בפירוט המערכת"}.${tail}`;
    }
  }
  if (/איזו\s*שנה|שנת\s*דוח|למה\s*שנה/i.test(m) && r.reportYear != null) {
    return `לפי הדוח **העדכני ביותר** שמור במערכת, שנת הדוח היא ${r.reportYear}.${tail}`;
  }

  const reports = contextObject.reports && contextObject.reports.length
    ? contextObject.reports
    : [];
  if (
    reports.length > 1 &&
    /השווה|השוואה|מגמה|למה\s+.*השתנה|ירד|עלה|הכי\s*טוב|הכי\s*גבוה/i.test(m)
  ) {
    const a = reports[0];
    const b = reports[1];
    const ia = num((a.taxData || {}).income);
    const ib = num((b.taxData || {}).income);
    const ra =
      num((a.calculation || {}).refundAmount) ??
      num((a.calculation || {}).totalRefund) ??
      num((a.calculation || {}).refund);
    const rb =
      num((b.calculation || {}).refundAmount) ??
      num((b.calculation || {}).totalRefund) ??
      num((b.calculation || {}).refund);
    const ya = a.reportYear ?? "?";
    const yb = b.reportYear ?? "?";
    const bits = [
      `השוואה בין שני הדוחות העדכניים ביותר (${ya} לעומת ${yb}):`,
    ];
    if (ia != null && ib != null) {
      const d = ib !== 0 ? (((ia - ib) / ib) * 100).toFixed(1) : null;
      bits.push(
        `• הכנסה: ${ia.toLocaleString("he-IL")} ₪ לעומת ${ib.toLocaleString("he-IL")} ₪${d != null ? ` (שינוי כ-${d}% מהישן לחדש)` : ""}.`,
      );
    }
    if (ra != null && rb != null) {
      bits.push(
        `• החזר משוער: ${ra.toLocaleString("he-IL")} ₪ לעומת ${rb.toLocaleString("he-IL")} ₪ (הפרש ${(ra - rb).toLocaleString("he-IL")} ₪).`,
      );
    }
    if (bits.length > 1) {
      return `${bits.join("\n")}\n\nזו השוואה לפי מה ששמור במערכת בלבד — לא ניתוח מס מלא.${tail}`;
    }
  }

  return null;
}

/**
 * @param {{ userMessage: string, contextObject: object, historyMessages?: { role: string, content: string }[] }} args
 */
const EMPTY_REPLY_FALLBACK_HE =
  "לא התקבלה תשובה מהמודל. נסה שוב בעוד רגע, קצר את השאלה, או צמצם את מספר הדוחות (באפליקציה נשלח עד מספר מוגבל לכל בקשה).";

async function generateChatReply({
  userMessage,
  contextObject,
  historyMessages = [],
  chatCategory: chatCategoryHint = null,
  /** @type {null | ((chunk: string) => void)} נקרא עם קטעי טקסט בזמן אמת (OpenAI stream או תשובה שלמה בנתיבים אחרים) */
  onStreamDelta = null,
}) {
  const emitStream = (s) => {
    if (typeof onStreamDelta === "function" && s) onStreamDelta(s);
  };

  const classified = classifyChatCategoryWithConfidence(
    userMessage,
    chatCategoryHint,
  );
  const resolvedCategory = classified.category;

  const reportsList = getReportsArray(contextObject);
  const hasReports = reportsList.length > 0;
  const aggQuestion = wantsAggregateOrSumQuestion(userMessage);
  const capQuestion = wantsCapabilityOrientationQuestion(userMessage);
  const filingHowToQuestion = wantsOfficialFilingHowToQuestion(userMessage);
  const appSubmitCapabilityQuestion =
    wantsAppDoesNotSubmitToRaQuestion(userMessage);
  const conceptualRefundQuestion =
    wantsConceptualTaxRefundQuestion(userMessage);
  const explicitUiCategory = normalizeChatCategory(chatCategoryHint) != null;

  let gateConfidence = classified.confidence;
  /**
   * הבהרת כוונה לפי regex רק כשאין LLM **וגם** CHAT_CLARIFY_LOW_INTENT=1.
   * ברירת מחדל: בלי מפתח OpenAI השאלה עוברת ל-mock/LLM — לא נתקעים בתבנית הבהרה.
   * עם LLM: תמיד מדלגים (המודל מנתח).
   */
  const useRegexIntentClarification =
    process.env.CHAT_CLARIFY_LOW_INTENT === "1" && !isChatLlmEnabled();

  const skipIntentClarify =
    !useRegexIntentClarification ||
    isTrivialSocialOpening(userMessage) ||
    contextObject.mode !== "authenticated" ||
    !hasReports ||
    explicitUiCategory ||
    aggQuestion ||
    capQuestion ||
    filingHowToQuestion ||
    appSubmitCapabilityQuestion ||
    conceptualRefundQuestion ||
    recentClarificationCount(historyMessages) >= 2;

  if (!skipIntentClarify) {
    if (lastAssistantWasClarification(historyMessages)) {
      gateConfidence = Math.min(1, gateConfidence + 0.22);
    }
    if (gateConfidence < 0.75) {
      const raw = buildClarificationReplyHe(hasReports);
      const displayReply = stripClarifyTokenForDisplay(raw);
      emitStream(displayReply);
      return {
        reply: displayReply,
        persistedReply: raw,
        mode: contextObject.mode === "guest" ? "general" : "personalized",
        systemInstructions: SYSTEM_INSTRUCTIONS_HE,
        engine: "clarification",
        category: resolvedCategory,
        needsClarification: true,
        intentConfidence: Math.round(gateConfidence * 1000) / 1000,
      };
    }
  }

  if (appSubmitCapabilityQuestion) {
    const filingReply = buildOfficialFilingScopeReplyHe(contextObject).trim();
    emitStream(filingReply);
    return {
      reply: filingReply,
      mode: contextObject.mode === "guest" ? "general" : "personalized",
      systemInstructions: SYSTEM_INSTRUCTIONS_HE,
      engine: "filing_scope",
      category: resolvedCategory,
      needsClarification: false,
      intentConfidence: Math.round(classified.confidence * 1000) / 1000,
    };
  }

  if (capQuestion) {
    const capReply = buildCapabilityOrientationReply(
      contextObject,
      userMessage,
    ).trim();
    emitStream(capReply);
    return {
      reply: capReply,
      mode: contextObject.mode === "guest" ? "general" : "personalized",
      systemInstructions: SYSTEM_INSTRUCTIONS_HE,
      engine: "capability_orientation",
      category: resolvedCategory,
      needsClarification: false,
      intentConfidence: Math.round(classified.confidence * 1000) / 1000,
    };
  }

  let reply = null;
  let engine = "mock";
  /** כשמופעל ai_main_prompt_v1 — קטגוריה, clarification והצעות המשך מהמודל */
  let mainPromptMeta = null;

  try {
    try {
      if (isMainPromptV1Enabled() && isChatLlmEnabled()) {
        try {
          const orch = await callMainPromptOrchestrator({
            userMessage,
            contextObject,
            historyMessages,
          });
          if (orch?.ok) {
            reply = orch.answer;
            emitStream(reply);
            engine = "openai+main_prompt_v1";
            mainPromptMeta = {
              category: orch.category,
              needsClarification: orch.needsClarification,
              suggestedFollowUps: orch.suggestedFollowUps,
            };
          }
        } catch (orchErr) {
          console.error("[chat] main prompt v1:", orchErr.message);
        }
      }

      let llm = null;
      let usedSkillsAnalyst = false;
      if (
        !reply &&
        isSkillsPipelineEnabled() &&
        contextObject.mode === "authenticated" &&
        hasReports
      ) {
        try {
          llm = await callSkillsAnalystLlm({
            contextObject,
            userMessage,
            chatCategory: resolvedCategory,
            historyMessages,
          });
          if (llm) {
            usedSkillsAnalyst = true;
            emitStream(llm);
          }
        } catch (skillsErr) {
          console.error("[chat] skills analyst:", skillsErr.message);
        }
      }
      if (!reply && !llm) {
        llm =
          typeof onStreamDelta === "function"
            ? await callOpenAiChatStream({
                contextObject,
                userMessage,
                historyMessages,
                chatCategory: resolvedCategory,
                onDelta: onStreamDelta,
              })
            : await callOpenAiChat({
                contextObject,
                userMessage,
                historyMessages,
                chatCategory: resolvedCategory,
              });
      }
      if (!reply && llm) {
        reply = llm;
        engine = usedSkillsAnalyst ? "openai+skills_analyst" : "openai";
      }
    } catch (err) {
      console.error("[chat] OpenAI error:", err.message);
    }

  const looksInsufficient =
    reply && looksLikeUnhelpfulModelReply(reply);

  if (engine === "openai" && looksInsufficient) {
    let replaced = false;
    if (contextObject.mode === "authenticated" && contextObject.latestReport) {
      const r = contextObject.latestReport;
      const td = r.taxData || {};
      const calc = r.calculation || {};
      if (wantsPlainMeaningQuestion(userMessage)) {
        reply = buildPlainMeaningHe(td, calc);
        engine = "openai+plain_replace";
        replaced = true;
      } else if (calc.explanation != null && String(calc.explanation).trim()) {
        const expl = calc.explanation;
        const body = String(expl).trim().slice(0, 3500);
        reply = `לפי הנתונים והפירוט שנשמרו בדוח האחרון במערכת:\n\n${body}${String(expl).length > 3500 ? "\n\n(המשך קוצר.)" : ""}\n\nזה מבוסס על חישוב המערכת בלבד — אינו ייעוץ מס ואינו מחייב את רשות המיסים.\n\nאם זה לא בדיוק על מה ששאלת — נסחו שאלה ממוקדת, למשל: "מה ההחזר?", "השווה בין הדוחות", או "מה המשמעות של מס נטו?".`;
        engine = "openai+expl_replace";
        replaced = true;
      }
    }
    if (!replaced) {
      const mock = generateMockReply({ userMessage, contextObject });
      reply = mock.reply;
      engine = "openai+helpful_fallback";
    }
  }

  /* LLM ענה משהו קצר מדי לשאלת "מה זה אומר" */
  if (
    engine === "openai" &&
    !looksInsufficient &&
    contextObject.mode === "authenticated" &&
    contextObject.latestReport &&
    wantsPlainMeaningQuestion(userMessage) &&
    reply &&
    reply.length < 120
  ) {
    const r = contextObject.latestReport;
    reply = buildPlainMeaningHe(r.taxData || {}, r.calculation || {});
    engine = "openai+plain_short_reply";
  }

  if (!reply) {
    try {
      const mock = generateMockReply({ userMessage, contextObject });
      reply = mock.reply;
      emitStream(reply);
      engine = "mock";
    } catch (mockErr) {
      console.error("[chat] mock failed:", mockErr);
      reply = `${EMPTY_REPLY_FALLBACK_HE} (פירוט: ${mockErr.message})`;
      engine = "error";
    }
  }

  if (reply == null || typeof reply !== "string" || !reply.trim()) {
    reply = EMPTY_REPLY_FALLBACK_HE;
    engine = "empty_guard";
  }

  const aggregateReply = tryAggregateReportsReply(
    userMessage,
    contextObject,
  );
  if (aggregateReply) {
    reply = aggregateReply;
    engine =
      engine === "openai" || String(engine).startsWith("openai")
        ? "openai+aggregate_math"
        : "aggregate_math";
    mainPromptMeta = null;
  }

  return {
    reply: reply.trim(),
    mode: contextObject.mode === "guest" ? "general" : "personalized",
    systemInstructions: SYSTEM_INSTRUCTIONS_HE,
    engine,
    category: mainPromptMeta ? mainPromptMeta.category : resolvedCategory,
    needsClarification: mainPromptMeta
      ? !!mainPromptMeta.needsClarification
      : false,
    suggestedFollowUps:
      mainPromptMeta &&
      Array.isArray(mainPromptMeta.suggestedFollowUps) &&
      mainPromptMeta.suggestedFollowUps.length
        ? mainPromptMeta.suggestedFollowUps
        : undefined,
    intentConfidence: Math.round(classified.confidence * 1000) / 1000,
  };
  } catch (outer) {
    console.error("[chat] generateChatReply fatal:", outer);
    return {
      reply: `אירעה שגיאה בעיבוד הצ'אט: ${outer.message || String(outer)}`,
      mode: contextObject?.mode === "guest" ? "general" : "personalized",
      systemInstructions: SYSTEM_INSTRUCTIONS_HE,
      engine: "fatal",
      category: classifyChatCategoryWithConfidence(
        userMessage,
        chatCategoryHint,
      ).category,
      needsClarification: false,
      intentConfidence: null,
    };
  }
}

module.exports = {
  generateChatReply,
  contextToPromptBlock,
  SYSTEM_INSTRUCTIONS_HE,
  OUT_OF_CONTEXT_HE,
  callOpenAiChat,
  isChatLlmEnabled,
  classifyChatCategory,
};
