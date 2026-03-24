/**
 * בניית הקשר לצ'אט: אורחים — ידע כללי; משתמש מחובר — עד N דוחות אחרונים
 * עם צינור סניטציה, העשרה ועיצוב טקסט (chatReportPipeline) לשליחה ל-LLM.
 */

const { prepareReportsForAiContext } = require("./chatReportPipeline");

const HARD_MAX_REPORTS = 40;

/** לא מעבירים ל-LLM / ללוג הקשר */
const TAX_DATA_BLOCKLIST = new Set([
  "employeeId",
  "employee_id",
  "employerId",
  "employer_id",
  "nationalId",
  "idNumber",
  "phoneNumber",
  "phone",
  "email",
  "address",
  "birthDate",
  "bankAccount",
  "employeeName",
  "managerName",
]);

/** טקסט ידע כללי לאורח — פירוט מסכים וניווט בקובץ chat-system-knowledge-he.md (נשלח בבלוק ידע_מערכת) */
const GUEST_GENERAL_KNOWLEDGE = `
מערכת "מס החזר": הערכת החזר מס משוערת לפי טופס 106 (PDF או מילוי ידני). אינה מחליפה ייעוץ מס או החלטת רשות המיסים.
במצב אורח אין גישה לדוחות אישיים — להתאמה אישית יש להתחבר ולפתוח את העוזר מתוך הדשבורד.

למפת מסכים, נתיבים ויכולות — עיינו בבלוק "### ידע_מערכת" באותו הקשר.
`.trim();

function pickAllowedTaxFields(taxData) {
  if (!taxData || typeof taxData !== "object") return {};
  const ALLOWED = new Set([
    "income",
    "taxPaid",
    "taxCredits",
    "children",
    "maritalStatus",
    "academicDegree",
    "newImmigrant",
    "livingInPeriphery",
    "taxYear",
    "hasFormData",
    "dataSource",
  ]);
  const out = {};
  for (const key of Object.keys(taxData)) {
    if (ALLOWED.has(key)) out[key] = taxData[key];
  }
  return out;
}

/** כל השדות למעט רשימת חסימה — חומר גלם ל-LLM */
function pickTaxDataForChat(taxData) {
  if (!taxData || typeof taxData !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(taxData)) {
    if (TAX_DATA_BLOCKLIST.has(k)) continue;
    const t = typeof v;
    if (t === "string" || t === "number" || t === "boolean" || v === null) {
      out[k] = v;
      continue;
    }
    if (Array.isArray(v) && v.length <= 40) {
      out[k] = v;
      continue;
    }
    if (t === "object" && v !== null && !Array.isArray(v)) {
      try {
        const s = JSON.stringify(v);
        if (s.length <= 500) out[k] = v;
      } catch {
        /* skip */
      }
    }
  }
  return out;
}

function pickCalculationSummary(calculationResult) {
  if (!calculationResult || typeof calculationResult !== "object") return {};
  const cr = calculationResult;
  const summary = {};
  const keys = [
    "refundAmount",
    "totalRefund",
    "refund",
    "taxYear",
    "taxableIncome",
    "totalTax",
    "income",
    "taxPaid",
    "grossTax",
    "netTax",
    "creditPoints",
    "creditValue",
    "explanation",
    "children",
    "childrenUnder6",
    "gender",
    "isArmyService",
    "isNationalService",
    "yearsSinceAliyah",
  ];
  for (const k of keys) {
    if (cr[k] !== undefined && cr[k] !== null) summary[k] = cr[k];
  }
  return summary;
}

/** חישוב מלא יחסית לצ'אט — כולל calculationDetails אם קיים */
function pickCalculationForChat(calculationResult) {
  const base = pickCalculationSummary(calculationResult);
  if (!calculationResult || typeof calculationResult !== "object") return base;
  const cr = calculationResult;
  if (cr.calculationDetails && typeof cr.calculationDetails === "object") {
    try {
      base.calculationDetails = JSON.parse(JSON.stringify(cr.calculationDetails));
    } catch {
      base.calculationDetails = cr.calculationDetails;
    }
  }
  return base;
}

function capExplanationInCalc(calc, maxChars) {
  if (!calc || typeof calc !== "object") return calc;
  const o = { ...calc };
  if (o.explanation != null && typeof o.explanation === "string") {
    const t = o.explanation;
    if (t.length > maxChars) {
      o.explanation = `${t.slice(0, maxChars)}\n[…נקצר]`;
    }
  }
  return o;
}

function resolveReportLimit(requested) {
  const envDefault = parseInt(process.env.CHAT_MAX_REPORTS || "15", 10);
  let n = Number.isFinite(requested) ? Math.floor(requested) : envDefault;
  if (n < 1) n = 1;
  if (n > HARD_MAX_REPORTS) n = HARD_MAX_REPORTS;
  return n;
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} service
 * @param {string} userId
 * @param {{ maxReports?: number }} [opts]
 */
async function fetchReportsBundle(service, userId, opts = {}) {
  const limit = resolveReportLimit(opts.maxReports);
  const explCap = parseInt(
    process.env.CHAT_EXPLANATION_MAX_CHARS || "8000",
    10
  );

  const { data, error } = await service
    .from("reports")
    .select("id, year, created_at, file_name, tax_data, calculation_result")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data || []).map((row) => {
    const rawCalc =
      row.calculation_result && typeof row.calculation_result === "object"
        ? row.calculation_result
        : {};
    return {
      id: row.id,
      reportYear: row.year,
      createdAt: row.created_at,
      fileName: row.file_name,
      taxData:
        row.tax_data && typeof row.tax_data === "object" ? row.tax_data : {},
      calculation: capExplanationInCalc(rawCalc, explCap),
    };
  });
}

/** @param {import("@supabase/supabase-js").SupabaseClient} service */
async function fetchLatestReportSnapshot(service, userId) {
  const bundle = await fetchReportsBundle(service, userId, { maxReports: 1 });
  return bundle[0] || null;
}

/** @param {import("@supabase/supabase-js").SupabaseClient} service */
async function fetchProfileSummary(service, userId) {
  const { data, error } = await service
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return {
    firstName: data?.first_name || null,
    lastName: data?.last_name || null,
  };
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} service
 * @param {{ maxReports?: number }} [opts]
 */
async function buildAuthenticatedContext(service, userId, opts = {}) {
  const [profile, rawReports] = await Promise.all([
    fetchProfileSummary(service, userId),
    fetchReportsBundle(service, userId, opts),
  ]);

  const { formattedForAI, reportsForContext } =
    prepareReportsForAiContext(rawReports);

  return {
    mode: "authenticated",
    profile,
    reports: reportsForContext,
    latestReport: reportsForContext[0] || null,
    formattedReportsForAI: formattedForAI,
    guestKnowledge: null,
  };
}

function buildGuestContext() {
  return {
    mode: "guest",
    profile: null,
    latestReport: null,
    reports: [],
    guestKnowledge: GUEST_GENERAL_KNOWLEDGE,
  };
}

module.exports = {
  buildAuthenticatedContext,
  buildGuestContext,
  GUEST_GENERAL_KNOWLEDGE,
  pickAllowedTaxFields,
  pickTaxDataForChat,
  pickCalculationSummary,
  pickCalculationForChat,
  fetchReportsBundle,
  HARD_MAX_REPORTS,
};
