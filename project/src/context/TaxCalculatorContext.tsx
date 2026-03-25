import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  isGuestExploreSession,
} from "../utils/guestMode";

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
} & Record<string, unknown>;

/** טיוטת השלמה אחרי העלאה כשהשרת דורש השלמת שדות — מוצגת בשלב 2 עם הסטפר */
export type PendingMissingUpload = {
  extractedData: Record<string, string | number | undefined>;
  missingValues: Record<string, string | number>;
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

// Create provider component
export const TaxCalculatorProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [taxData, setTaxData] = useState<TaxData>(defaultTaxData);
  const [pendingMissingUpload, setPendingMissingUpload] =
    useState<PendingMissingUpload | null>(null);

  const patchPendingMissingUploadField = (
    id: string,
    value: string | number | boolean
  ) => {
    setPendingMissingUpload((prev) =>
      prev
        ? {
            ...prev,
            missingValues: {
              ...prev.missingValues,
              [id]: typeof value === "boolean" ? String(value) : value,
            },
          }
        : null
    );
  };

  // Load draft from localStorage on mount (לא באורח — בלי טיוטה בדפדפן)
  useEffect(() => {
    try {
      if (isGuestExploreSession()) return;
      const raw = localStorage.getItem("tax_return_draft");
      const rawStep = localStorage.getItem("tax_return_step");
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<TaxData>;
        if (parsed && typeof parsed === "object") {
          const dataSource: TaxDataSource =
            parsed.dataSource === "upload" || parsed.dataSource === "manual"
              ? parsed.dataSource
              : parsed.hasFormData
                ? "upload"
                : "manual";
          setTaxData({
            ...defaultTaxData,
            ...parsed,
            dataSource,
            hasFormData: dataSource === "upload",
          });
        }
      }
      if (rawStep) {
        const stepNum = parseInt(rawStep, 10);
        if (!Number.isNaN(stepNum) && stepNum >= 1 && stepNum <= 3) {
          setCurrentStep(stepNum);
        }
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
      localStorage.setItem("tax_return_step", String(currentStep));
    } catch {
      // ignore localStorage errors
    }
  }, [currentStep]);

  // איפוס נתונים וטיוטה כשנכנסים למצב אורח
  useEffect(() => {
    const onGuestEntered = () => {
      setCurrentStep(1);
      setTaxData(defaultTaxData);
      setPendingMissingUpload(null);
      try {
        localStorage.removeItem("tax_return_draft");
        localStorage.removeItem("tax_return_step");
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
