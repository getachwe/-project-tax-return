import React, { useState, useEffect } from "react";
import { useTaxCalculator } from "../context/TaxCalculatorContext";

export const ResultsDisplay: React.FC = () => {
  const { taxData } = useTaxCalculator();
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("http://localhost:4000/api/calculate-tax", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taxData),
    })
      .then((res) => res.json())
      .then((data) => {
        setResult(data);
        setLoading(false);
        console.log("Backend result:", data);
      })
      .catch(() => {
        setError("שגיאה בחישוב המס");
        setLoading(false);
      });
  }, [taxData]);

  if (loading) return <div>טוען חישוב...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
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
    <div className="space-y-6">
      <div className="mb-4 p-3 bg-blue-50 rounded-md">
        <div className="font-bold mb-2">הנתונים שחולצו מהטופס:</div>
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
        className={`p-6 rounded-lg text-center ${
          refundNum > 0
            ? "bg-success-50 border border-success-100"
            : "bg-gray-50 border border-gray-200"
        }`}
      >
        <h3 className="text-2xl font-bold mb-2">
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
      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <h4 className="font-medium text-blue-800 mb-1">הסבר:</h4>
        <p className="text-sm text-blue-700">{explanationStr}</p>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="btn-secondary inline-flex items-center"
          >
            חזרה
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-secondary"
          >
            חישוב חדש
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-secondary inline-flex items-center"
            onClick={async () => {
              const response = await fetch(
                "http://localhost:4000/api/generate-tax-return-pdf",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(taxData),
                }
              );
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "tax-return.pdf";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
            }}
          >
            שמור PDF
          </button>
          <button
            type="button"
            className="btn-primary inline-flex items-center"
            onClick={() => {
              const subject = encodeURIComponent("החזר מס שנתי");
              const body = encodeURIComponent(
                "מצורף דוח החזר מס שנתי. נא לעיין במסמך."
              );
              window.location.href = `mailto:?subject=${subject}&body=${body}`;
            }}
          >
            שלח במייל
          </button>
        </div>
      </div>
    </div>
  );
};
