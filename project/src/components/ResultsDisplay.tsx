import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTaxCalculator } from "../context/TaxCalculatorContext";
import { Dialog } from "@headlessui/react";
import { apiCreateReport } from "../utils/api";

export const ResultsDisplay: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { taxData, goToPreviousStep } = useTaxCalculator();
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
    // Check if we have pre-calculated results from history
    const fromHistory = location.state?.fromHistory;
    if (fromHistory && location.state?.result) {
      setResult(location.state.result as Record<string, unknown>);
      setLoading(false);
      return;
    }

    // Check if we have data from calculator
    const fromCalculator = location.state?.fromCalculator;
    const calculatorTaxData = location.state?.taxData;

    // Use data from location.state if available, otherwise use context
    const currentTaxData = calculatorTaxData || taxData;

    console.log("ResultsDisplay - fromCalculator:", fromCalculator);
    console.log("ResultsDisplay - calculatorTaxData:", calculatorTaxData);
    console.log("ResultsDisplay - taxData:", taxData);
    console.log("ResultsDisplay - currentTaxData:", currentTaxData);

    // Validate data before calculation
    if (
      !currentTaxData ||
      !currentTaxData.income ||
      !currentTaxData.taxPaid ||
      !currentTaxData.taxYear
    ) {
      console.log("Missing required data:", {
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
  if (!result) return null;

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
    <div className="space-y-6 animate-fade-in">
      <div className="mb-4 p-4 bg-blue-50 rounded-xl shadow-sm">
        <div className="font-bold mb-2 text-blue-900">
          {currentTaxData.hasFormData
            ? "הנתונים שחולצו מהטופס 106:"
            : "הנתונים שהוזנו ידנית:"}
        </div>
        <ul className="text-blue-900 text-sm space-y-1">
          <li>הכנסה שנתית: {incomeNum.toLocaleString()} ₪</li>
          <li>מס ששולם: {taxPaidNum.toLocaleString()} ₪</li>
          <li>נקודות זיכוי: {creditPointsNum.toFixed(2)}</li>
          <li>ערך נקודות זיכוי: {creditValueNum.toLocaleString()} ₪</li>
          <li>מס גולמי: {grossTaxNum.toLocaleString()} ₪</li>
          <li>מס נטו: {netTaxNum.toLocaleString()} ₪</li>
          <li>החזר מס: {refundNum.toLocaleString()} ₪</li>
        </ul>
      </div>
      <div
        className={`p-6 rounded-xl text-center shadow-md border transition-all duration-300 ${
          refundNum > 0
            ? "bg-green-50 border-green-200"
            : "bg-gray-50 border-gray-200"
        }`}
      >
        <h3 className="text-3xl font-extrabold mb-2 text-blue-700">
          {refundNum > 0
            ? `מגיע לך החזר מס של ${refundNum.toLocaleString()} ₪`
            : "לא נמצאה זכאות להחזר מס"}
        </h3>
        <p className="text-gray-600">
          {refundNum > 0
            ? "ניתן להגיש בקשה להחזר עבור עד 6 שנים אחורה!"
            : "לא שילמת מס עודף על פי הנתונים שהוזנו"}
        </p>
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
  );
};
