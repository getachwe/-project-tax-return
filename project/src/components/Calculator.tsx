import React from "react";
import { useTaxCalculator } from "../context/TaxCalculatorContext";
import { UploadForm } from "./features/upload/UploadForm";
import { ManualForm } from "./ManualForm";
import { ResultsDisplay } from "./ResultsDisplay";
import { ProgressSteps } from "./ProgressSteps";

export const Calculator: React.FC = () => {
  const { currentStep } = useTaxCalculator();

  return (
    <div className="w-full max-w-2xl lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
      <div className="card-enhanced">
        <ProgressSteps />
        <div className="mt-6 px-2">
          {currentStep === 1 && <UploadForm />}
          {currentStep === 2 && <ManualForm />}
          {currentStep === 3 && <ResultsDisplay />}
        </div>
      </div>
    </div>
  );
};
