import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  isGuestExploreSession,
} from "../utils/guestMode";

import type { IncomeType } from "../constants/incomeType";

// Define the tax data structure
/** מקור הנתונים: העלאת 106 מול מילוי ידני (מניעת בלבול עם hasFormData ישן מטיוטה) */
export type TaxDataSource = "manual" | "upload";

export type TaxData = {
  income: number;
  taxPaid: number;
  taxCredits: number;
  hasFormData?: boolean;
  /** מקור אמת להצגה; אם חסר — נגזר מ-hasFormData בטיוטות ישנות */
  dataSource?: TaxDataSource;
  children?: number;
  academicDegree?: boolean;
  newImmigrant?: boolean;
  livingInPeriphery?: boolean;
  maritalStatus?: string;
  /** יחיד או גילוי משותף — משפיע על צבירת הכנסות וניכויים */
  filingStatus?: "single" | "joint";
  spouseIncome?: number;
  spouseTaxPaid?: number;
  /** STEP F: תוספת נקודות ידנית (מקסימום 5 במנוע) */
  additionalCreditPoints?: number;
  /** STEP 0 Intake: האם סיימו שאלון פרופיל לפני טופס */
  intakeCompleted?: boolean;
  /** STEP 0: יש ילדים רלוונטיים לזיכוי — כבוי מסתיר שדות ילדים */
  hasChildren?: boolean;
  /** STEP 0: שכיר / עצמאי / מעורב */
  incomeType?: IncomeType;
} & Record<string, unknown>;

/** טיוטות לפני STEP 0 — נחשבות כ-intake הושלם כדי לא לחסום משתמש קיים */
export function inferLegacyIntakeCompleted(
  parsed: Partial<TaxData> & Record<string, unknown>,
): boolean {
  if (parsed.intakeCompleted === true) return true;
  if (parsed.intakeCompleted === false) return false;
  const inc = Number(parsed.income);
  const tp = Number(parsed.taxPaid);
  if (Number.isFinite(inc) && inc > 0) return true;
  if (Number.isFinite(tp) && tp > 0) return true;
  if (parsed.hasFormData === true) return true;
  if (parsed.dataSource === "upload") return true;
  return false;
}

/** טיוטת השלמה אחרי העלאה כשהשרת דורש השלמת שדות — מוצגת בשלב 2 עם הסטפר */
export type PendingMissingUpload = {
  extractedData: Record<string, string | number | undefined>;
  missingValues: Record<string, string | number | boolean>;
};

// Define the context structure
interface TaxCalculatorContextType {
  currentStep: number;
  taxData: TaxData;
  setTaxData: (data: TaxData) => void;
  /** עדכון שלב ידני (למשל אחרי מעבר לתוצאות כדי שלא יישאר 3 ב-localStorage) */
  setCalculatorStep: (step: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  resetCalculator: () => void;
  pendingMissingUpload: PendingMissingUpload | null;
  setPendingMissingUpload: (state: PendingMissingUpload | null) => void;
  patchPendingMissingUploadField: (
    id: string,
    value: string | number | boolean
  ) => void;
}

// Default tax data
export const defaultTaxData: TaxData = {
  income: 0,
  taxPaid: 0,
  taxCredits: 2.25, // Default for a working person in Israel
  hasFormData: false,
  dataSource: "manual",
  maritalStatus: "single",
  filingStatus: "single",
  intakeCompleted: false,
  hasChildren: false,
  incomeType: "employee",
  additionalCreditPoints: 0,
};

/** האם הנתונים נובעים מהעלאת טופס (לא ממילוי ידני בלבד) */
export function isTaxDataFromUpload(td: Pick<TaxData, "dataSource" | "hasFormData">): boolean {
  if (td.dataSource === "upload") return true;
  if (td.dataSource === "manual") return false;
  return !!td.hasFormData;
}

// Create the context
const TaxCalculatorContext = createContext<
  TaxCalculatorContextType | undefined
>(undefined);

const PENDING_UPLOAD_SESSION_KEY = "tax_return_pending_missing_upload";

// Create provider component
export const TaxCalculatorProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [taxData, setTaxData] = useState<TaxData>(defaultTaxData);
  const [pendingMissingUpload, setPendingMissingUploadInternal] =
    useState<PendingMissingUpload | null>(null);

  const persistPendingToSession = useCallback(
    (p: PendingMissingUpload | null) => {
      try {
        if (isGuestExploreSession()) return;
        if (p) {
          sessionStorage.setItem(
            PENDING_UPLOAD_SESSION_KEY,
            JSON.stringify(p)
          );
        } else {
          sessionStorage.removeItem(PENDING_UPLOAD_SESSION_KEY);
        }
      } catch {
        /* ignore */
      }
    },
    []
  );

  const setPendingMissingUpload = useCallback(
    (state: PendingMissingUpload | null) => {
      setPendingMissingUploadInternal(state);
      persistPendingToSession(state);
    },
    [persistPendingToSession]
  );

  const patchPendingMissingUploadField = useCallback(
    (id: string, value: string | number | boolean) => {
      setPendingMissingUploadInternal((prev) => {
        if (!prev) return null;
        const next: PendingMissingUpload = {
          ...prev,
          missingValues: {
            ...prev.missingValues,
            [id]: value,
          },
        };
        persistPendingToSession(next);
        return next;
      });
    },
    [persistPendingToSession]
  );

