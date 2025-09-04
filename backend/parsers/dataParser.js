function parseText(text, FIELD_PATTERNS, TAX_CODES) {
  console.log("=== DEBUG: Raw text received ===");
  console.log(text.substring(0, 500) + "...");
  console.log("=== END DEBUG ===");

  // ניקוי טקסט לפני פרסינג
  function normalizeText(input) {
    return (
      input
        // הסרת תווים בלתי נראים נפוצים ב-RTL
        .replace(/[\u200f\u200e\u202a-\u202e]/g, "")
        // unify quotation
        .replace(/["׳`]/g, '"')
        // normalize dashes and spaces
        .replace(/[\u00A0\u2000-\u200B]/g, " ")
        .replace(/[\t]+/g, " ")
        .replace(/\s+\n/g, "\n")
        .replace(/\n\s+/g, "\n")
        .replace(/ +/g, " ")
        .trim()
    );
  }

  text = normalizeText(text);

  let data = {};
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // איחוד כל ה-regex מכל התבניות
  let allPatterns = [];
  if (Array.isArray(FIELD_PATTERNS)) {
    allPatterns = FIELD_PATTERNS;
  } else {
    // זיהוי תבנית
    const template = detectTemplate(text);
    if (FIELD_PATTERNS[template] && FIELD_PATTERNS[template].length > 0) {
      allPatterns.push(...FIELD_PATTERNS[template]);
    }
    // תמיד הוסף גם את ברירת המחדל כגיבוי
    if (FIELD_PATTERNS.default) {
      allPatterns.push(...FIELD_PATTERNS.default);
    } else {
      Object.values(FIELD_PATTERNS).forEach((arr) => allPatterns.push(...arr));
    }
  }

  for (const line of lines) {
    for (const { key, regex } of allPatterns) {
      if (!data.hasOwnProperty(key)) {
        const match = line.match(regex);
        if (match) {
          const value = match[1].trim();
          if (value && value !== "-") {
            data[key] = value;
          } else {
            data[key] = "";
          }
        }
      }
    }
  }

  // חיפוש אוניברסלי: מוצא כל הקודים וכל הסכומים ואז מתאים ביניהם
  const allCodes = [];
  const allAmounts = [];

  // אוסף כל הקודים מהטקסט - regex משופר
  const codeRegex = /(?:^|\s|\(|\[|\/)(\d{2,5})(?:\s|\)|\]|\/|$|\))/g;

  // חיפוש נוסף לקודים בסוגריים - כמו (158/172) או )042(
  const parenthesesCodeRegex = /[\(\)](\d{2,5})[\(\)\/]/g;
  let parenMatch;
  while ((parenMatch = parenthesesCodeRegex.exec(text)) !== null) {
    const code = parenMatch[1];
    if (TAX_CODES[code]) {
      allCodes.push({
        code: code,
        field: TAX_CODES[code],
        position: parenMatch.index,
        line: text.substring(0, parenMatch.index).split("\n").length - 1,
      });
    }
  }
  let codeMatch;
  while ((codeMatch = codeRegex.exec(text)) !== null) {
    const code = codeMatch[1];
    if (TAX_CODES[code]) {
      allCodes.push({
        code: code,
        field: TAX_CODES[code],
        position: codeMatch.index,
        line: text.substring(0, codeMatch.index).split("\n").length - 1,
      });
    }
  }

  console.log("=== DEBUG: Found codes ===");
  console.log(allCodes);
  console.log("=== END DEBUG ===");

  // אוסף כל הסכומים מהטקסט (מסונן מקודים) - regex משופר
  const amountRegex = /([\d,\.]+)(?:\s*ש"ח|\s*₪|\s*$|\s|\)|\]|\s|$)/g;
  let amountMatch;
  while ((amountMatch = amountRegex.exec(text)) !== null) {
    const rawAmountToken = amountMatch[1];
    const rawAmount = rawAmountToken.replace(/,/g, "");
    const amount = Number(rawAmount);

    // טווח הקשר סביב המספר לזיהוי שנים/תאריכים/אחוזים
    const ctxStart = Math.max(0, amountMatch.index - 8);
    const ctxEnd = Math.min(
      text.length,
      amountMatch.index + rawAmountToken.length + 8
    );
    const around = text.substring(ctxStart, ctxEnd);

    // התעלמות ממספרי שנים (1900-2100) אם לא בהקשר של "שנת המס"
    const isLikelyYear = amount >= 1900 && amount <= 2100;
    const nearTaxYearWord = /שנת\s*מס|שנת\s*המס/.test(
      text.substring(
        Math.max(0, amountMatch.index - 40),
        Math.min(text.length, amountMatch.index + 40)
      )
    );

    // התעלמות ממספרים כחלק מתאריך (dd/mm/yyyy או mm/yyyy)
    const nearDateLike = /\d{1,2}\s*\/\s*\d{1,2}(\s*\/\s*\d{2,4})?/.test(
      around
    );

    // התעלמות ממספרים עם אחוז בסביבה הקרובה
    const nearPercent = /%/.test(around);

    // סינון: סכומים הגיוניים ולא קודים ידועים
    const knownCodes = Object.keys(TAX_CODES).map((k) => Number(k));

    // חריג לנקודות זיכוי - אפשר ערכים קטנים
    const isCreditPoints =
      text
        .substring(Math.max(0, amountMatch.index - 50), amountMatch.index + 50)
        .includes("נקודות זיכוי") ||
      text
        .substring(Math.max(0, amountMatch.index - 50), amountMatch.index + 50)
        .includes("נקודת זיכוי");

    // התעלמות משורות אחוזים בלבד
    const isPercentageOnly = text
      .substring(Math.max(0, amountMatch.index - 20), amountMatch.index + 20)
      .match(/^\s*[\d,\.]+\s*%?\s*$/);

    if (
      !isPercentageOnly &&
      !nearPercent &&
      !nearDateLike &&
      !(isLikelyYear && !nearTaxYearWord) &&
      amount < 10000000 &&
      !knownCodes.includes(amount)
    ) {
      // עבור נקודות זיכוי - אפשר כל ערך
      // עבור שאר השדות - רק מעל 0 (כולל 0)
      if (isCreditPoints || amount >= 0) {
        allAmounts.push({
          amount: amount,
          position: amountMatch.index,
          line: text.substring(0, amountMatch.index).split("\n").length - 1,
        });
      }
    }
  }

  console.log("=== DEBUG: Found amounts ===");
  console.log(allAmounts);
  console.log("=== END DEBUG ===");

  // Generic rule: prefer amount adjacent to code 042 for taxPaid
  (function apply042Preference() {
    const code042 = allCodes.find((c) => c.code === "042");
    if (!code042) return;
    const sameLine = allAmounts
      .filter((a) => a.line === code042.line && a.position > code042.position)
      .sort((a, b) => a.position - b.position);
    const pick = sameLine[0] || null;
    if (pick && (data.taxPaid === undefined || data.taxPaid === null)) {
      data.taxPaid = pick.amount;
      console.log(
        `=== DEBUG: taxPaid set from 042 adjacency: ${pick.amount} ===`
      );
      return;
    }
    // fallback: nearest within ±2 lines
    let best = null;
    let bestScore = -Infinity;
    for (const a of allAmounts) {
      const lineDist = Math.abs(a.line - code042.line);
      if (lineDist > 2) continue;
      let score = 100 - lineDist * 30;
      if (a.line === code042.line && a.position > code042.position) score += 25;
      score -= Math.abs(a.position - code042.position) * 0.01;
      if (score > bestScore) {
        bestScore = score;
        best = a;
      }
    }
    if (best && (data.taxPaid === undefined || data.taxPaid === null)) {
      data.taxPaid = best.amount;
      console.log(
        `=== DEBUG: taxPaid set from 042 context: ${best.amount} ===`
      );
    }
  })();

  // Pass 1: line-aware immediate matching – prefer amount on same line to the right of code
  const linesWithPositions = text.split("\n").map((l) => l);
  const lineStartPositions = [];
  {
    let acc = 0;
    for (const line of linesWithPositions) {
      lineStartPositions.push(acc);
      acc += line.length + 1; // +1 for the newline
    }
  }

  function findLineIndexByPos(pos) {
    // binary search could be used; linear is fine for small docs
    let idx = 0;
    for (let i = 0; i < lineStartPositions.length; i++) {
      const start = lineStartPositions[i];
      const next =
        i + 1 < lineStartPositions.length
          ? lineStartPositions[i + 1]
          : Infinity;
      if (pos >= start && pos < next) {
        idx = i;
        break;
      }
    }
    return idx;
  }

  const amountByLine = new Map(); // line -> sorted amounts (with absolute position)
  for (const a of allAmounts) {
    const arr = amountByLine.get(a.line) || [];
    arr.push(a);
    amountByLine.set(a.line, arr);
  }
  for (const [k, arr] of amountByLine.entries()) {
    arr.sort((x, y) => x.position - y.position);
  }

  // Same-line right-side preference
  for (const codeInfo of allCodes) {
    if (data[codeInfo.field]) continue;
    const lineArr = amountByLine.get(codeInfo.line);
    if (!lineArr || lineArr.length === 0) continue;
    // find first amount whose position is greater than code position (to the right)
    let picked = null;
    for (const a of lineArr) {
      if (a.position > codeInfo.position) {
        picked = a.amount;
        break;
      }
    }
    if (picked !== null && picked !== undefined) {
      data[codeInfo.field] = picked;
    }
  }

  // Pass 2: context window fallback if still missing – search nearest amount within +/- 2 lines with preference to small distance and right side
  const CONTEXT_WINDOW = 2;
  for (const codeInfo of allCodes) {
    if (data[codeInfo.field]) continue;
    let best = null;
    let bestScore = -Infinity;
    for (let dLine = -CONTEXT_WINDOW; dLine <= CONTEXT_WINDOW; dLine++) {
      const ln = codeInfo.line + dLine;
      const arr = amountByLine.get(ln);
      if (!arr) continue;
      for (const a of arr) {
        // scoring: base by inverse distance in lines, bonus if same line and to the right
        let score = 0;
        const lineDist = Math.abs(dLine);
        score += 100 - lineDist * 30;
        if (ln === codeInfo.line) {
          if (a.position > codeInfo.position)
            score += 50; // to the right gets a boost
          else score += 10; // same line but left
          score -= Math.abs(a.position - codeInfo.position) * 0.01; // small tie-breaker
        }
        // small penalty for amount zero unless field is taxPaid
        if (a.amount === 0 && codeInfo.field !== "taxPaid") score -= 25;
        if (score > bestScore) {
          bestScore = score;
          best = a.amount;
        }
      }
    }
    if (best !== null && best !== undefined) data[codeInfo.field] = best;
  }

  // מתאים קודים לסכומים לפי קרבה (שכבה כללית) – יישאר כגיבוי אחרון
  for (const codeInfo of allCodes) {
    if (data[codeInfo.field]) continue; // כבר נמצא

    let closestAmount = null;
    let minDistance = Infinity;
    let bestScore = -1;

    for (const amountInfo of allAmounts) {
      // חשב מרחק בין הקוד לסכום
      const distance = Math.abs(codeInfo.position - amountInfo.position);
      const lineDistance = Math.abs(codeInfo.line - amountInfo.line);

      // מערכת ניקוד: עדיפות לשורות סמוכות יותר
      let score = 0;

      // עדיפות גבוהה לאותה שורה
      if (lineDistance === 0) {
        score = 1000 - distance; // עדיפות גבוהה מאוד
        if (amountInfo.position > codeInfo.position) score += 25; // בונוס מימין
      }
      // עדיפות בינונית לשורות סמוכות
      else if (lineDistance === 1) {
        score = 500 - distance;
      }
      // עדיפות נמוכה לשורות רחוקות יותר
      else if (lineDistance <= 3) {
        score = 100 - distance;
      }

      // אם זה סכום 0, עדיפות נמוכה יותר (אלא אם זה מס שנוכה)
      if (amountInfo.amount === 0 && codeInfo.field !== "taxPaid") {
        score = score * 0.5;
      }

      if (score > bestScore) {
        bestScore = score;
        closestAmount = amountInfo.amount;
      }
    }

    if (closestAmount !== null) {
      data[codeInfo.field] = closestAmount;
    }
  }

  console.log("=== DEBUG: Final data after code-amount matching ===");
  console.log(data);
  console.log("=== END DEBUG ===");

  // פרסינג טבלאי: זיהוי טבלאות עם עמודות קוד/סכום והמרה לשדות
  (function parseTables() {
    const hasHeaders =
      /\bקוד\b[\s\S]{0,40}\bסכום\b|\bסכום\b[\s\S]{0,40}\bקוד\b/.test(text);
    if (!hasHeaders) return;

    const lines = text.split("\n");
    for (const line of lines) {
      // דפוסים נפוצים לשורה טבלאית: ... קוד <num> ... סכום <amount>
      const rowPatterns = [
        /(?:^|\s)(\d{2,5})(?:\s+|\s+[^\d]+\s+)([\d,\.]+)(?:\s*ש"ח)?(?:\s|$)/,
        /\)(\d{2,5})\(\s*([\d,\.]+)\s*ש"ח/,
        /(\d{2,5})\s+([\d,\.]+)\s*ש"ח/,
      ];
      for (const rp of rowPatterns) {
        const m = line.match(rp);
        if (m) {
          const code = m[1];
          const amount = Number(m[2].replace(/,/g, ""));
          if (TAX_CODES[code] && !Number.isNaN(amount) && amount >= 0) {
            const field = TAX_CODES[code];
            if (data[field] === undefined || data[field] === null) {
              data[field] = amount;
              console.log(
                `=== DEBUG: Table row mapped ${code} -> ${field} = ${amount} ===`
              );
            }
          }
          break;
        }
      }
    }
  })();

  // חיפוש ספציפי לטופס 106 - קוד בסוגריים ואז סכום
  const specificPatterns = [
    // דפוס: (158/172) סה"כ 45,118 ש"ח
    /\((\d{2,5})\/[^)]*\)\s*[^\d]*([\d,\.]+)\s*ש"ח/g,
    // דפוס: )042( 0 ש"ח - מס שנוכה
    /\)(\d{2,5})\(\s*([\d,\.]+)\s*ש"ח/g,
    // דפוס: )244/245( 45,118 - הכנסה מבוטחת
    /\)(\d{2,5})\/[^)]*\(\s*([\d,\.]+)/g,
    // דפוס: )086/045( 3,354 ש"ח - הפקדות לקופת גמל
    /\)(\d{2,5})\/[^)]*\(\s*([\d,\.]+)\s*ש"ח/g,
    // דפוס: )248/249( 6,989 ש"ח - הפקדות מעביד
    /\)(\d{2,5})\/[^)]*\(\s*([\d,\.]+)\s*ש"ח/g,
    // דפוס: קוד ואז סכום באותה שורה
    /(\d{2,5})\s+([\d,\.]+)/g,
    // דפוס: קוד ואז סכום עם ש"ח
    /(\d{2,5})\s+([\d,\.]+)\s*ש"ח/g,
  ];

  for (const pattern of specificPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const code = match[1];
      const amount = Number(match[2].replace(/,/g, ""));

      if (
        TAX_CODES[code] &&
        !data[TAX_CODES[code]] &&
        amount >= 0 &&
        amount < 10000000
      ) {
        console.log(
          `=== DEBUG: Found specific pattern - Code: ${code}, Amount: ${amount}, Field: ${TAX_CODES[code]} ===`
        );
        data[TAX_CODES[code]] = amount;
      }
    }
  }

  // חיפוש חכם לפי מילות מפתח לשדות עיקריים
  const keywords = {
    income: [
      "שכר ברוטו",
      'סה"כ שכר ברוטו',
      "ברוטו לשנה",
      'סה"כ הכנסה',
      "הכנסה חייבת",
      "שכר שנתי",
    ],
    taxPaid: [
      "מס הכנסה",
      'סה"כ מס הכנסה',
      "ניכוי מס הכנסה",
      'סה"כ ניכויי מס',
      "מס שנוכה",
    ],
    creditPoints: [
      "נקודות זיכוי",
      'סה"כ נקודות זיכוי',
      "נקודות זיכוי למס",
      "נקודת זיכוי",
    ],
    employeeName: ["שם העובד", "שם העובדת", "שם פרטי", "שם משפחה"],
    employeeId: ["ת.ז.", "תעודת זהות", "מספר זהות", "מספר ישות"],
    employerName: ["שם המעסיק", "שם החברה", "שם המעביד"],
    employerId: ["ח.פ.", "מספר מעסיק", "מס' תיק ניכויים"],
    taxYear: ["שנת המס", "שנת מס"],
    children: ["ילדים", "מספר ילדים", "מספר ילדים מתחת לגיל 10"],
    address: ["כתובת", "כתובת מגורים", "כתובת העובד"],
    maritalStatus: ["מצב משפחתי", "סטטוס משפחתי"],
    gender: ["מין", "מגדר", "מין מועמד"],
    birthYear: ["שנת לידה", "שנת לידת העובד"],
    workPeriod: ["תקופת עבודה", "חדשי עבודה", "תקופת העסקה"],
    pensionFund: ["קופת פנסיה", "פנסיה", "קופות גמל לקצבה"],
    providentFund: ["קופת גמל", "גמל", "הפקדות לקופת גמל"],
    studyFund: ["קופת השתלמות", "השתלמות", "קרן השתלמות"],
  };

  function smartExtract(text, keywords, existingData) {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const results = {};
    for (const [key, options] of Object.entries(keywords)) {
      if (existingData[key]) continue; // דלג אם כבר נמצא ב-regex
      for (const line of lines) {
        for (const word of options) {
          if (line.includes(word)) {
            // נסה לחלץ מספרים/תאריכים מהשורה
            const match = line.match(/([\d,\.\u200f\u200e\u202f\s\/]+)/g);
            if (match) {
              const cleaned = match[match.length - 1]
                .replace(/[\u200f\u200e\u202f\s]/g, "")
                .replace(/,/g, "");
              results[key] = cleaned;
              break;
            }
          }
        }
        if (results[key]) break;
      }
    }
    return results;
  }

  // שילוב תוצאות החיפוש החכם
  const smartResults = smartExtract(text, keywords, data);
  Object.assign(data, smartResults);

  // חיפוש לפי שם שדה (Labels) למקרים בהם יש תווית ברורה לפני הערך
  (function extractByLabels() {
    const labelMap = [
      {
        labels: ["שם העובד", "שם העובדת", "שם"],
        key: "employeeName",
        type: "text",
      },
      {
        labels: ["ת.ז.", "תעודת זהות", "מספר זהות"],
        key: "employeeId",
        type: "text",
      },
      {
        labels: ["כתובת", "כתובת מגורים", "כתובת העובד"],
        key: "address",
        type: "text",
      },
      {
        labels: ["שם המעסיק", "שם החברה", "שם המעביד"],
        key: "employerName",
        type: "text",
      },
      { labels: ["ח.פ.", "מספר מעסיק"], key: "employerId", type: "text" },
      { labels: ["שנת המס", "שנת מס"], key: "taxYear", type: "year" },
      {
        labels: ["תאריך לידה", "תאריך לידת העובד"],
        key: "birthDate",
        type: "date",
      },
      {
        labels: ["שנת לידה", "שנת לידת העובד"],
        key: "birthYear",
        type: "year",
      },
      {
        labels: ["תאריך תחילת עבודה", "תחילת עבודה"],
        key: "workStartDate",
        type: "date",
      },
      {
        labels: ["תאריך סיום עבודה", "סיום עבודה"],
        key: "workEndDate",
        type: "date",
      },
      {
        labels: ["תקופת עבודה", "תקופת העסקה", "חדשי עבודה"],
        key: "workPeriod",
        type: "text",
      },
      {
        labels: ["נקודות זיכוי", "נקודת זיכוי"],
        key: "creditPoints",
        type: "number",
      },
      {
        labels: ["שכר ברוטו", 'סה"כ שכר ברוטו', "ברוטו לשנה", 'סה"כ הכנסה'],
        key: "income",
        type: "amount",
      },
      {
        labels: [
          "מס הכנסה",
          'סה"כ מס הכנסה',
          'סה"כ ניכויי מס',
          "ניכוי מס הכנסה",
          "מס שנוכה",
        ],
        key: "taxPaid",
        type: "amount",
      },
    ];

    const lines = text.split("\n");
    function captureByType(line, type) {
      if (type === "date") {
        const m = line.match(/(\d{2}\/\d{2}\/\d{4})/);
        return m ? m[1] : null;
      }
      if (type === "year") {
        const m = line.match(/(19\d{2}|20\d{2})/);
        return m ? m[1] : null;
      }
      if (type === "number") {
        const m = line.match(/([\d,\.]+)/g);
        if (!m) return null;
        return Number(m[m.length - 1].replace(/,/g, ""));
      }
      if (type === "amount") {
        const m = line.match(/([\d,\.]+)\s*(?:ש"ח|₪)?/g);
        if (!m) return null;
        const last = m[m.length - 1].match(/[\d,\.]+/)[0];
        return Number(last.replace(/,/g, ""));
      }
      if (type === "text") {
        const m = line.match(/[:\-\s]+([^\n]+)$/);
        return m ? m[1].trim() : line.trim();
      }
      return null;
    }

    for (const { labels, key, type } of labelMap) {
      if (data[key]) continue; // אל תדרוס ערך קיים
      for (const line of lines) {
        if (labels.some((lbl) => line.includes(lbl))) {
          const value = captureByType(line, type);
          if (value !== null && value !== undefined && value !== "") {
            data[key] = value;
            break;
          }
        }
      }
    }
  })();

  // תיקונים כללים לכל סוגי הטבלאות
  console.log("=== DEBUG: Before general corrections ===");
  console.log(data);

  // תיקון כללי: זיהוי סכומים שגויים על בסיס הקשר
  data = applyGeneralCorrections(data, text);

  console.log("=== DEBUG: After general corrections ===");
  console.log(data);

  return data;
}

// פונקציה לתיקונים כללים לכל סוגי הטבלאות
function applyGeneralCorrections(data, text) {
  const correctedData = { ...data };

  // 1. תיקון סכומים זהים - אם שני שדות זהים, חפש סכום אחר בהקשר
  const duplicateAmounts = findDuplicateAmounts(correctedData);
  for (const [field1, field2, amount] of duplicateAmounts) {
    const alternativeAmount = findAlternativeAmount(
      text,
      field1,
      field2,
      amount
    );
    if (alternativeAmount !== null) {
      correctedData[field1] = alternativeAmount;
      console.log(
        `=== DEBUG: Fixed ${field1} from ${amount} to ${alternativeAmount} ===`
      );
    }
  }

  // 2. תיקון שדות עם ערכים לא הגיוניים
  const fixedData = fixIllogicalValues(correctedData, text);

  // 3. חיפוש שדות חסרים על בסיס הקשר
  const finalData = findMissingFieldsByContext(fixedData, text);

  return finalData;
}

// מצא סכומים זהים בשדות שונים
function findDuplicateAmounts(data) {
  const duplicates = [];
  const amounts = {};

  for (const [field, value] of Object.entries(data)) {
    if (typeof value === "number" && value > 0) {
      if (amounts[value]) {
        duplicates.push([amounts[value], field, value]);
      } else {
        amounts[value] = field;
      }
    }
  }

  return duplicates;
}

// מצא סכום חלופי על בסיס הקשר
function findAlternativeAmount(text, field1, field2, currentAmount) {
  // חפש סכומים אחרים ליד הקודים של השדות
  const fieldCodes = {
    income: ["158", "172", "150"],
    taxPaid: ["244", "245", "042"],
    taxCredits: ["248", "249", "218"],
    additionalIncome: ["045", "086", "200"],
  };

  const codes1 = fieldCodes[field1] || [];
  const codes2 = fieldCodes[field2] || [];

  // חפש סכום 0 ליד קודי מס שנוכה
  if (field1 === "taxPaid" || field2 === "taxPaid") {
    const zeroMatch = text.match(/\)042\(\s*0\s*ש"ח|042\s*0\s*ש"ח/);
    if (zeroMatch) {
      return 0;
    }
  }

  // חפש סכומים אחרים ליד הקודים
  for (const code of [...codes1, ...codes2]) {
    const patterns = [
      new RegExp(`\\)${code}\\(\\s*([\\d,\\.]+)\\s*ש"ח`),
      new RegExp(`\\(${code}\\/[^)]*\\)\\s*[^\\d]*([\\d,\\.]+)\\s*ש"ח`),
      new RegExp(`${code}\\s+([\\d,\\.]+)\\s*ש"ח`),
      new RegExp(`${code}\\s+([\\d,\\.]+)(?:\\s|$)`),
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = Number(match[1].replace(/,/g, ""));
        if (amount !== currentAmount && amount >= 0 && amount < 10000000) {
          return amount;
        }
      }
    }
  }

  return null;
}

