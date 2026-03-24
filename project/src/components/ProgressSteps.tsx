import React from "react";
import { Check, Upload, Pencil, BarChart, FilePenLine } from "lucide-react";
import {
  useTaxCalculator,
  isTaxDataFromUpload,
} from "../context/TaxCalculatorContext";

export const ProgressSteps: React.FC = () => {
  const { currentStep, taxData } = useTaxCalculator();
  const fromUpload = isTaxDataFromUpload(taxData);

  const steps = [
    {
      id: 1,
      name: fromUpload ? "העלאת מסמכים" : "הזנת נתונים",
      icon: fromUpload ? Upload : FilePenLine,
    },
    { id: 2, name: "בדיקה וניתוח", icon: Pencil },
    { id: 3, name: "קבלת החזר", icon: BarChart },
  ];

  const linePct =
    steps.length > 1 ? ((currentStep - 1) / (steps.length - 1)) * 100 : 0;

  return (
    <div
      className="bg-white rounded-xl border border-[#e8eaf2] p-6 sm:p-8 shadow-sm mb-6"
      dir="rtl"
    >
      <div className="relative">
        <div className="absolute top-[1.85rem] sm:top-[2rem] left-6 right-6 h-1 rounded-full bg-[#e2e8f0] z-0 overflow-hidden">
          <div
            className="h-full w-full origin-right rounded-full bg-[#00A86B] transition-transform duration-700 ease-out"
            style={{ transform: `scaleX(${linePct / 100})` }}
          />
        </div>

        <div className="relative flex flex-row justify-between items-start z-10 gap-2">
          {steps.map((step) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className="flex flex-col items-center flex-1 min-w-0 max-w-[34%]"
              >
                <div
                  className={[
                    "rounded-full flex items-center justify-center transition-all duration-500",
                    isCompleted
                      ? "w-14 h-14 bg-[#00A86B] text-white shadow-md"
                      : isActive
                      ? "w-[4.25rem] h-[4.25rem] bg-[#006D4E] text-white shadow-lg ring-4 ring-emerald-100/90 scale-105"
                      : "w-14 h-14 bg-slate-200 text-slate-500",
                  ].join(" ")}
                >
                  {isCompleted ? (
                    <Check className="w-7 h-7" strokeWidth={2.5} />
                  ) : isActive ? (
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <span className="text-[11px] font-bold leading-none">
                        {step.id}
                      </span>
                      <Icon className="w-5 h-5" strokeWidth={2.3} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <span className="text-[10px] font-bold leading-none opacity-90">
                        {step.id}
                      </span>
                      <Icon className="w-4 h-4" strokeWidth={2} />
                    </div>
                  )}
                </div>
                <p
                  className={[
                    "mt-3 text-xs sm:text-sm text-center leading-snug px-0.5",
                    isActive
                      ? "font-bold text-[#1e40af]"
                      : isCompleted
                      ? "font-medium text-[#64748b]"
                      : "text-slate-400",
                  ].join(" ")}
                >
                  {step.name}
                </p>
                {isActive && (
                  <span
                    className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#0f172a]"
                    aria-hidden
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