  // Load draft from localStorage on mount (לא באורח — בלי טיוטה בדפדפן)
  useEffect(() => {
    try {
      if (isGuestExploreSession()) return;
      const raw = localStorage.getItem("tax_return_draft");
      const rawStep = localStorage.getItem("tax_return_step");

      let normalizedStep = 1;
      if (rawStep) {
        const stepNum = parseInt(rawStep, 10);
        if (!Number.isNaN(stepNum) && stepNum >= 1 && stepNum <= 3) {
          normalizedStep = stepNum >= 3 ? 2 : stepNum;
        }
      }

      let uploadLike = false;
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<TaxData>;
        if (parsed && typeof parsed === "object") {
          const dataSource: TaxDataSource =
            parsed.dataSource === "upload" || parsed.dataSource === "manual"
              ? parsed.dataSource
              : parsed.hasFormData
                ? "upload"
                : "manual";
          uploadLike =
            dataSource === "upload" ||
            parsed.dataSource === "upload" ||
            !!parsed.hasFormData;
          const mergedDraft = {
            ...defaultTaxData,
            ...parsed,
            dataSource,
            hasFormData: dataSource === "upload",
            intakeCompleted: inferLegacyIntakeCompleted({
              ...parsed,
              dataSource,
              hasFormData: dataSource === "upload",
            }),
          };
          if (
            mergedDraft.hasChildren === undefined &&
            typeof mergedDraft.children === "number" &&
            mergedDraft.children > 0
          ) {
            mergedDraft.hasChildren = true;
          }
          if (mergedDraft.hasChildren === undefined) {
            mergedDraft.hasChildren = false;
          }
          if (
            mergedDraft.incomeType === undefined ||
            mergedDraft.incomeType === null ||
            mergedDraft.incomeType === ""
          ) {
            mergedDraft.incomeType = "employee";
          }
          setTaxData(mergedDraft as TaxData);
        }
      }

      setCurrentStep(normalizedStep);

      const rawPending = sessionStorage.getItem(PENDING_UPLOAD_SESSION_KEY);
      /** שחזור גם כשאין עדיין טיוטה ב־localStorage (ריענון מיד אחרי העלאה) */
      const shouldTryRestorePending =
        normalizedStep === 2 &&
        !!rawPending &&
        (uploadLike || !raw);

      if (shouldTryRestorePending) {
        try {
          const p = JSON.parse(rawPending) as PendingMissingUpload;
          if (
            p?.extractedData &&
            typeof p.missingValues === "object" &&
            p.missingValues
          ) {
            setPendingMissingUploadInternal(p);
          }
        } catch {
          sessionStorage.removeItem(PENDING_UPLOAD_SESSION_KEY);
        }
      } else if (!shouldTryRestorePending) {
        sessionStorage.removeItem(PENDING_UPLOAD_SESSION_KEY);
      }
    } catch {
      // ignore corrupted drafts
    }
  }, []);

  // Autosave draft on changes
  useEffect(() => {
    try {
      if (isGuestExploreSession()) return;
      localStorage.setItem("tax_return_draft", JSON.stringify(taxData));
    } catch {
      // ignore localStorage errors
    }
  }, [taxData]);

  useEffect(() => {
    try {
      if (isGuestExploreSession()) return;
      const stepToPersist = currentStep >= 3 ? 2 : currentStep;
      localStorage.setItem("tax_return_step", String(stepToPersist));
    } catch {
      // ignore localStorage errors
    }
  }, [currentStep]);

  // איפוס נתונים וטיוטה כשנכנסים למצב אורח
  useEffect(() => {
    const onGuestEntered = () => {
      setCurrentStep(1);
      setTaxData(defaultTaxData);
      setPendingMissingUploadInternal(null);
      try {
        localStorage.removeItem("tax_return_draft");
        localStorage.removeItem("tax_return_step");
        sessionStorage.removeItem(PENDING_UPLOAD_SESSION_KEY);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("guest:entered", onGuestEntered);
    return () => window.removeEventListener("guest:entered", onGuestEntered);
  }, []);

  const goToNextStep = () => {
    console.log("🔄 goToNextStep called, current step:", currentStep);
    setCurrentStep((prev) => {
      const nextStep = Math.min(prev + 1, 3);
      console.log("🔄 Moving from step", prev, "to step", nextStep);
      return nextStep;
    });
  };

  const goToPreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const setCalculatorStep = (step: number) => {
    const n = Math.floor(Number(step));
    if (Number.isNaN(n)) return;
    setCurrentStep(Math.max(1, Math.min(3, n)));
  };

  const resetCalculator = () => {
    setCurrentStep(1);
    setTaxData(defaultTaxData);
    setPendingMissingUpload(null);
    try {
      localStorage.removeItem("tax_return_draft");
      localStorage.removeItem("tax_return_step");
      sessionStorage.removeItem(PENDING_UPLOAD_SESSION_KEY);
    } catch {
      // ignore localStorage errors
    }
  };

  const handleSetTaxData = (newData: TaxData) => {
    console.log("📝 setTaxData called with:", newData);
    setTaxData(newData);
  };

  return (
    <TaxCalculatorContext.Provider
      value={{
        currentStep,
        taxData,
        setTaxData: handleSetTaxData,
        setCalculatorStep,
        goToNextStep,
        goToPreviousStep,
        resetCalculator,
        pendingMissingUpload,
        setPendingMissingUpload,
        patchPendingMissingUploadField,
      }}
    >
      {children}
    </TaxCalculatorContext.Provider>
  );
};

// Hook for using the tax calculator context
export const useTaxCalculator = (): TaxCalculatorContextType => {
  const context = useContext(TaxCalculatorContext);

  if (context === undefined) {
    throw new Error(
      "useTaxCalculator must be used within a TaxCalculatorProvider"
    );
  }

  return context;
};