// תיקון ערכים לא הגיוניים
function fixIllogicalValues(data, text) {
  const corrected = { ...data };

  // תיקון שנת לידה - לא יכולה להיות שנת מס
  if (
    corrected.birthYear &&
    corrected.taxYear &&
    corrected.birthYear === corrected.taxYear
  ) {
    // חפש שנת לידה אמיתית
    const birthYearMatch = text.match(/שנת\s*לידה[:\s]*(\d{4})/);
    if (birthYearMatch) {
      corrected.birthYear = birthYearMatch[1];
    } else {
      // חפש תאריך לידה
      const birthDateMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (birthDateMatch) {
        corrected.birthYear = birthDateMatch[1].split("/")[2];
      } else {
        // אם לא נמצא, הסר את הערך השגוי
        delete corrected.birthYear;
      }
    }
    console.log(`=== DEBUG: Fixed birthYear to ${corrected.birthYear} ===`);
  }

  // תיקון נקודות זיכוי - לא יכול להיות מספר גדול
  if (corrected.creditPoints && corrected.creditPoints > 20) {
    // חפש נקודות זיכוי אמיתיות
    const creditMatch = text.match(/נקודות\s*זיכוי[:\s]*([\d,\.]+)/);
    if (creditMatch) {
      corrected.creditPoints = Number(creditMatch[1].replace(/,/g, ""));
      console.log(
        `=== DEBUG: Fixed creditPoints to ${corrected.creditPoints} ===`
      );
    }
  }

  return corrected;
}

