import React from "react";
import { Check, Upload, Pencil, BarChart } from "lucide-react";
import { useTaxCalculator } from "../context/TaxCalculatorContext";

export const ProgressSteps: React.FC = () => {
  const { currentStep } = useTaxCalculator();

  const steps = [
    { id: 1, name: "העלאת מסמכים", icon: Upload, color: "blue" },
    { id: 2, name: "בדיקה וניתוח", icon: Pencil, color: "purple" },
    { id: 3, name: "קבלת החזר", icon: BarChart, color: "emerald" },
  ];

  const getStepColors = (
    _step: { color: string },
    isActive: boolean,
    isCompleted: boolean
  ) => {
    if (isCompleted) return "bg-green-500 text-white shadow-lg";
    if (isActive) {
      return "bg-blue-600 text-white shadow-lg ring-4 ring-blue-200";
    }
    return "bg-gray-200 text-gray-500";
  };

  const getTextColor = (_step: { color: string }, isActive: boolean) => {
    if (isActive) {
      return "font-bold text-blue-700";
    }
    return "text-gray-500";
  };

  return (
    <div className="relative bg-card rounded-xl border border-border p-6 mb-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="relative">
        {/* Progress Line - positioned to center with circles */}
        <div className="absolute top-8 left-0 right-0 h-1 bg-border rounded-full">
          <div
            className="absolute top-0 h-full bg-blue-500 rounded-full transition-all duration-700"
            style={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex items-center justify-between">
          {steps.map((step) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex flex-col items-center relative z-10 ${
                  isActive
                    ? "scale-110 transition-all duration-500"
                    : "transition-all duration-300"
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${getStepColors(
                    step,
                    isActive,
                    isCompleted
                  )} transition-all duration-500 relative`}
                >
                  <div className="flex items-center justify-center w-full h-full">
                    {isCompleted ? (
                      <Check size={24} />
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-xs font-bold mb-1">
                          {step.id}
                        </span>
                        <Icon size={18} />
                      </div>
                    )}
                  </div>
                </div>
                <p
                  className={`mt-3 text-sm ${getTextColor(
                    step,
                    isActive
                  )} leading-[1.6] antialiased text-center transition-all duration-300`}
                  dir="rtl"
                  title={
                    step.id === 1
                      ? "העלאת טופס 106"
                      : step.id === 2
                      ? "השלמת מידע"
                      : "תוצאות"
                  }
                >
                  {step.name}
                </p>
                {isActive && (
                  <div className="absolute -bottom-2 w-2 h-2 bg-current rounded-full animate-pulse-gentle" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
