import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Define the tax data structure
export type TaxData = {
  income: number;
  taxPaid: number;
  taxCredits: number;
  hasFormData?: boolean;
  children?: number;
  academicDegree?: boolean;
  newImmigrant?: boolean;
  livingInPeriphery?: boolean;
  maritalStatus?: string;
} & Record<string, unknown>;

// Define the context structure
interface TaxCalculatorContextType {
  currentStep: number;
  taxData: TaxData;
  setTaxData: (data: TaxData) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  resetCalculator: () => void;
}

// Default tax data
const defaultTaxData: TaxData = {
  income: 0,
  taxPaid: 0,
  taxCredits: 2.25, // Default for a working person in Israel
  hasFormData: false,
  maritalStatus: "single",
};

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

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tax_return_draft");
      const rawStep = localStorage.getItem("tax_return_step");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setTaxData({ ...defaultTaxData, ...parsed });
        }
      }
      if (rawStep) {
        const stepNum = parseInt(rawStep, 10);
        if (!Number.isNaN(stepNum) && stepNum >= 1 && stepNum <= 3) {
          setCurrentStep(stepNum);
        }
      }
    } catch (e) {
      // ignore corrupted drafts
    }
  }, []);

  // Autosave draft on changes
  useEffect(() => {
    try {
      localStorage.setItem("tax_return_draft", JSON.stringify(taxData));
    } catch (e) {}
  }, [taxData]);

  useEffect(() => {
    try {
      localStorage.setItem("tax_return_step", String(currentStep));
    } catch (e) {}
  }, [currentStep]);

  const goToNextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const goToPreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const resetCalculator = () => {
    setCurrentStep(1);
    setTaxData(defaultTaxData);
    try {
      localStorage.removeItem("tax_return_draft");
      localStorage.removeItem("tax_return_step");
    } catch (e) {}
  };

  return (
    <TaxCalculatorContext.Provider
      value={{
        currentStep,
        taxData,
        setTaxData,
        goToNextStep,
        goToPreviousStep,
        resetCalculator,
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
