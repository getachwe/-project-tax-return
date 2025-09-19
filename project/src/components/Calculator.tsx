import React from "react";
import { useNavigate } from "react-router-dom";
import { useTaxCalculator } from "../context/TaxCalculatorContext";
import { UploadForm } from "./features/upload/UploadForm";
import { ManualForm } from "./ManualForm";
import { ProgressSteps } from "./ProgressSteps";

export const Calculator: React.FC = () => {
  const { currentStep, taxData } = useTaxCalculator();
  const navigate = useNavigate();

  // Redirect to results page when step 3 is reached
  React.useEffect(() => {
    if (currentStep === 3) {
      console.log("Calculator - Navigating to /results with taxData:", taxData);
      navigate("/results", {
        state: {
          taxData: taxData,
          fromCalculator: true,
        },
      });
    }
  }, [currentStep, navigate, taxData]);

  return (
    <div className="w-full max-w-2xl lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
      <div className="card-enhanced">
        <ProgressSteps />
        <div className="mt-6 px-2">
          {currentStep === 1 && <UploadForm />}
          {currentStep === 2 && <ManualForm />}
        </div>
      </div>
    </div>
  );
};
