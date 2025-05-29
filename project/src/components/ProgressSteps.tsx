import React from "react";
import { Check, Upload, Pencil, BarChart } from "lucide-react";
import { useTaxCalculator } from "../context/TaxCalculatorContext";

export const ProgressSteps: React.FC = () => {
  const { currentStep } = useTaxCalculator();

  const steps = [
    { id: 1, name: "העלאת טופס", icon: Upload },
    { id: 2, name: "השלמת מידע", icon: Pencil },
    { id: 3, name: "תוצאות", icon: BarChart },
  ];

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div className="relative flex items-center justify-between">
          {steps.map((step) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex flex-col items-center relative z-10 ${
                  isActive ? "scale-110 transition-transform duration-300" : ""
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? "bg-success-500 text-white"
                      : isActive
                      ? "bg-blue-700 text-white"
                      : "bg-gray-200 text-gray-500"
                  } transition-colors duration-300`}
                >
                  {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                </div>
                <p
                  className={`mt-2 text-sm ${
                    isActive ? "font-bold text-blue-700" : "text-gray-500"
                  } leading-[1.6] antialiased rtl text-center pr-1`}
                  dir="rtl"
                >
                  {step.name}
                </p>
              </div>
            );
          })}
        </div>

        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
          <div
            className="absolute top-0 h-full bg-blue-700 transition-all duration-500"
            style={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
