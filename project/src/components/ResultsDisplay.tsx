import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  useTaxCalculator,
  isTaxDataFromUpload,
  type TaxData,
} from "../context/TaxCalculatorContext";
import { hasRequiredTaxCalculationData } from "../utils/taxFormValidation";
import { Dialog } from "@headlessui/react";
import {
  CheckCircle,
  Star,
  Wallet,
  Banknote,
  Send,
  Loader2,
} from "lucide-react";

import { DashboardCard } from "./ui/DashboardCard";
import { StatusBadge } from "./ui/StatusBadge";
import { Timeline } from "./ui/Timeline";
import { Skeleton } from "./ui/Skeleton";
import { Tooltip } from "./Tooltip";
import { BrandLogoIcon } from "./ui/BrandMark";

/** הסבר ליד תג רמת הסיכון — תואם ללוגיקה ב־backend/ai-agents/RiskAgent.js */
const RISK_LEVEL_TOOLTIP =
  "רמת הסיכון נקבעת אוטומטית לפי בדיקות המערכת: תקינות הנתונים (שגיאות או אזהרות), וסבירות יחס בין סכום ההחזר המחושב להכנסה המדווחת.\n\nזו אינה החלטת רשות המיסים ואינה מחליפה ייעוץ מס — מומלץ לוודא את הנתונים מול טופס 106.";

// בסיס ה-API - אותו לוגיקה כמו ב-utils/api.ts
const isLocalHost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");
const API_BASE =
  (import.meta as any).env?.VITE_API_URL ||
  (isLocalHost ? "http://localhost:4000" : "");

