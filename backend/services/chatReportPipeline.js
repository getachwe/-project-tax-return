/**
 * צינור דוחות לצ'אט: סניטציה (ללא PII), העשרה (מגמות, יחסים), ועיצוב טקסטואלי ל-LLM.
 * לפי ai-chatbot-tax-system.prompt.md
 */

const STATIC_PII_KEYS = new Set([
  "employeeId",
  "employee_id",
  "employerId",
  "employer_id",
  "nationalId",
  "idNumber",
  "id_number",
  "phoneNumber",
  "phone",
  "mobile",
  "email",
  "address",
  "street",
  "city",
  "zip",
  "postalCode",
  "birthDate",
  "dateOfBirth",
  "bankAccount",
  "iban",
  "accountNumber",
  "employeeName",
  "employerName",
  "managerName",
  "firstName",
  "lastName",
  "first_name",
  "last_name",
  "fullName",
  "passport",
  "identity",
]);

/** מפתחות שעלולים להכיל מזהה — דינמי */
const PII_KEY_PATTERNS = [
  /email/i,
  /phone|mobile|tel|cell/i,
  /address|street|city|zip|postal|מיקוד|כתובת|רחוב/i,
  /name$/i,
  /^first/i,
  /^last/i,
  /national|passport|ת\.?ז|identity|idNumber|employeeId|employerId/i,
  /bank|iban|account|card/i,
  /secret|token|password|ssn/i,
];

function isPiiKey(key) {
  if (typeof key !== "string") return false;
  if (STATIC_PII_KEYS.has(key)) return true;
  return PII_KEY_PATTERNS.some((re) => re.test(key));
}

const MAX_DEPTH = 12;
const MAX_ARRAY_LEN = 45;
const MAX_STRING_LEN = 2000;
const MAX_OBJECT_KEYS = 80;

function sanitizePrimitive(v) {
  if (typeof v === "string" && v.length > MAX_STRING_LEN) {
    return `${v.slice(0, MAX_STRING_LEN)}…`;
  }
  return v;
}

/**
 * הסרת שדות מזהים רקורסיבית; שמירה על שדות פיננסיים/מספריים.
 * @param {unknown} value
 * @param {number} depth
 * @returns {unknown}
 */
function sanitizeValue(value, depth) {
  if (value === null || value === undefined) return value;
  if (depth > MAX_DEPTH) return "[מבנה עמוק מדי — הושמט]";
  const t = typeof value;
  if (t === "number" || t === "boolean") return value;
  if (t === "bigint") return value.toString();
  if (t === "string") return sanitizePrimitive(value);
  if (Array.isArray(value)) {
    const slice = value.slice(0, MAX_ARRAY_LEN);
    return slice.map((item) => sanitizeValue(item, depth + 1));
  }
  if (t === "object") {
    const out = {};
    let count = 0;
    for (const [k, v] of Object.entries(value)) {
      if (isPiiKey(k)) continue;
      if (count >= MAX_OBJECT_KEYS) {
        out._truncated = true;
        break;
      }
      out[k] = sanitizeValue(v, depth + 1);
      count += 1;
    }
    return out;
  }
  return undefined;
}

/**
 * @param {Array<{ id?: string, reportYear?: number|null, createdAt?: string, fileName?: string|null, taxData?: object, calculation?: object }>} reports
 */
function hebrewLetterLabel(index) {
  if (index >= 0 && index < 22) {
    return `דוח ${String.fromCharCode(0x05d0 + index)}`;
  }
  return `דוח ${index + 1}`;
}

function sanitizeReports(reports) {
  if (!Array.isArray(reports)) return [];
  return reports.map((rep) => {
    const taxData = sanitizeValue(rep.taxData || {}, 0);
    const calculation = sanitizeValue(rep.calculation || {}, 0);
    return {
      reportYear: rep.reportYear ?? null,
      createdAt: rep.createdAt ?? null,
      taxData: taxData && typeof taxData === "object" ? taxData : {},
      calculation: calculation && typeof calculation === "object" ? calculation : {},
      _internalId: rep.id,
    };
  });
}

function num(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pickIncome(td) {
  return num(td?.income);
}

function pickTaxPaid(td, calc) {
  return num(td?.taxPaid) ?? num(calc?.taxPaid);
}

function pickRefund(calc) {
  return (
    num(calc?.refundAmount) ??
    num(calc?.totalRefund) ??
    num(calc?.refund)
  );
}

/**
 * @param {ReturnType<typeof sanitizeReports>} sanitized
 */
function enrichReports(sanitized) {
  const sorted = [...sanitized].sort((a, b) => {
    const ta = new Date(a.createdAt || 0).getTime();
    const tb = new Date(b.createdAt || 0).getTime();
    return tb - ta;
  });

  return sorted.map((rep, idx) => {
    const td = rep.taxData || {};
    const calc = rep.calculation || {};
    const income = pickIncome(td);
    const taxPaid = pickTaxPaid(td, calc);
    const refund = pickRefund(calc);
    const taxRate =
      income && income !== 0 && taxPaid != null ? taxPaid / income : null;
    const refundRate =
      income && income !== 0 && refund != null ? refund / income : null;

    const older = sorted[idx + 1];
    let incomeChangePct = null;
    let incomeChangeLabel = null;
    if (older) {
      const prevInc = pickIncome(older.taxData || {});
      if (prevInc && income != null && prevInc !== 0) {
        incomeChangePct = ((income - prevInc) / prevInc) * 100;
        if (incomeChangePct > 1) incomeChangeLabel = "עלייה לעומת דוח ישן יותר";
        else if (incomeChangePct < -1) incomeChangeLabel = "ירידה לעומת דוח ישן יותר";
        else incomeChangeLabel = "יציב יחסית לעומת דוח ישן יותר";
      }
    }

    let refundTrend = null;
    if (older) {
      const prevRef = pickRefund(older.calculation || {});
      if (refund != null && prevRef != null) {
        const d = refund - prevRef;
        if (d > 1) refundTrend = "החזר גבוה יותר מבדוח ישן יותר";
        else if (d < -1) refundTrend = "החזר נמוך יותר מבדוח ישן יותר";
        else refundTrend = "החזר דומה לדוח ישן יותר";
      }
    }

    return {
      ...rep,
      label: hebrewLetterLabel(idx),
      ordinal: idx + 1,
      insights: {
        income,
        taxPaid,
        refund,
        taxRate,
        refundRate,
        incomeChangePct,
        incomeChangeLabel,
        refundTrend,
      },
    };
  });
}

function pct(n) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}%`;
}

function fmtMoney(n) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${Math.round(n).toLocaleString("he-IL")} ₪`;
}

