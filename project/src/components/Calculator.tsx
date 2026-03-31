import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTaxCalculator } from "../context/TaxCalculatorContext";
import { UploadForm } from "./features/upload/UploadForm";
import { ManualForm } from "./ManualForm";
import { MissingUploadCompletion } from "./MissingUploadCompletion";
import { ProgressSteps } from "./ProgressSteps";
import { IntakeProfileForm } from "./IntakeProfileForm";

export const Calculator: React.FC = () => {
  const { currentStep, taxData, pendingMissingUpload, setCalculatorStep } =
    useTaxCalculator();
  const intakeDone = taxData.intakeCompleted === true;
  const navigate = useNavigate();
  const taxDataRef = useRef(taxData);
  taxDataRef.current = taxData;
  const prevStepRef = useRef<number | null>(null);

  // מעבר חד-פעמי 2→3: ניווט SPA לתוצאות בלי לחזור עליו בכל עדכון taxData
  useEffect(() => {
    const prev = prevStepRef.current;
    prevStepRef.current = currentStep;
    if (prev === null) return;

    if (prev === 2 && currentStep === 3) {
      const snapshot = { ...taxDataRef.current };
      navigate("/results", {
        replace: true,
        state: {
          taxData: snapshot,
          fromCalculator: true,
        },
      });
      setCalculatorStep(2);
    }
  }, [currentStep, navigate, setCalculatorStep]);

  // שלב 1 — קודם Intake (STEP 0), אחר כך העלאה / טיפים
  if (currentStep === 1) {
    return (
      <div className="w-full max-w-none px-0 py-0">
        {!intakeDone ? <IntakeProfileForm /> : <UploadForm />}
      </div>
    );
  }

  // שלבים הבאים – שומרים על העיצוב הקיים
  return (
    <div className="w-full max-w-2xl lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
      <div className="card-enhanced">
        <ProgressSteps />
        <div className="mt-6 px-2">
          {currentStep === 2 &&
            (pendingMissingUpload ? (
              <MissingUploadCompletion />
            ) : (
              <ManualForm />
            ))}
        </div>
      </div>
    </div>
  );
};
