import React from "react";
import { useTaxCalculator } from "../context/TaxCalculatorContext";
import { UploadForm } from "./UploadForm";
import { ManualForm } from "./ManualForm";
import { ResultsDisplay } from "./ResultsDisplay";
import { ProgressSteps } from "./ProgressSteps";

export const Calculator: React.FC = () => {
  const { currentStep } = useTaxCalculator();

  return (
    <div className="w-full max-w-2xl mx-auto my-10">
      <div className="card">
        <ProgressSteps />
        <div className="mt-8">
          {currentStep === 1 && <UploadForm />}
          {currentStep === 2 && <ManualForm />}
          {currentStep === 3 && <ResultsDisplay />}
        </div>
      </div>
    </div>
  );
};