/**
 * @param {ReturnType<typeof enrichReports>} enriched
 */
function formatReportsForAI(enriched) {
  if (!enriched.length) {
    return "אין נתונים פיננסיים זמינים לניתוח (אין דוחות שמורים בהקשר).";
  }

  const lines = [
    "נתונים פיננסיים לניתוח (ללא מזהים אישיים — תוויות דוחות בלבד):",
    "",
  ];

  enriched.forEach((r, i) => {
    const td = r.taxData || {};
    const ins = r.insights || {};
    lines.push(`— ${r.label} (סדר ${i + 1} = ${i === 0 ? "העדכני ביותר" : "ישן יותר"})`);
    lines.push(`  שנת דוח: ${r.reportYear ?? "לא צוין"}`);
    if (r.createdAt) lines.push(`  תאריך שמירה במערכת: ${r.createdAt}`);
    lines.push(`  הכנסה (כפי שהוזנה): ${fmtMoney(ins.income)}`);
    lines.push(`  מס ששולם: ${fmtMoney(ins.taxPaid)}`);
    lines.push(`  החזר משוער: ${fmtMoney(ins.refund)}`);
    lines.push(`  שיעור מס משוער (מס/הכנסה): ${ins.taxRate != null ? pct(ins.taxRate * 100) : "—"}`);
    lines.push(
      `  שיעור החזר יחסי (החזר/הכנסה): ${ins.refundRate != null ? pct(ins.refundRate * 100) : "—"}`,
    );
    if (ins.incomeChangePct != null) {
      lines.push(
        `  שינוי הכנסה לעומת הדוח הבא בזמן: ${ins.incomeChangePct >= 0 ? "+" : ""}${ins.incomeChangePct.toFixed(1)}%`,
      );
      if (ins.incomeChangeLabel) lines.push(`  תווית מגמה הכנסה: ${ins.incomeChangeLabel}`);
    }
    if (ins.refundTrend) lines.push(`  מגמת החזר: ${ins.refundTrend}`);

    const extras = [];
    if (td.children != null && td.children !== "") extras.push(`ילדים/זיכוי ילדים: ${td.children}`);
    if (td.maritalStatus != null && td.maritalStatus !== "")
      extras.push(`מצב משפחתי: ${td.maritalStatus}`);
    if (td.taxCredits != null && td.taxCredits !== "") extras.push(`זיכויים: ${td.taxCredits}`);
    if (extras.length) lines.push(`  שדות נוספים (לא מזהים): ${extras.join("; ")}`);

    const expl = r.calculation?.explanation;
    if (expl != null && String(expl).trim()) {
      const full = String(expl).trim();
      const max = 2200;
      const tail = full.length > max ? "\n  [המשך הפירוט קוצר]" : "";
      lines.push(`  פירוט מילולי מהמערכת (explanation):\n  ${full.slice(0, max).replace(/\n/g, "\n  ")}${tail}`);
    }
    lines.push("");
  });

  lines.push(
    "הנחיה: השתמש רק בנתונים לעיל ובשיחה; אם חסר ערך — ציין זאת. אל תנחש זהות או פרטים שאינם מופיעים.",
  );
  return lines.join("\n");
}

/**
 * @param {Array<{ id?: string, reportYear?: number|null, createdAt?: string, fileName?: string|null, taxData?: object, calculation?: object }>} rawReports
 */
function prepareReportsForAiContext(rawReports) {
  const sanitized = sanitizeReports(rawReports);
  const enriched = enrichReports(sanitized);
  const formattedForAI = formatReportsForAI(enriched);
  const forClientShape = enriched.map((r) => ({
    id: r._internalId,
    reportYear: r.reportYear,
    createdAt: r.createdAt,
    fileName: null,
    taxData: r.taxData,
    calculation: r.calculation,
    insights: r.insights,
    label: r.label,
  }));
  return {
    sanitizedReports: sanitized,
    enrichedReports: enriched,
    formattedForAI,
    reportsForContext: forClientShape,
  };
}

module.exports = {
  sanitizeReports,
  enrichReports,
  formatReportsForAI,
  prepareReportsForAiContext,
  STATIC_PII_KEYS,
};
