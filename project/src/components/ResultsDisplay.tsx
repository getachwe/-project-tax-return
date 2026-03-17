import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTaxCalculator } from "../context/TaxCalculatorContext";
import { Dialog } from "@headlessui/react";
import {
  CheckCircle,
  Sparkles,
  Calculator,
  Coins,
  TrendingUp,
  CreditCard,
  Receipt,
  FileText,
  Calculator as CalcIcon,
  ShieldCheck,
  Lock,
} from "lucide-react";

import { DashboardCard } from "./ui/DashboardCard";
import { StatusBadge } from "./ui/StatusBadge";
import { Timeline } from "./ui/Timeline";
import { ActivityList } from "./ui/ActivityList";
import { Skeleton } from "./ui/Skeleton";

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
  const { taxData, goToPreviousStep, resetCalculator } = useTaxCalculator();

  console.log("ResultsDisplay mounted - location.state:", location.state);
  console.log("ResultsDisplay mounted - taxData:", taxData);

  // Get current tax data from location.state or context
  const currentTaxData = React.useMemo(() => {
    return location.state?.taxData || taxData;
  }, [location.state?.taxData, taxData]);
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

    const hasMinimalData =
      !!currentTaxData &&
      !!currentTaxData.income &&
      !!currentTaxData.taxPaid &&
      !!currentTaxData.taxYear;

    if (!hasMinimalData) {
      console.log("❌ Missing required data:", {
        income: currentTaxData?.income,
        taxPaid: currentTaxData?.taxPaid,
        taxYear: currentTaxData?.taxYear,
      });
      // אם המשתמש פשוט נכנס לדשבורד בלי חישוב קודם – נציג מסך ברירת מחדל במקום שגיאה
      if (!fromCalculator && !fromHistory) {
        setNoInitialData(true);
      } else {
        setError(
          "חסרים נתונים חיוניים לחישוב המס. אנא חזור לשלב הקודם ומלא את השדות הנדרשים."
        );
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
  }, [taxData, location.state, currentTaxData]);

  if (loading)
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 space-y-4">
          <DashboardCard title="Dashboard Overview" subtitle="Analysis">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-border bg-card/70 p-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-36 mt-3" />
                <Skeleton className="h-4 w-20 mt-2" />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-36 mt-3" />
                <Skeleton className="h-4 w-20 mt-2" />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-36 mt-3" />
                <Skeleton className="h-4 w-20 mt-2" />
              </div>
            </div>
          </DashboardCard>
          <DashboardCard title="Claim Status Timeline">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-56 mt-2" />
            <Skeleton className="h-4 w-48 mt-2" />
          </DashboardCard>
        </div>
        <div className="lg:col-span-4 space-y-4">
          <DashboardCard title="Quick History">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full mt-2" />
            <Skeleton className="h-10 w-full mt-2" />
          </DashboardCard>
          <DashboardCard title="Security Status">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full mt-2" />
          </DashboardCard>
        </div>
      </div>
    );
  if (noInitialData)
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-3">
          ברוך הבא לדשבורד ההחזר שלך
        </h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          כדי לראות ניתוח, סימולציות והמלצות מותאמות, ראשית מלא את פרטי
          ההכנסה או העלה טופס 106 במסך Incomes.
        </p>
        <button
          onClick={() => navigate("/incomes")}
          className="btn-primary px-6"
        >
          התחל חישוב חדש
        </button>
      </div>
    );

  if (error)
    return <div className="error-text text-center text-lg">{error}</div>;
  if (!result)
    return (
      <div className="text-center text-muted-foreground p-8">
        <p className="text-lg mb-4">אין נתונים להצגה</p>
        <button onClick={() => navigate("/")} className="btn-primary">
          חזרה לעמוד הבית
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
      title: "התחלנו לנתח",
      date: String(currentTaxData.taxYear || ""),
      description: "המערכת ניתחה את הנתונים שסיפקת",
      status: "done" as const,
    },
    {
      title: "חישוב החזר",
      date: loading ? "כעת" : "",
      description: "חישוב החזר מס ונקודות זיכוי",
      status: loading ? ("active" as const) : ("done" as const),
    },
    {
      title: "מוכן להגשה",
      date: hasCompletedDelivery
        ? pdfDownloadedAt || emailSentAt || ""
        : "",
      description: hasCompletedDelivery
        ? "הדוח נשלח/הורד בהצלחה"
        : "הדוח מוכן להורדה/שליחה",
      status: hasCompletedDelivery ? ("done" as const) : ("pending" as const),
    },
  ];

  const quickHistoryItems = [
    {
      title: "חישוב בוצע",
      date: "היום",
      statusLabel: "אושר",
      statusVariant: "success" as const,
      icon: "check" as const,
    },
    {
      title: currentTaxData.hasFormData
        ? "טופס 106 עובד"
        : "נתונים הוזנו ידנית",
      date: "היום",
      statusLabel: "הושלם",
      statusVariant: "info" as const,
      icon: currentTaxData.hasFormData ? ("upload" as const) : ("file" as const),
    },
  ];

  const heroAmountAbs = Math.abs(refundNum);
  const heroIsRefund = refundNum >= 0;
  const heroTitle = "סטטוס החזר המס שלך";
  const heroStatus = hasCompletedDelivery
    ? "הבקשה מוכנה להגשה"
    : "הבקשה נמצאת בבדיקה";
  const heroPrimaryCtaLabel = hasCompletedDelivery
    ? "הגש בקשה להחזר"
    : "המשך תהליך";

  const fmtIls = (n: number) => `${Math.round(n).toLocaleString("he-IL")} ₪`;

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
    <div
      dir="ltr"
      className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4"
    >
      {/* Secondary info (left side) */}
      <div className="lg:col-span-4 lg:col-start-1 lg:row-start-1 lg:row-span-4 lg:w-60 lg:justify-self-start">
        <div className="lg:sticky lg:top-[76px] lg:h-[calc(100vh-76px-16px)]">
          <DashboardCard
            title="מידע משני"
            subtitle="היסטוריה ואבטחה"
            className="rounded-3xl overflow-hidden shadow-sm bg-card/80 backdrop-blur h-full"
          >
            <div className="flex flex-col h-full">
              <div className="flex-1 min-h-0 overflow-auto pr-1">
                <details open>
                  <summary className="cursor-pointer text-sm text-muted-foreground">
                    היסטוריית בקשות
                  </summary>
                  <div className="mt-3">
                    <ActivityList items={quickHistoryItems} />
                  </div>
                </details>

                <details className="mt-4" open>
                  <summary className="cursor-pointer text-sm text-muted-foreground">
                    אבטחת מידע
                  </summary>
                  <div className="mt-3 space-y-3">
                    <div className="rounded-xl border border-border bg-muted/10 p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                        <ShieldCheck className="h-5 w-5 text-emerald-700" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground">
                          הצפנה
                        </div>
                        <div className="text-xs text-muted-foreground">
                          TLS בתעבורה (פעיל)
                        </div>
                      </div>
                      <StatusBadge variant="success">מאובטח</StatusBadge>
                    </div>

                    <div className="rounded-xl border border-border bg-muted/10 p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center">
                        <Lock className="h-5 w-5 text-sky-700" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground">
                          הגנת התחברות
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Supabase Auth
                        </div>
                      </div>
                      <StatusBadge variant="info">פעיל</StatusBadge>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </DashboardCard>
        </div>
      </div>

      {/* Hero */}
      <div className="lg:col-span-8 lg:col-start-5">
        <DashboardCard
          title={heroTitle}
          subtitle={heroStatus}
          rightSlot={
            <StatusBadge variant={heroIsRefund ? "success" : "danger"}>
              {heroIsRefund ? "החזר" : "חוב"}
            </StatusBadge>
          }
        >
          <div dir="rtl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                {fmtIls(heroAmountAbs)} {heroIsRefund ? "החזר מס" : "חוב למס הכנסה"}
              </div>
              <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
                מבוסס על הנתונים שהוזנו. ניתן להוריד דוח PDF או לשלוח למייל ולהמשיך את התהליך.
              </div>
            </div>
          </div>
          </div>
        </DashboardCard>
      </div>

      {/* Progress */}
      <div className="lg:col-span-8 lg:col-start-5">
        <DashboardCard title="התקדמות בתהליך" subtitle="3 שלבים">
          <div dir="rtl">
            <Timeline items={timelineItems} />
          </div>
        </DashboardCard>
      </div>

      {/* Main content (right side in RTL) */}
      <div className="lg:col-span-8 lg:col-start-5 space-y-4">
        <div dir="rtl" className="space-y-4">
        <DashboardCard
          title="מידע מרכזי"
          subtitle={`שנת מס ${currentTaxData.taxYear}`}
          rightSlot={
            <StatusBadge variant={heroIsRefund ? "success" : "danger"}>
              {heroIsRefund ? "החזר צפוי" : "חוב צפוי"}
            </StatusBadge>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="text-xs text-muted-foreground">הערכת החזר / חוב</div>
              <div className="mt-2 text-2xl font-bold text-foreground">
                {fmtIls(heroAmountAbs)}
              </div>
              <div className="mt-2">
                <StatusBadge variant={heroIsRefund ? "success" : "danger"}>
                  {heroIsRefund ? "החזר" : "חוב"}
                </StatusBadge>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="text-xs text-muted-foreground">כמה הכנסות דווחו</div>
              <div className="mt-2 text-2xl font-bold text-foreground">
                {fmtIls(incomeNum)}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">שנתי</div>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="text-xs text-muted-foreground">כמה מס שילמת השנה</div>
              <div className="mt-2 text-2xl font-bold text-foreground">
                {fmtIls(taxPaidNum)}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">ניכויים</div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-muted/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">
                  אמינות הנתונים
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {documentSource ? `מקור הנתונים: ${documentSource}` : " "}
                </div>
              </div>
              {riskLevel && (
                <StatusBadge variant={riskVariant as any}>
                  {riskLevel === "low"
                    ? "סיכון נמוך"
                    : riskLevel === "medium"
                    ? "סיכון בינוני"
                    : "סיכון גבוה"}
                </StatusBadge>
              )}
            </div>
            <div className="mt-3 h-2 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-500 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {progressPct}% ביטחון
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="מה זה אומר בפועל?" subtitle="הסבר קצר והמלצות">
          {whyRefund && typeof whyRefund === "string" ? (
            <div className="text-base text-foreground leading-relaxed">
              {whyRefund}
            </div>
          ) : (
            <div className="text-base text-muted-foreground leading-relaxed">
              {explanationStr.split("\n")[0]}
            </div>
          )}

          {Array.isArray(recommendations) && recommendations.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-semibold text-foreground mb-2">
                המלצות להמשך
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {(recommendations as string[]).slice(0, 5).map((rec, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DashboardCard>

        <DashboardCard title="איך חישבנו את החזר המס שלך" subtitle="פירוט חישוב ברור">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              ["הכנסה שנתית", fmtIls(incomeNum)],
              ["מס ששולם", fmtIls(taxPaidNum)],
              ["נקודות זיכוי", String(creditPointsNum || 0)],
              ["ערך נקודת זיכוי", fmtIls(creditValueNum || 0)],
              ["מס ברוטו", fmtIls(grossTaxNum || 0)],
              ["מס נטו", fmtIls(netTaxNum || 0)],
              ["החזר / חוב", fmtIls(refundNum)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-muted/10 px-4 py-3 flex items-center justify-between gap-4"
              >
                <div className="text-sm text-muted-foreground">{label}</div>
                <div className="text-sm font-semibold text-foreground tabular-nums">
                  {value}
                </div>
              </div>
            ))}
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted-foreground">
              הצג פירוט מלא
            </summary>
            <div className="mt-3 rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground whitespace-pre-line leading-relaxed font-mono">
              {explanationStr}
            </div>
          </details>
        </DashboardCard>
        </div>
      </div>

      <div className="lg:col-span-8 lg:col-start-5">
        <DashboardCard title="פעולות" subtitle="השלב הבא שלך">
          <div dir="rtl">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
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
                className="btn-secondary w-full sm:w-auto"
              >
                חזרה
              </button>
              <button
                type="button"
                onClick={() => {
                  resetCalculator();
                  navigate("/");
                }}
                className="btn-secondary w-full sm:w-auto"
              >
                חישוב חדש
              </button>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                type="button"
                className="btn-secondary w-full sm:w-auto"
                onClick={() => {
                  resetCalculator();
                  navigate("/");
                }}
              >
                העלה טופס חדש
              </button>
              <button
                type="button"
                className="btn-secondary w-full sm:w-auto disabled:opacity-50"
                disabled={downloading}
                onClick={handleDownloadPdf}
              >
                {downloading ? "מוריד..." : "שמור PDF"}
              </button>
              <button
                type="button"
                className="btn-primary w-full sm:w-auto"
                onClick={() => setIsEmailModalOpen(true)}
              >
                שלח במייל
              </button>
            </div>
          </div>
          </div>
        </DashboardCard>
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
    </div>
  );
};
