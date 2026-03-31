import React, { useState } from "react";
import { UserCircle2 } from "lucide-react";
import { useTaxCalculator, type TaxData } from "../context/TaxCalculatorContext";
import { MARITAL_OPTIONS } from "../constants/fields";
import {
  INCOME_TYPE_OPTIONS,
  type IncomeType,
} from "../constants/incomeType";
import { defaultFilingStatusFromMarital } from "../utils/intakeFilingDefaults";

/**
 * STEP 0 — לפני טופס 106 / הזנה ידנית: פרופיל מינימלי (מסמך AGENT_TAX_SIMULATOR_ROLLOUT).
 */
export const IntakeProfileForm: React.FC = () => {
  const { taxData, setTaxData } = useTaxCalculator();
  const [maritalStatus, setMaritalStatus] = useState(
    () => taxData.maritalStatus || "single",
  );
  const [hasChildren, setHasChildren] = useState<boolean>(() => {
    if (typeof taxData.hasChildren === "boolean") return taxData.hasChildren;
    const n = Number(taxData.children);
    return Number.isFinite(n) && n > 0;
  });
  const [incomeType, setIncomeType] = useState<IncomeType>(() => {
    const t = taxData.incomeType as IncomeType | undefined;
    if (t === "employee" || t === "self_employed" || t === "mixed") return t;
    return "employee";
  });

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    const filingStatus = defaultFilingStatusFromMarital(maritalStatus);
    const next: TaxData = {
      ...taxData,
      maritalStatus,
      filingStatus,
      hasChildren,
      incomeType,
      intakeCompleted: true,
      children: hasChildren ? Number(taxData.children) || 0 : 0,
      childAllowance: hasChildren ? Number(taxData.childAllowance) || 0 : 0,
      ...(filingStatus === "single"
        ? { spouseIncome: 0, spouseTaxPaid: 0 }
        : {}),
    };
    setTaxData(next);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8" dir="rtl">
      <div className="bg-card text-card-foreground rounded-2xl border border-border/40 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <UserCircle2 className="h-6 w-6 text-primary" />
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-[#006D4E]">
              לפני שנתחיל
            </h2>
            <p className="text-sm text-muted-foreground mt-1 leading-snug">
              כדי להציג רק את מה שרלוונטי אליך — נא מלא/י את הפרטים הבאים.
            </p>
          </div>
        </div>

        <form onSubmit={handleContinue} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              מצב משפחתי בשנת המס
            </label>
            <select
              value={maritalStatus}
              onChange={(e) => setMaritalStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              {MARITAL_OPTIONS.filter((o) => o.value !== "").map((o) => (
                <option key={o.value || "empty"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-foreground mb-2">
              ילדים עד גיל 18 (לזיכויים)
            </legend>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="hasChildren"
                  checked={!hasChildren}
                  onChange={() => setHasChildren(false)}
                  className="h-4 w-4 text-primary"
                />
                <span>אין לי ילדים רלוונטיים</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="hasChildren"
                  checked={hasChildren}
                  onChange={() => setHasChildren(true)}
                  className="h-4 w-4 text-primary"
                />
                <span>יש לי</span>
              </label>
            </div>
          </fieldset>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              סוג הכנסה עיקרי
            </label>
            <select
              value={incomeType}
              onChange={(e) =>
                setIncomeType(e.target.value as IncomeType)
              }
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              {INCOME_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {incomeType !== "employee" && (
              <p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 rounded-lg px-3 py-2 leading-snug">
                החישוב במערכת מותאם בעיקר לשכירים. לעצמאים ולהכנסות מורכבות
                התוצאה היא הערכה בלבד; בהמשך נרחיב את הטפסים.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full h-12 btn-primary rounded-xl font-semibold text-base"
          >
            המשך להעלאת טופס / מילוי
          </button>
        </form>
      </div>
    </div>
  );
};
