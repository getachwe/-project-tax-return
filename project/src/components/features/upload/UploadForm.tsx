import React, { useEffect, useRef, useState } from "react";
import { Upload, Pencil, ArrowRight } from "lucide-react";
import {
  useTaxCalculator,
  defaultTaxData,
} from "../../../context/TaxCalculatorContext";
import { isGuestExploreSession } from "../../../utils/guestMode";
import { UploadDropzone } from "./UploadDropzone";
import { UploadTips } from "./UploadTips";
import { UploadProgress } from "./UploadProgress";
import Toast from "../../Toast";
import { apiProcess106 } from "../../../utils/api";
import { coerceBool } from "../../../utils/mergeMissingUploadFieldValues";
import { defaultFilingStatusFromMarital } from "../../../utils/intakeFilingDefaults";

export const UploadForm: React.FC = () => {
  const { goToNextStep, setTaxData, setPendingMissingUpload, taxData } =
    useTaxCalculator();

  const intakeSnapshot = {
    intakeCompleted: taxData.intakeCompleted,
    hasChildren: taxData.hasChildren,
    incomeType: taxData.incomeType,
    maritalStatus: taxData.maritalStatus,
  };
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  /** מניעת goToNextStep כפול: טיימר אוטומטי אחרי הצלחה + לחיצה על "המשך" היו קופצים 1→2 ואז 2→3 */
  const autoAdvanceAfterUploadRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const clearAutoAdvanceAfterUpload = () => {
    if (autoAdvanceAfterUploadRef.current != null) {
      clearTimeout(autoAdvanceAfterUploadRef.current);
      autoAdvanceAfterUploadRef.current = null;
    }
  };

  useEffect(() => () => clearAutoAdvanceAfterUpload(), []);

  const handleFileUpload = async (file: File) => {
    clearAutoAdvanceAfterUpload();
    setError(null);
    setIsLoading(true);
    setSelectedFile(file);

    try {
      const result = await apiProcess106(file);
      if (!result.success) throw new Error(result.error || "שגיאה לא ידועה");
      if (!result.data) throw new Error("לא התקבלו נתונים מהשרת");

      const data = result.data as Record<string, string | number | undefined>;

      if (result.missingFields && result.missingFields.length > 0) {
        const draft = {
          ...defaultTaxData,
          ...intakeSnapshot,
          intakeCompleted: true,
          filingStatus: defaultFilingStatusFromMarital(
            intakeSnapshot.maritalStatus,
          ),
          dataSource: "upload" as const,
          hasFormData: true,
        };
        setTaxData(draft);
        setPendingMissingUpload({
          extractedData: data,
          missingValues: {},
        });
        try {
          if (!isGuestExploreSession()) {
            localStorage.setItem("tax_return_draft", JSON.stringify(draft));
            localStorage.setItem("tax_return_step", "2");
          }
        } catch {
          /* ignore */
        }
        goToNextStep();
      } else {
        // All data extracted successfully
        // Preserve taxYear from extraction when valid; otherwise default to last year
        const extractedYear = Number(data.taxYear);
        const boundedExtractedYear = !Number.isNaN(extractedYear)
          ? Math.max(
              Math.min(extractedYear, new Date().getFullYear() - 1),
              new Date().getFullYear() - 6,
            )
          : new Date().getFullYear() - 1;

        const maritalResolved = String(
          data.maritalStatus || intakeSnapshot.maritalStatus || "single",
        );
        const filingFromDoc =
          data.filingStatus === "joint" || data.filingStatus === "single"
            ? data.filingStatus
            : undefined;
        const {
          maritalStatus: _mFrom106,
          filingStatus: _fFrom106,
          ...dataRest
        } = data as Record<string, string | number | undefined>;
        const merged = {
          ...defaultTaxData,
          ...intakeSnapshot,
          intakeCompleted: true,
          income: Number(data.income) || 0,
          taxPaid: Number(data.taxPaid) || 0,
          taxCredits: Number(data.creditPoints) || 2.25,
          taxYear: boundedExtractedYear,
          gender: data.gender,
          employmentType: data.employmentType,
          children:
            intakeSnapshot.hasChildren === false
              ? 0
              : Number(data.children) || 0,
          birthDate: data.birthDate,
          workStartDate: data.workStartDate,
          workEndDate: data.workEndDate,
          additionalIncome: Number(data.additionalIncome) || 0,
          oldAgeAllowance: Number(data.oldAgeAllowance) || 0,
          childAllowance:
            intakeSnapshot.hasChildren === false
              ? 0
              : Number(data.childAllowance) || 0,
          disabilityAllowance: Number(data.disabilityAllowance) || 0,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.city,
          postalCode: data.postalCode,
          ...dataRest,
          maritalStatus: maritalResolved,
          filingStatus:
            filingFromDoc ?? defaultFilingStatusFromMarital(maritalResolved),
          dataSource: "upload" as const,
          hasFormData: true,
          academicDegree: coerceBool(data.academicDegree),
          newImmigrant: coerceBool(data.newImmigrant),
          livingInPeriphery: coerceBool(data.livingInPeriphery),
          yearsSinceAliyah: Number(data.yearsSinceAliyah) || 0,
        };
        setTaxData(merged);
        try {
          if (!isGuestExploreSession()) {
            localStorage.setItem("tax_return_draft", JSON.stringify(merged));
            localStorage.setItem("tax_return_step", "2");
          }
        } catch {
          /* ignore */
        }
        setToast({
          type: "success",
          message: "הקובץ עובד בהצלחה! מעבר לשלב הבא בעוד רגע…",
        });
        autoAdvanceAfterUploadRef.current = setTimeout(() => {
          autoAdvanceAfterUploadRef.current = null;
          goToNextStep();
        }, 1500);
      }
    } catch (err) {
      setError((err as Error).message);
      setToast({ type: "error", message: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualEntry = () => {
    clearAutoAdvanceAfterUpload();
    setPendingMissingUpload(null);
    setTaxData({
      ...defaultTaxData,
      ...intakeSnapshot,
      intakeCompleted: true,
      filingStatus: defaultFilingStatusFromMarital(taxData.maritalStatus),
      hasChildren: taxData.hasChildren,
      children: taxData.hasChildren === false ? 0 : taxData.children ?? 0,
      childAllowance:
        taxData.hasChildren === false ? 0 : taxData.childAllowance ?? 0,
    });
    goToNextStep();
  };

  const handleContinueAfterUpload = () => {
    clearAutoAdvanceAfterUpload();
    goToNextStep();
  };

  return (
    <>
      <div className="w-full px-0 sm:px-2 py-4 sm:py-6" dir="rtl">
        {/* Hero steps */}
        <section className="mb-10 mt-4">
          <h2 className="text-[1.75rem] font-extrabold text-[#006D4E] mb-6 text-center">
            העלאת טופס 106
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-card text-card-foreground p-5 rounded-2xl border border-border/40">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-500 flex items-center justify-center text-white font-bold mb-4">
                1
              </div>
              <h3 className="text-lg font-bold mb-2">הורדת הטופס</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                היכנס לאתר המעסיק או פנה למחלקת השכר לקבלת טופס 106 עבור שנת המס הרלוונטית.
              </p>
            </div>
            <div className="bg-card text-card-foreground p-5 rounded-2xl border border-border/40">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-500 flex items-center justify-center text-white font-bold mb-4">
                2
              </div>
              <h3 className="text-lg font-bold mb-2">סריקה או צילום</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                ודא כי המסמך ברור, כל הפרטים קריאים וכל דפי הטופס צולמו במלואם.
              </p>
            </div>
            <div className="bg-card text-card-foreground p-5 rounded-2xl border border-border/40">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-500 flex items-center justify-center text-white font-bold mb-4">
                3
              </div>
              <h3 className="text-lg font-bold mb-2">העלאה למערכת</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                גרור את הקובץ לאזור ההעלאה או בחר אותו מהמחשב או מהטלפון שלך.
              </p>
            </div>
          </div>
        </section>

        {taxData.incomeType && taxData.incomeType !== "employee" ? (
          <aside className="mb-6 max-w-3xl mx-auto rounded-xl border border-amber-200/70 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-100 leading-snug text-right">
            ציינת שסוג ההכנסה אינו שכירות בלבד — שלב ההעלאה זהה, והחישוב במערכת נשאר הערכה
            לשכיר עד להרחבות טופס.
          </aside>
        ) : null}

        {/* Main upload layout */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 lg:gap-8 items-start">
          {/* Tips + security column (left in design) */}
          <div className="lg:col-span-3 flex flex-col gap-4 lg:gap-6">
            <div className="bg-card text-card-foreground rounded-2xl border border-border/40 overflow-hidden">
              <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Upload className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="font-bold text-sm sm:text-base">טיפים להעלאה</h4>
                </div>
              </div>
              <div className="px-5 py-4">
                <UploadTips />
              </div>
            </div>

            <div className="bg-card text-card-foreground rounded-2xl border border-border/40 p-5 flex items-start gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">אבטחה מקסימלית</p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-1">
                  המסמכים שלך מוצפנים ונשמרים בסטנדרטים מחמירים. אנו לא משתפים את הנתונים שלך
                  עם גורמים חיצוניים ללא רשות.
                </p>
              </div>
            </div>
          </div>

          {/* Dropzone / upload column */}
          <div className="lg:col-span-7">
            <div className="bg-card text-card-foreground rounded-2xl border border-border/40 p-6 sm:p-8 lg:p-10 flex flex-col justify-center min-h-[320px]">
              <div className="max-w-2xl mx-auto w-full space-y-6 text-center">
                <UploadDropzone
                  onFileUpload={handleFileUpload}
                  isLoading={isLoading}
                  selectedFile={selectedFile}
                  onManualEntry={handleManualEntry}
                />

                {selectedFile && !isLoading ? (
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      type="button"
                      onClick={handleManualEntry}
                      className="h-11 sm:h-12 px-6 btn-secondary rounded-xl flex items-center justify-center gap-2"
                    >
                      <Pencil className="h-5 w-5" />
                      הזנה ידנית
                    </button>
                    <button
                      type="button"
                      onClick={handleContinueAfterUpload}
                      className="h-11 sm:h-12 px-8 btn-primary rounded-xl flex items-center justify-center gap-2"
                    >
                      <ArrowRight className="h-5 w-5" />
                      המשך לבדיקה
                    </button>
                  </div>
                ) : null}

                {error && (
                  <p className="text-sm text-red-600 text-center mt-2">{error}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Modal */}
      <UploadProgress isLoading={isLoading} error={error} success={false} />

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};