export const ResultsDisplay: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { taxData, goToPreviousStep, resetCalculator, setCalculatorStep } =
    useTaxCalculator();

  console.log("ResultsDisplay mounted - location.state:", location.state);
  console.log("ResultsDisplay mounted - taxData:", taxData);

  // Get current tax data from location.state or context
  const currentTaxData = useMemo(() => {
    return location.state?.taxData || taxData;
  }, [location.state?.taxData, taxData]);

  /** מניעת הרצה מחודשת של חישוב בגלל עדכוני taxData אחרי מעט מחשבון — גורם ל״ריענון״ ויזואלי */
  const calculationEffectKey = useMemo(() => {
    const s = location.state as {
      fromHistory?: boolean;
      fromCalculator?: boolean;
      taxData?: TaxData;
      result?: unknown;
    } | null;
    if (s?.fromHistory && s?.result) {
      return `hist:${location.key}`;
    }
    if (s?.fromCalculator && s?.taxData != null) {
      return `calc:${location.key}`;
    }
    return `dash:${location.pathname}:${JSON.stringify(taxData)}`;
  }, [location.key, location.state, location.pathname, taxData]);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noInitialData, setNoInitialData] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<
    null | "success" | "error" | "loading"
  >(null);
  const [emailError, setEmailError] = useState("");
  const [reportId, setReportId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  // Simulation state
  const [simType, setSimType] = useState<"donation" | "pension" | "salary">(
    "donation"
  );
  const [simAmount, setSimAmount] = useState<string>("5000");
  const [simResult, setSimResult] = useState<
    | null
    | {
        currentRefund: number;
        simulatedRefund: number;
        delta: number;
        scenarioDescription: string;
      }
  >(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [pdfDownloadedAt, setPdfDownloadedAt] = useState<string | null>(null);
  const [emailSentAt, setEmailSentAt] = useState<string | null>(null);
  // Track background auto-save in a ref (no re-render needed)
  const saveStatusRef = useRef<null | "idle" | "saving" | "saved" | "error">(
    null
  );

  // Safely parse JSON; handle empty body or plain text
  const parseJsonSafe = async (
    res: Response
  ): Promise<Record<string, unknown>> => {
    const text = await res.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  };

  const extractErrorMessage = (
    obj: Record<string, unknown>
  ): string | undefined => {
    const err = (obj as Record<string, unknown>).error as unknown;
    if (typeof err === "string" && err) return err;
    const msg = (obj as Record<string, unknown>).message as unknown;
    if (typeof msg === "string" && msg) return msg;
    return undefined;
  };

  useEffect(() => {
    console.log("ResultsDisplay useEffect triggered");
    console.log("location.state:", location.state);
    console.log("taxData from context:", taxData);

    // Check if we have pre-calculated results from history
    const fromHistory = location.state?.fromHistory;
    if (fromHistory && location.state?.result) {
      console.log("Using pre-calculated results from history");
      setResult(location.state.result as Record<string, unknown>);
      setLoading(false);
      return;
    }

    // Check if we have data from calculator
    const fromCalculator = location.state?.fromCalculator;

    console.log("fromCalculator:", fromCalculator);
    console.log("currentTaxData:", currentTaxData);

    // Validate data before calculation
    console.log("Validating data...");
    console.log("currentTaxData exists:", !!currentTaxData);
    console.log("income:", currentTaxData?.income);
    console.log("taxPaid:", currentTaxData?.taxPaid);
    console.log("taxYear:", currentTaxData?.taxYear);

    const taxPayload = (currentTaxData || {}) as Record<string, unknown>;
    const hasMinimalData =
      !!currentTaxData && hasRequiredTaxCalculationData(taxPayload);

    if (!hasMinimalData) {
      console.log("❌ Missing required data:", {
        income: currentTaxData?.income,
        taxPaid: currentTaxData?.taxPaid,
        taxYear: currentTaxData?.taxYear,
        maritalStatus: currentTaxData?.maritalStatus,
      });
      if (!fromCalculator && !fromHistory) {
        setNoInitialData(true);
      } else if (fromCalculator) {
        setCalculatorStep(2);
        navigate("/incomes", { replace: true });
      } else {
        setError("נתוני הדוח שמורים בהיסטוריה אינם מלאים.");
      }
      setLoading(false);
      return;
    }

    console.log("✅ Data validation passed, proceeding with calculation");

    console.log(
      "ResultsDisplay useEffect triggered, currentTaxData:",
      currentTaxData
    );
    setLoading(true);
    setError(null);

    // Import API functions dynamically to avoid circular dependencies
    import("../utils/api").then(({ apiCalculateTax, apiGeneratePdf }) => {
      apiCalculateTax(currentTaxData)
        .then(async (data) => {
          setResult(data);
          setLoading(false);
          console.log("Backend result:", data);
          // Auto-save report for logged-in users
          try {
            const token = localStorage.getItem("authToken");
            if (token) {
              saveStatusRef.current = "saving";
              console.log(
                "Auto-saving report with currentTaxData:",
                currentTaxData
              );
              console.log("Calculation result:", data);

              // Generate PDF and save to storage
              try {
                const { reportId } = await apiGeneratePdf(
                  token,
                  { ...currentTaxData, ...data },
                  true
                );
                console.log("Report saved successfully!");
                if (reportId) {
                  console.log("Report ID:", reportId);
                  setReportId(reportId);
                }
                saveStatusRef.current = "saved";
              } catch (error) {
                console.error("Error saving report:", error);
                saveStatusRef.current = "error";
              }
            } else {
              console.log("No token found, not saving report");
              saveStatusRef.current = "idle";
            }
          } catch (error) {
            console.error("Error saving report:", error);
            saveStatusRef.current = "error";
          }
        })
        .catch((error) => {
          console.error("Fetch error:", error);
          setError(error.message || "שגיאה בחישוב המס");
          setLoading(false);
        });
    });
    // תלות ב-calculationEffectKey בלבד — לא ב-taxData גולמי אחרי מעבר מהמחשבון (מונע מסך טעינה כפול)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculationEffectKey, navigate, goToPreviousStep]);

  if (loading)
    return (
      <div className="w-full max-w-5xl mx-auto space-y-4 animate-pulse" dir="rtl">
        <div className="rounded-xl border border-[#e8eaf2] bg-white h-40 shadow-sm" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-[#e8eaf2] bg-white p-4 h-32 shadow-sm">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-28 mt-4" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[#e8eaf2] bg-white h-64 shadow-sm" />
      </div>
    );
  if (noInitialData)
    return (
      <div
        className="max-w-lg mx-auto text-center py-16 px-4 rounded-xl border border-[#e8eaf2] bg-white shadow-sm"
        dir="rtl"
      >
        <BrandLogoIcon size="lg" className="mx-auto mb-6" />
        <h2 className="text-2xl font-extrabold text-[#131b2e] mb-3">
          ברוך הבא לדשבורד ההחזר שלך
        </h2>
        <p className="text-[#64748b] mb-8 leading-relaxed">
          כדי לראות ניתוח והמלצות מותאמות, מלא פרטי הכנסה או העלה טופס 106
          במסך העלאת מסמכים.
        </p>
        <button
          type="button"
          onClick={() => navigate("/incomes")}
          className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#00A86B] text-white font-bold hover:bg-[#00925d] transition-colors shadow-md"
        >
          התחל חישוב חדש
        </button>
      </div>
    );

  if (error)
    return (
      <div
        className="max-w-xl mx-auto text-center p-8 rounded-xl border border-red-200 bg-red-50 text-red-800"
        dir="rtl"
      >
        <p className="text-lg font-medium">{error}</p>
      </div>
    );
  if (!result)
    return (
      <div
        className="max-w-md mx-auto text-center p-10 rounded-xl border border-[#e8eaf2] bg-white text-[#64748b]"
        dir="rtl"
      >
        <p className="text-lg mb-6 text-[#131b2e] font-semibold">
          אין נתונים להצגה
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="px-6 py-2.5 rounded-xl bg-[#006D4E] text-white font-semibold hover:bg-[#005a40]"
        >
          חזרה לדשבורד
        </button>
      </div>
    );

  const {
    income,
    taxPaid,
    creditPoints,
    creditValue,
    grossTax,
    netTax,
    refund,
    explanation,
    confidenceScore,
    riskLevel,
    recommendations,
    validation,
    whyRefund,
    rulesApplied,
    documentSource,
  } = result as Record<string, unknown>;

  const refundNum = Number(refund);
  const creditPointsNum = Number(creditPoints);
  const creditValueNum = Number(creditValue);
  const grossTaxNum = Number(grossTax);
  const netTaxNum = Number(netTax);
  const taxPaidNum = Number(taxPaid);
  const incomeNum = Number(income);
  const explanationStr = String(explanation);

  const riskVariant =
    riskLevel === "low"
      ? "success"
      : riskLevel === "medium"
      ? "warning"
      : riskLevel
      ? "danger"
      : "neutral";

  const progressPct =
    typeof confidenceScore === "number"
      ? Math.max(0, Math.min(100, confidenceScore))
      : 0;

  const hasCompletedDelivery = Boolean(pdfDownloadedAt || emailSentAt);

  const timelineItems = [
    {
      title: isTaxDataFromUpload(currentTaxData as TaxData)
        ? "העלאת מסמכים"
        : "הזנת נתונים",
      date: new Date().toLocaleDateString("he-IL"),
      description: isTaxDataFromUpload(currentTaxData as TaxData)
        ? "טופס 106 הועלה בהצלחה"
        : "נתונים הוזנו ידנית",
      status: "done" as const,
    },
    {
      title: "בדיקה",
      date: new Date().toLocaleDateString("he-IL"),
      description: "ניתוח נתונים והפקת דוח",
      status: "done" as const,
    },
    {
      title: "דוח מוכן",
      date: hasCompletedDelivery
        ? pdfDownloadedAt || emailSentAt || "הופק היום"
        : "בתהליך",
      description: hasCompletedDelivery
        ? "ניתן להגיש לרשות המיסים"
        : "הדוח מוכן להורדה או שליחה במייל",
      status: hasCompletedDelivery ? ("done" as const) : ("pending" as const),
    },
  ];

  const heroAmountAbs = Math.abs(refundNum);
  const heroIsRefund = refundNum >= 0;

  const fmtIls = (n: number) => `${Math.round(n).toLocaleString("he-IL")} ₪`;

  const creditTotalEst = Math.round(creditValueNum * creditPointsNum) || 0;
  const additionalIncomeNum = Number(
    (currentTaxData as { additionalIncome?: number }).additionalIncome ?? 0
  );
  const salaryEst = Math.max(0, incomeNum - additionalIncomeNum);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE}/api/generate-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...currentTaxData,
          ...result,
          saveToStorage: false,
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        let errMsg = "שגיאה ביצירת ה-PDF בשרת";
        try {
          const j = JSON.parse(errText);
          if (typeof (j as { error?: string }).error === "string")
            errMsg = (j as { error: string }).error;
        } catch (_) {}
        setError(errMsg);
        return;
      }
      const disp = response.headers.get("Content-Disposition") || "";
      const match = disp.match(/filename\s*=\s*"?([^";]+)"?/i);
      const serverName = match ? match[1] : null;
      const td = currentTaxData as Record<string, unknown>;
      const year = String(td.taxYear ?? "");
      const full = [td.firstName, td.lastName]
        .filter(Boolean)
        .map((v) => String(v))
        .join(" ");
      const fallbackName = (
        full || String(td.employeeName ?? td.name ?? "tax-return")
      )
        .replace(/[^\u0590-\u05FF\w\s-]/g, "")
        .replace(/\s+/g, "_");
      const filename = serverName || `${fallbackName}-${year}.pdf`;
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setPdfDownloadedAt(new Date().toLocaleString("he-IL"));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-5xl mx-auto space-y-6 pb-12" dir="rtl">
        <section className="rounded-xl bg-white border border-[#e8eaf2] shadow-sm overflow-hidden flex flex-col md:flex-row">
          <div className="w-1 bg-[#00A86B] shrink-0" />
          <div className="flex-1 p-6 md:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 text-right">
              <StatusBadge
                variant={heroIsRefund ? "success" : "danger"}
                className="inline-flex items-center gap-1"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                {heroIsRefund ? "מאושר" : "בבדיקה"}
              </StatusBadge>
              <p className="text-sm text-[#64748b]">סכום החזר משוער</p>
              <p className="text-4xl sm:text-5xl font-extrabold text-[#006D4E] tabular-nums">
                {fmtIls(heroAmountAbs)}
              </p>
              <p className="text-sm text-[#64748b] leading-relaxed max-w-md">
                מבוסס על הנתונים שהוזנו. ניתן להוריד דוח PDF או לשלוח במייל.
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:items-end">
              <p className="text-xs text-[#64748b]">
                עודכן לאחרונה:{" "}
                {new Date().toLocaleDateString("he-IL", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <button
                type="button"
                disabled={downloading}
                onClick={handleDownloadPdf}
                className="px-5 py-2.5 rounded-xl bg-[#E6E9FF] text-[#131b2e] font-semibold text-sm border border-[#d8dcf0] hover:bg-[#dce0fa] disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {downloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    מוריד…
                  </>
                ) : (
                  "הורדת דוח מפורט"
                )}
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <DashboardCard
            title="סטטוס הבקשה"
            contentClassName="p-4"
            className="shadow-sm border-[#e8eaf2]"
          >
            <Timeline items={timelineItems} />
          </DashboardCard>
          <div className="rounded-xl border border-[#e8eaf2] bg-white p-5 shadow-sm">
            <Star className="h-6 w-6 text-[#00A86B] mb-3" />
            <p className="text-xs text-[#64748b]">נקודות זיכוי</p>
            <p className="text-2xl font-extrabold text-[#131b2e] mt-1 tabular-nums">
              {String(creditPointsNum)}
            </p>
          </div>
          <div className="rounded-xl border border-[#e8eaf2] bg-white p-5 shadow-sm">
            <Wallet className="h-6 w-6 text-[#00A86B] mb-3" />
            <p className="text-xs text-[#64748b]">מס ששולם</p>
            <p className="text-2xl font-extrabold text-[#006D4E] mt-1 tabular-nums">
              {fmtIls(taxPaidNum)}
            </p>
          </div>
          <div className="rounded-xl border border-[#e8eaf2] bg-white p-5 shadow-sm">
            <Banknote className="h-6 w-6 text-[#00A86B] mb-3" />
            <p className="text-xs text-[#64748b]">הכנסה שנתית</p>
            <p className="text-2xl font-extrabold text-[#131b2e] mt-1 tabular-nums">
              {fmtIls(incomeNum)}
            </p>
          </div>
        </section>

        {(documentSource || riskLevel) && (
          <div className="rounded-xl border border-[#e8eaf2] bg-white p-4 shadow-sm flex flex-wrap items-center gap-4 justify-between">
            <div className="text-sm text-[#64748b] min-w-0">
              {documentSource && (
                <span className="block truncate">
                  מקור: {String(documentSource)}
                </span>
              )}
            </div>
            {riskLevel && (
              <div className="flex items-center gap-1.5 shrink-0">
                <StatusBadge
                  variant={
                    riskVariant as "success" | "warning" | "danger" | "neutral"
                  }
                >
                  {riskLevel === "low"
                    ? "סיכון נמוך"
                    : riskLevel === "medium"
                      ? "סיכון בינוני"
                      : "סיכון גבוה"}
                </StatusBadge>
                <Tooltip
                  content={RISK_LEVEL_TOOLTIP}
                  ariaLabel="מהי משמעות רמת הסיכון"
                  iconClassName="w-4 h-4 text-[#64748b] hover:text-[#131b2e] cursor-help inline align-middle shrink-0"
                />
              </div>
            )}
            <div className="w-full sm:w-48 h-2 rounded-full bg-[#e8eaf2] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-l from-[#00A86B] to-[#006D4E]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs text-[#64748b]">{progressPct}% ביטחון</span>
          </div>
        )}

        <section className="rounded-xl border border-[#e8eaf2] bg-white shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 py-4 border-b border-[#e8eaf2] bg-[#f8f9fc]">
            <h2 className="text-lg font-extrabold text-[#131b2e]">
              פירוט חישוב סופי
            </h2>
            <span className="text-sm text-[#64748b]">
              שנת מס: {currentTaxData.taxYear}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right min-w-[520px]">
              <thead>
                <tr className="text-xs text-[#64748b] border-b border-[#e8eaf2] bg-[#f8f9fc]/80">
                  <th className="px-4 py-3 font-semibold">סעיף</th>
                  <th className="px-4 py-3 font-semibold">שכר ברוטו</th>
                  <th className="px-4 py-3 font-semibold">זיכויים</th>
                  <th className="px-4 py-3 font-semibold">חישוב סופי</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8eaf2]">
                <tr>
                  <td className="px-4 py-3 text-[#131b2e]">שכר ונספחים</td>
                  <td className="px-4 py-3 tabular-nums">{fmtIls(salaryEst)}</td>
                  <td className="px-4 py-3 tabular-nums text-rose-600">
                    −
                    {Math.min(creditTotalEst, salaryEst).toLocaleString("he-IL")}{" "}
                    ₪
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums">
                    {fmtIls(Math.max(0, salaryEst - Math.min(creditTotalEst, salaryEst)))}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-[#131b2e]">הכנסות נוספות</td>
                  <td className="px-4 py-3 tabular-nums">
                    {fmtIls(additionalIncomeNum)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-[#64748b]">—</td>
                  <td className="px-4 py-3 font-semibold tabular-nums">
                    {fmtIls(additionalIncomeNum)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-[#131b2e]">הפרשות לקופות גמל</td>
                  <td className="px-4 py-3 tabular-nums text-[#64748b]">—</td>
                  <td className="px-4 py-3 tabular-nums text-[#64748b]">—</td>
                  <td className="px-4 py-3 font-semibold tabular-nums text-[#64748b] text-xs">
                    לפי נתוני המערכת
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-emerald-50/90 text-[#006D4E]">
                  <td
                    colSpan={3}
                    className="px-4 py-4 font-extrabold text-right"
                  >
                    סה&quot;כ החזר מאושר
                  </td>
                  <td className="px-4 py-4 font-extrabold text-lg tabular-nums">
                    {fmtIls(refundNum)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-4">
          <DashboardCard
            title="מה זה אומר?"
            className="border-[#e8eaf2] shadow-sm"
          >
            {whyRefund && typeof whyRefund === "string" ? (
              <p className="text-sm text-[#4a5568] leading-relaxed">
                {whyRefund}
              </p>
            ) : (
              <p className="text-sm text-[#4a5568] leading-relaxed">
                {explanationStr.split("\n")[0]}
              </p>
            )}
          </DashboardCard>
          <DashboardCard
            title="נתונים טכניים"
            className="border-[#e8eaf2] shadow-sm"
          >
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between gap-2 text-[#64748b]">
                <span>מס ברוטו</span>
                <span className="font-semibold text-[#131b2e] tabular-nums">
                  {fmtIls(grossTaxNum || 0)}
                </span>
              </div>
              <div className="flex justify-between gap-2 text-[#64748b]">
                <span>מס נטו</span>
                <span className="font-semibold text-[#131b2e] tabular-nums">
                  {fmtIls(netTaxNum || 0)}
                </span>
              </div>
              <div className="flex justify-between gap-2 text-[#64748b]">
                <span>ערך נקודת זיכוי</span>
                <span className="font-semibold text-[#131b2e] tabular-nums">
                  {fmtIls(creditValueNum || 0)}
                </span>
              </div>
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-[#006D4E] font-semibold">
                הצג פירוט מלא
              </summary>
              <div className="mt-3 rounded-xl bg-[#f8f9fc] px-4 py-3 text-xs text-[#64748b] whitespace-pre-line leading-relaxed">
                {explanationStr}
              </div>
            </details>
          </DashboardCard>
        </div>

        {Array.isArray(recommendations) && recommendations.length > 0 && (
          <DashboardCard title="המלצות" className="border-[#e8eaf2] shadow-sm">
            <ul className="space-y-2 text-sm text-[#64748b]">
              {(recommendations as string[]).slice(0, 6).map((rec, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-[#00A86B]">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </DashboardCard>
        )}

        <div className="flex flex-col items-center gap-4 pt-2">
          <button
            type="button"
            className="w-full max-w-lg flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-[#006D4E] text-[#006D4E] font-bold bg-white hover:bg-[#E6E9FF]/40 transition-colors shadow-sm"
            onClick={() =>
              window.alert(
                "להגשת בקשה בפועל יש להיכנס לאזור האישי של רשות המיסים. השלב מתבצע מחוץ למערכת זו."
              )
            }
          >
            <Send className="h-5 w-5" />
            הגשת הבקשה לרשות המיסים
          </button>
          <div className="flex flex-wrap items-center justify-center gap-2 w-full">
            <button
              type="button"
              onClick={() => {
                const fromHistory = location.state?.fromHistory;
                if (fromHistory) navigate("/history");
                else {
                  goToPreviousStep();
                  navigate("/");
                }
              }}
              className="px-4 py-2 rounded-xl border border-[#e8eaf2] bg-white text-sm font-medium text-[#131b2e] hover:bg-[#E6E9FF]/30"
            >
              חזרה
            </button>
            <button
              type="button"
              onClick={() => {
                resetCalculator();
                navigate("/");
              }}
              className="px-4 py-2 rounded-xl border border-[#e8eaf2] bg-white text-sm font-medium text-[#131b2e] hover:bg-[#E6E9FF]/30"
            >
              חישוב חדש
            </button>
            <button
              type="button"
              onClick={() => {
                resetCalculator();
                navigate("/incomes");
              }}
              className="px-4 py-2 rounded-xl border border-[#e8eaf2] bg-white text-sm font-medium text-[#131b2e] hover:bg-[#E6E9FF]/30"
            >
              העלה טופס חדש
            </button>
            <button
              type="button"
              disabled={downloading}
              onClick={handleDownloadPdf}
              className="px-4 py-2 rounded-xl bg-[#006D4E] text-white text-sm font-semibold hover:bg-[#005a40] disabled:opacity-50"
            >
              {downloading ? "מוריד…" : "שמור PDF"}
            </button>
            <button
              type="button"
              onClick={() => setIsEmailModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#00A86B] text-white text-sm font-semibold hover:bg-[#00925d]"
            >
              שלח במייל
            </button>
          </div>
        </div>
      </div>

        {/* דיאלוג שליחת מייל */}
        <Dialog
          open={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          className="relative z-50"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-gray-100">
              <Dialog.Title className="text-xl font-bold mb-2 text-center text-blue-700">
                שליחת דוח במייל
              </Dialog.Title>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setEmailStatus("loading");
                  setEmailError("");
                  try {
                    const token = localStorage.getItem("authToken");
                    const res = await fetch(
                      `${API_BASE}/api/send-tax-return-email`,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          ...(token
                            ? { Authorization: `Bearer ${token}` }
                            : {}),
                        },
                        body: JSON.stringify({
                          taxData: { ...currentTaxData, ...result },
                          email,
                          calculationResult: result,
                          reportId: reportId || undefined,
                        }),
                      }
                    );
                    const data = await parseJsonSafe(res);
                    if ((data as Record<string, unknown>).success) {
                      setEmailStatus("success");
                      setIsEmailModalOpen(false);
                      setShowSuccessModal(true);
                      setEmailSentAt(new Date().toLocaleString("he-IL"));
                      setTimeout(() => {
                        setShowSuccessModal(false);
                      }, 2000);
                    } else {
                      setEmailStatus("error");
                      setEmailError(extractErrorMessage(data) || "שליחה נכשלה");
                    }
                  } catch {
                    setEmailStatus("error");
                    setEmailError("שגיאה בשליחה לשרת");
                  }
                }}
                className="space-y-4"
              >
                <input
                  type="email"
                  className="input-field w-full"
                  placeholder="הזן כתובת מייל"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {emailStatus === "error" && (
                  <div className="text-red-600 text-sm text-center">
                    {emailError}
                  </div>
                )}
                {emailStatus === "success" && (
                  <div className="text-green-600 text-sm text-center">
                    הדוח נשלח בהצלחה!
                  </div>
                )}
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setIsEmailModalOpen(false);
                      setEmailStatus(null);
                      setEmail("");
                    }}
                  >
                    ביטול
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={emailStatus === "loading"}
                  >
                    {emailStatus === "loading" ? "שולח..." : "שלח"}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  הדוח נשלח בהצלחה!
                </h3>
                <p className="text-gray-600 mb-4">
                  הדוח נשלח לכתובת המייל שציינת
                </p>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="btn-primary"
                >
                  אישור
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );
};