// חיפוש שדות חסרים על בסיס הקשר
function findMissingFieldsByContext(data, text) {
  const corrected = { ...data };

  // חיפוש הכנסה אם חסרה: קודים שכיחים או מילות מפתח
  if (!corrected.income) {
    const incomeCodePatterns = [
      /(\)|^)(158|170|172|150)(\(|\s+)\s*([\d,\.]+)\s*(?:ש"ח)?/,
      /(158|170|172|150)\s+([\d,\.]+)\s*(?:ש"ח)?/,
    ];
    for (const p of incomeCodePatterns) {
      const m = text.match(p);
      if (m) {
        const amt = Number((m[4] || m[2]).replace(/,/g, ""));
        if (amt >= 0 && amt < 10000000) {
          corrected.income = amt;
          console.log(`=== DEBUG: Fallback income by codes: ${amt} ===`);
          break;
        }
      }
    }
    if (!corrected.income) {
      const incomeText = text
        .split("\n")
        .find((l) => /(שכר ברוטו|ברוטו לשנה|סה.?כ\s*הכנסה)/.test(l));
      if (incomeText) {
        const nums = incomeText.match(/[\d,\.]+/g);
        if (nums && nums.length) {
          const amt = Number(nums[nums.length - 1].replace(/,/g, ""));
          if (amt >= 0 && amt < 10000000) {
            corrected.income = amt;
            console.log(`=== DEBUG: Fallback income by text: ${amt} ===`);
          }
        }
      }
    }
  }

  // חיפוש מס שנוכה אם חסר: 042/244/245 או טקסט
  if (!corrected.taxPaid) {
    const taxPaidPatterns = [
      /\)(042|244|245)\(\s*([\d,\.]+)\s*ש"ח/,
      /(042|244|245)\s+([\d,\.]+)\s*ש"ח/,
      /(סה\"כ\s*ניכויי\s*מס|ניכוי\s*מס\s*הכנסה|מס\s*שנוכה)[^\d]*([\d,\.]+)/,
    ];
    for (const p of taxPaidPatterns) {
      const m = text.match(p);
      if (m) {
        const amt = Number((m[2] || m[3]).replace(/,/g, ""));
        if (amt >= 0 && amt < 10000000) {
          corrected.taxPaid = amt;
          console.log(`=== DEBUG: Fallback taxPaid: ${amt} ===`);
          break;
        }
      }
    }
  }

  // קיים: חיפוש הכנסה נוספת
  if (!corrected.additionalIncome) {
    const additionalPatterns = [
      /\)086\/045\(\s*([\d,\.]+)\s*ש"ח/,
      /\)045\(\s*([\d,\.]+)\s*ש"ח/,
      /086\s+([\d,\.]+)\s*ש"ח/,
      /045\s+([\d,\.]+)\s*ש"ח/,
    ];

    for (const pattern of additionalPatterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = Number(match[1].replace(/,/g, ""));
        if (amount > 0 && amount < 10000000) {
          corrected.additionalIncome = amount;
          console.log(`=== DEBUG: Found additionalIncome: ${amount} ===`);
          break;
        }
      }
    }
  }

  return corrected;
}

// פונקציה לזיהוי תבנית טופס 106
function detectTemplate(text) {
  if (text.includes("אישור על הכנסות") && text.includes("שנת המס"))
    return "templateA";
  if (text.includes("תשלומים וניכויים") || text.includes("ניכויי מס"))
    return "templateB";
  if (text.includes("טופס 106") || text.includes("מספר עובד"))
    return "templateC";
  return "default";
}

// חילוץ חכם לפי הקשר, קודים ומילות מפתח עיקריים
function extractTaxFields(text) {
  const result = {
    income: null,
    tax_paid: null,
    credit_points: null,
    start_date: null,
    end_date: null,
    national_insurance: null,
    pension_contribution: null,
    social_benefits_received: {
      children: null,
      disability: null,
      old_age: null,
    },
  };

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // חיפוש לפי קודים
  for (const line of lines) {
    if (/158\s+([\d,\.]+)/.test(line)) {
      result.income = Number(
        line.match(/158\s+([\d,\.]+)/)[1].replace(/,/g, "")
      );
    }
    if (/244\s+([\d,\.]+)/.test(line)) {
      result.tax_paid = Number(
        line.match(/244\s+([\d,\.]+)/)[1].replace(/,/g, "")
      );
    }
    if (/248\s+([\d,\.]+)/.test(line)) {
      result.credit_points = Number(
        line.match(/248\s+([\d,\.]+)/)[1].replace(/,/g, "")
      );
    }
    if (/218\s+([\d,\.]+)/.test(line)) {
      result.credit_points = Number(
        line.match(/218\s+([\d,\.]+)/)[1].replace(/,/g, "")
      );
    }
    if (/127\s+([\d,\.]+)/.test(line)) {
      result.pension_contribution = Number(
        line.match(/127\s+([\d,\.]+)/)[1].replace(/,/g, "")
      );
    }
  }

  // חיפוש לפי מילות מפתח/הקשר
  for (const line of lines) {
    if (!result.income && /(סה.?כ\s*שכר|ברוטו שנתי|סה.?כ\s*הכנסה)/.test(line)) {
      const match = line.match(/([\d,\.]+)/g);
      if (match)
        result.income = Number(match[match.length - 1].replace(/,/g, ""));
    }
    if (!result.tax_paid && /(סה.?כ\s*מס|מס שנוכה|ניכוי מס הכנסה)/.test(line)) {
      const match = line.match(/([\d,\.]+)/g);
      if (match)
        result.tax_paid = Number(match[match.length - 1].replace(/,/g, ""));
    }
    if (!result.credit_points && /נקודות זיכוי/.test(line)) {
      const match = line.match(/([\d,\.]+)/g);
      if (match)
        result.credit_points = Number(
          match[match.length - 1].replace(/,/g, "")
        );
    }
    if (!result.start_date && /(תחילת עבודה|התחלת עבודה)/.test(line)) {
      const match = line.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (match) result.start_date = match[1];
    }
    if (!result.end_date && /(סיום עבודה|סיום העסקה)/.test(line)) {
      const match = line.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (match) result.end_date = match[1];
    }
    if (
      !result.national_insurance &&
      /(ביטוח לאומי|תשלומים לביטוח)/.test(line)
    ) {
      const match = line.match(/([\d,\.]+)/g);
      if (match)
        result.national_insurance = Number(
          match[match.length - 1].replace(/,/g, "")
        );
    }
    if (!result.pension_contribution && /(פנסיה|קופת גמל|השתלמות)/.test(line)) {
      const match = line.match(/([\d,\.]+)/g);
      if (match)
        result.pension_contribution = Number(
          match[match.length - 1].replace(/,/g, "")
        );
    }
    if (
      !result.social_benefits_received.children &&
      /(קצבת ילדים|ילדים)/.test(line)
    ) {
      const match = line.match(/([\d,\.]+)/g);
      if (match)
        result.social_benefits_received.children = Number(
          match[match.length - 1].replace(/,/g, "")
        );
    }
    if (
      !result.social_benefits_received.disability &&
      /(קצבת נכות|נכות)/.test(line)
    ) {
      const match = line.match(/([\d,\.]+)/g);
      if (match)
        result.social_benefits_received.disability = Number(
          match[match.length - 1].replace(/,/g, "")
        );
    }
    if (
      !result.social_benefits_received.old_age &&
      /(קצבת זקנה|זקנה)/.test(line)
    ) {
      const match = line.match(/([\d,\.]+)/g);
      if (match)
        result.social_benefits_received.old_age = Number(
          match[match.length - 1].replace(/,/g, "")
        );
    }
  }

  return result;
}

module.exports = { parseText, detectTemplate, extractTaxFields };
