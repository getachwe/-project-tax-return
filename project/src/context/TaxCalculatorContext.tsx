import { createContext, useContext, useState, ReactNode } from "react";

// Define the tax data structure
export interface TaxData {
  income: number;
  taxPaid: number;
  taxCredits: number;
  hasFormData?: boolean;
  children?: number;
  academicDegree?: boolean;
  newImmigrant?: boolean;
  livingInPeriphery?: boolean;
  maritalStatus?: string;
}

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

  const goToNextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const goToPreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const resetCalculator = () => {
    setCurrentStep(1);
    setTaxData(defaultTaxData);
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
