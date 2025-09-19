import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTaxCalculator } from "../context/TaxCalculatorContext";
import { Dialog } from "@headlessui/react";
import { CheckCircle, Sparkles, Calculator } from "lucide-react";

export const ResultsDisplay: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { taxData, goToPreviousStep } = useTaxCalculator();

  console.log("ResultsDisplay mounted - location.state:", location.state);
  console.log("ResultsDisplay mounted - taxData:", taxData);

  // Get current tax data from location.state or context
  const currentTaxData = React.useMemo(() => {
    return location.state?.taxData || taxData;
  }, [location.state?.taxData, taxData]);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<
    null | "success" | "error" | "loading"
  >(null);
  const [emailError, setEmailError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  // Track background auto-save in a ref (no re-render needed)
  const saveStatusRef = useRef<null | "idle" | "saving" | "saved" | "error">(
    null
  );

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

    if (
      !currentTaxData ||
      !currentTaxData.income ||
      !currentTaxData.taxPaid ||
      !currentTaxData.taxYear
    ) {
      console.log("❌ Missing required data:", {
        income: currentTaxData?.income,
        taxPaid: currentTaxData?.taxPaid,
        taxYear: currentTaxData?.taxYear,
      });
      setError(
        "חסרים נתונים חיוניים לחישוב המס. אנא חזור לשלב הקודם ומלא את השדות הנדרשים."
      );
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
    fetch("http://localhost:4000/api/calculate-tax", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentTaxData),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "שגיאה בחישוב המס");
        }
        return data;
      })
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
            const response = await fetch(
              "http://localhost:4000/api/generate-pdf",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  ...currentTaxData,
                  ...data, // Include calculation results
                  saveToStorage: true,
                }),
              }
            );

            if (response.ok) {
              console.log("Report saved successfully!");
              const reportId = response.headers.get("X-Report-ID");
              if (reportId) {
                console.log("Report ID:", reportId);
              }
              saveStatusRef.current = "saved";
            } else {
              console.error("Failed to save report:", response.status);
              const errorText = await response.text();
              console.error("Error details:", errorText);
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
  }, [taxData, location.state, currentTaxData]);

  if (loading)
    return (
      <div className="text-blue-700 text-lg font-bold animate-pulse">
        טוען חישוב...
      </div>
    );
  if (error)
    return <div className="error-text text-center text-lg">{error}</div>;
  if (!result)
    return (
      <div className="text-center text-gray-600 p-8">
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
  } = result;

  const refundNum = Number(refund);
  const creditPointsNum = Number(creditPoints);
  const creditValueNum = Number(creditValue);
  const grossTaxNum = Number(grossTax);
  const netTaxNum = Number(netTax);
  const taxPaidNum = Number(taxPaid);
  const incomeNum = Number(income);
  const explanationStr = String(explanation);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-8 py-4 shadow-lg border border-white/20 mb-6">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              תוצאות חישוב החזר המס
            </h1>
            <Sparkles className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            הדוח מוכן! הנה התוצאות שלך לחישוב החזר המס לשנת {currentTaxData.taxYear}
          </p>
        </div>

        {/* Main Results Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-8">
          {/* Data Source Info */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Calculator className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">
                  {currentTaxData.hasFormData
                    ? "הנתונים שחולצו מהטופס 106"
                    : "הנתונים שהוזנו ידנית"}
                </h3>
                <p className="text-gray-600 text-sm">מקור הנתונים לחישוב</p>
              </div>
            </div>
          </div>

          {/* Data Grid */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
                <div className="text-blue-600 text-sm font-medium mb-2">הכנסה שנתית</div>
                <div className="text-2xl font-bold text-blue-800">{incomeNum.toLocaleString()} ₪</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border border-orange-200">
                <div className="text-orange-600 text-sm font-medium mb-2">מס ששולם</div>
                <div className="text-2xl font-bold text-orange-800">{taxPaidNum.toLocaleString()} ₪</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200">
                <div className="text-purple-600 text-sm font-medium mb-2">נקודות זיכוי</div>
                <div className="text-2xl font-bold text-purple-800">{creditPointsNum.toFixed(2)}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
                <div className="text-green-600 text-sm font-medium mb-2">ערך נקודות זיכוי</div>
                <div className="text-2xl font-bold text-green-800">{creditValueNum.toLocaleString()} ₪</div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200">
                <div className="text-red-600 text-sm font-medium mb-2">מס גולמי</div>
                <div className="text-2xl font-bold text-red-800">{grossTaxNum.toLocaleString()} ₪</div>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200">
                <div className="text-gray-600 text-sm font-medium mb-2">מס נטו</div>
                <div className="text-2xl font-bold text-gray-800">{netTaxNum.toLocaleString()} ₪</div>
              </div>
            </div>
          </div>
        </div>
      <div
        className={`p-6 rounded-xl text-center shadow-md border transition-all duration-300 ${
          refundNum > 0
            ? "bg-green-50 border-green-200"
            : "bg-gray-50 border-gray-200"
        }`}
      >
        {/* Main Result */}
        <div className={`relative overflow-hidden rounded-3xl shadow-2xl border transition-all duration-500 ${
          refundNum > 0
            ? "bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 border-green-200"
            : "bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 border-gray-200"
        }`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12"></div>
          </div>
          
          <div className="relative p-12 text-center">
            {/* Icon */}
            <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
              refundNum > 0 
                ? "bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg" 
                : "bg-gradient-to-br from-gray-400 to-slate-500 shadow-lg"
            }`}>
              <CheckCircle className={`w-10 h-10 ${
                refundNum > 0 ? "text-white" : "text-white"
              }`} />
            </div>

            {/* Title */}
            <h3 className={`text-3xl font-bold mb-4 ${
              refundNum > 0 ? "text-green-800" : "text-gray-700"
            }`}>
              {refundNum > 0 ? "🎉 מגיע לך החזר מס!" : "לא נמצאה זכאות להחזר מס"}
            </h3>

            {/* Amount */}
            {refundNum > 0 && (
              <div className="text-6xl font-black text-green-600 mb-6 drop-shadow-lg">
                {refundNum.toLocaleString()} ₪
              </div>
            )}

            {/* Description */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <p className={`text-lg font-medium ${
                refundNum > 0 ? "text-green-700" : "text-gray-600"
              }`}>
                {refundNum > 0
                  ? "ניתן להגיש בקשה להחזר עבור עד 6 שנים אחורה!"
                  : "לא שילמת מס עודף על פי הנתונים שהוזנו"}
              </p>
              {refundNum > 0 && (
                <p className="text-sm text-green-600 mt-2">
                  הדוח מוכן לשליחה לרשות המיסים
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 p-4 bg-blue-50 rounded-xl shadow-sm">
        <h4 className="font-medium text-blue-800 mb-1">הסבר:</h4>
        <p className="text-sm text-blue-700">{explanationStr}</p>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              const fromHistory = location.state?.fromHistory;
              if (fromHistory) {
                navigate("/history");
              } else {
                goToPreviousStep();
              }
            }}
            className="btn-secondary w-full sm:w-auto"
          >
            חזרה
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-secondary w-full sm:w-auto"
          >
            חישוב חדש
          </button>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            type="button"
            className="btn-secondary w-full sm:w-auto flex items-center gap-2 disabled:opacity-50"
            disabled={downloading}
            onClick={async () => {
              setDownloading(true);
              try {
                const token = localStorage.getItem("authToken");
                const response = await fetch(
                  "http://localhost:4000/api/generate-pdf",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                      ...currentTaxData,
                      ...result, // Include calculation results
                      saveToStorage: false, // Don't save again, just download
                    }),
                  }
                );
                if (!response.ok) {
                  setError("שגיאה ביצירת ה-PDF בשרת");
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
              } finally {
                setDownloading(false);
              }
            }}
          >
            {downloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                מוריד...
              </>
            ) : (
              "שמור PDF"
            )}
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
                    "http://localhost:4000/api/send-tax-return-email",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                      },
                      body: JSON.stringify({
                        taxData: { ...currentTaxData, ...result },
                        email,
                        calculationResult: result,
                      }),
                    }
                  );
                  const data = await res.json();
                  if (data.success) {
                    setEmailStatus("success");
                    setIsEmailModalOpen(false);
                    setShowSuccessModal(true);
                    setTimeout(() => {
                      setShowSuccessModal(false);
                    }, 2000);
                  } else {
                    setEmailStatus("error");
                    setEmailError(data.error || "שליחה נכשלה");
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
    </div>
  );
};
