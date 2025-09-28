import React, { useMemo } from "react";
import { Dialog } from "@headlessui/react";
import { AlertCircle } from "lucide-react";
import { useTaxCalculator } from "../context/TaxCalculatorContext";
import type { TaxData } from "../context/TaxCalculatorContext";
import {
  FIELD_LABELS,
  FIELD_TOOLTIPS,
  MARITAL_OPTIONS,
  GENDER_OPTIONS,
  EMPLOYMENT_OPTIONS,
} from "../constants/fields";
import { DynamicFormField } from "./forms/DynamicForm";

const TOOLTIP_KEYS = new Set([
  "income",
  "taxPaid",
  "taxCredits",
  "additionalIncome",
  "taxYear",
  "childAllowance",
  "disabilityAllowance",
  "oldAgeAllowance",
]);

const getTooltip = (key: string) =>
  TOOLTIP_KEYS.has(key) ? FIELD_TOOLTIPS[key] : undefined;

const EXTRA_CHECKBOXES = [
  {
    id: "academicDegree",
    label: "בעל/ת תואר אקדמי (יש לי זכאות לנקודת זיכוי אקדמית)",
  },
  {
    id: "newImmigrant",
    label: "עולה חדש/ה (עליתי לישראל ב-3.5 השנים האחרונות)",
  },
  {
    id: "livingInPeriphery",
    label: "תושב/ת פריפריה (ישוב המזכה בהטבת מס)",
  },
];

const getFieldType = (key: string): DynamicFormField["type"] => {
  if (
    [
      "income",
      "taxPaid",
      "children",
      "additionalIncome",
      "taxYear",
      "oldAgeAllowance",
      "disabilityPercent",
      "yearsSinceAliyah",
      "creditPoints",
      "childAllowance",
      "disabilityAllowance",
    ].includes(key)
  )
    return "number";
  if (["birthDate", "workStartDate", "workEndDate"].includes(key))
    return "date";
  if (["maritalStatus", "gender", "employmentType"].includes(key))
    return "select";
  if (["isArmyService", "isNationalService"].includes(key)) return "checkbox";
  return "text";
};

const getOptions = (key: string) => {
  if (key === "maritalStatus") return MARITAL_OPTIONS;
  if (key === "gender") return GENDER_OPTIONS;
  if (key === "employmentType") return EMPLOYMENT_OPTIONS;
  return undefined;
};

export const ManualForm: React.FC = () => {
  const { taxData, setTaxData, goToNextStep, goToPreviousStep } =
    useTaxCalculator();
  const [extra, setExtra] = React.useState({
    academicDegree: !!taxData.academicDegree,
    newImmigrant: !!taxData.newImmigrant,
    livingInPeriphery: !!taxData.livingInPeriphery,
  });
  const [showSubmitError, setShowSubmitError] = React.useState(false);

  // סידור השדות לפי נושאים
  const fieldSections = useMemo(
    () => ({
      // נתונים עיקריים לחישוב מס
      main: [
        "income",
        "taxPaid",
        "taxCredits",
        "additionalIncome",
        "workPeriod",
        "creditPoints",
        "children",
        "taxYear",
      ],

      // נתונים אישיים
      personal: [
        "firstName",
        "lastName",
        "employeeId",
        "birthDate",
        "maritalStatus",
        "gender",
        "address",
        "residency",
      ],

      // נתוני עבודה
      employment: [
        "employmentType",
        "workStartDate",
        "workEndDate",
        "employerName",
        "deductionFileNumber",
        "kibbutzMember",
      ],

      // נתונים פיננסיים נוספים
      financial: [
        "pensionAllocation",
        "employeePensionDeposit",
        "socialSecuritySalary",
      ],

      // קצבאות
      benefits: ["childAllowance", "disabilityAllowance", "oldAgeAllowance"],
    }),
    []
  );

  const fields: DynamicFormField[] = useMemo(
    () =>
      Object.values(fieldSections)
        .flat()
        .map((key) => ({
          id: key,
          label: FIELD_LABELS[key],
          type: getFieldType(key),
          tooltip: getTooltip(key),
          options: getOptions(key),
          required: ["income", "taxPaid", "taxYear", "maritalStatus"].includes(
            key
          ),
          readOnly: key === "taxYear" ? false : undefined,
          min: [
            "income",
            "taxPaid",
            "taxYear",
            "children",
            "additionalIncome",
            "oldAgeAllowance",
            "childAllowance",
            "disabilityAllowance",
          ].includes(key)
            ? key === "taxYear"
              ? new Date().getFullYear() - 6
              : 0
            : undefined,
          max: key === "taxYear" ? new Date().getFullYear() - 1 : undefined,
        })),
    [fieldSections]
  );

  const values: Record<string, string | number | undefined> = {
    ...Object.fromEntries(
      Object.entries(taxData)
        .filter(([key]) => key !== "hasFormData")
        .map(([key, value]) => [key, value as string | number | undefined])
    ),
    ...Object.fromEntries(
      Object.entries(extra).map(([key, value]) => [key, String(value)])
    ),
  };

  const handleChange = (id: string, value: string | number | boolean) => {
    setShowSubmitError(false);
    if (id in extra) {
      setExtra((prev) => ({ ...prev, [id]: value }));
    } else {
      setTaxData({ ...taxData, [id]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("ManualForm handleSubmit called");
    console.log("isFormValid:", isFormValid);
    console.log("taxData:", taxData);
    console.log("extra:", extra);

    if (!isFormValid) {
      console.log("Form not valid, showing error");
      setShowSubmitError(true);
      return;
    }

    console.log(
      "✅ Form is valid, building final payload from current form values"
    );
    const numericYear = Number(values.taxYear);
    const boundedYear = !Number.isNaN(numericYear)
      ? Math.max(
          Math.min(numericYear, new Date().getFullYear() - 1),
          new Date().getFullYear() - 6
        )
      : undefined;
    const finalFromForm = {
      ...values,
      taxYear: boundedYear ?? values.taxYear,
    } as Record<string, unknown>;
    console.log("📝 Setting taxData with form snapshot:", {
      ...taxData,
      ...finalFromForm,
      ...extra,
    });
    setTaxData({
      ...(taxData as unknown as TaxData),
      ...finalFromForm,
      ...extra,
    } as TaxData);
    console.log("🚀 About to call goToNextStep from ManualForm");
    goToNextStep();
    console.log("✅ goToNextStep called from ManualForm");
  };

  // Simple error simulation: required fields must not be empty
  const errors: Record<string, string> = {};
  const valuesRecord = values as Record<string, unknown>;
  fields.forEach((f) => {
    if (f.required && !valuesRecord[f.id]) {
      errors[f.id] = "שדה חובה";
    }
  });

  const isFormValid = Object.keys(errors).length === 0;

  // Find missing required fields for modal
  const missingFields = fields.filter((f) => f.required && !valuesRecord[f.id]);

  return (
    <>
      {/* Modal for submit error */}
      <Dialog
        open={showSubmitError && !isFormValid}
        onClose={() => setShowSubmitError(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-gray-100">
            <Dialog.Title className="text-xl font-bold mb-4 text-center text-red-700 flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8 text-red-500 mb-1" />
              לא ניתן להמשיך לשלב הבא
            </Dialog.Title>
            <div className="text-gray-700 text-center mb-4">
              יש למלא את כל השדות החיוניים לפני שניתן להמשיך. שדות חובה מסומנים
              באדום.
            </div>
            <ul className="mb-4 text-right">
              {missingFields.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center gap-2 text-red-600 mb-1"
                >
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="font-medium">{f.label}</span>
                </li>
              ))}
            </ul>
            <button
              className="btn-primary w-full mt-2"
              onClick={() => setShowSubmitError(false)}
            >
              סגור
            </button>
          </Dialog.Panel>
        </div>
      </Dialog>
      {/* End Modal */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-blue-700 mb-2">
            השלמת נתונים
          </h2>
          <p className="text-gray-600">
            {taxData.hasFormData
              ? "הנתונים הבאים חולצו מהטופס שהעלית. אנא בדוק ותקן במידת הצורך."
              : "אנא הזן את הנתונים הבאים כדי שנוכל לחשב את החזר המס האפשרי שלך."}
          </p>
        </div>
        <div className="space-y-10">
          {/* נתונים עיקריים לחישוב מס */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              נתונים עיקריים לחישוב מס
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-6">
              {fieldSections.main.map((key) => {
                const field = fields.find((f) => f.id === key);
                if (!field) return null;
                return (
                  <div
                    key={key}
                    className={`space-y-2 ${
                      [
                        "employeeId",
                        "taxYear",
                        "creditPoints",
                        "children",
                      ].includes(key)
                        ? "md:max-w-xs"
                        : ""
                    }`}
                  >
                    <label className="block text-sm font-medium text-gray-900">
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 mr-1">*</span>
                      )}
                      {field.tooltip && (
                        <span
                          className="ml-2 text-blue-500 cursor-help"
                          title={field.tooltip}
                        >
                          ℹ️
                        </span>
                      )}
                    </label>
                    <input
                      type={
                        field.type === "number"
                          ? "number"
                          : field.type === "date"
                          ? "date"
                          : "text"
                      }
                      value={
                        (values as Record<string, string | number>)[key] ?? ""
                      }
                      onChange={(e) => {
                        const v = e.target.value;
                        handleChange(
                          key,
                          field.type === "number"
                            ? v === ""
                              ? ""
                              : Number(v)
                            : v
                        );
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                      required={field.required}
                      min={field.min}
                      max={field.max}
                      dir={field.type === "number" ? "rtl" : undefined}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* נתונים אישיים */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              נתונים אישיים
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-6">
              {fieldSections.personal.map((key) => {
                const field = fields.find((f) => f.id === key);
                if (!field) return null;
                return (
                  <div
                    key={key}
                    className={`space-y-2 ${
                      [
                        "employeeId",
                        "taxYear",
                        "creditPoints",
                        "children",
                      ].includes(key)
                        ? "md:max-w-xs"
                        : ""
                    }`}
                  >
                    <label className="block text-sm font-medium text-gray-900">
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 mr-1">*</span>
                      )}
                      {field.tooltip && (
                        <span
                          className="ml-2 text-blue-500 cursor-help"
                          title={field.tooltip}
                        >
                          ℹ️
                        </span>
                      )}
                    </label>
                    {field.type === "select" ? (
                      <select
                        value={
                          (values as Record<string, string | number>)[key] ?? ""
                        }
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                        required={field.required}
                      >
                        <option value="">בחר...</option>
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={
                          field.type === "number"
                            ? "number"
                            : field.type === "date"
                            ? "date"
                            : "text"
                        }
                        value={
                          (values as Record<string, string | number>)[key] ?? ""
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          handleChange(
                            key,
                            field.type === "number"
                              ? v === ""
                                ? ""
                                : Number(v)
                              : v
                          );
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                        required={field.required}
                        min={field.min}
                        max={field.max}
                        dir={field.type === "number" ? "rtl" : undefined}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* נתוני עבודה */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              נתוני עבודה
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-6">
              {fieldSections.employment.map((key) => {
                const field = fields.find((f) => f.id === key);
                if (!field) return null;
                return (
                  <div
                    key={key}
                    className={`space-y-2 ${
                      [
                        "employeeId",
                        "taxYear",
                        "creditPoints",
                        "children",
                      ].includes(key)
                        ? "md:max-w-xs"
                        : ""
                    }`}
                  >
                    <label className="block text-sm font-medium text-gray-900">
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 mr-1">*</span>
                      )}
                      {field.tooltip && (
                        <span
                          className="ml-2 text-blue-500 cursor-help"
                          title={field.tooltip}
                        >
                          ℹ️
                        </span>
                      )}
                    </label>
                    {field.type === "select" ? (
                      <select
                        value={
                          (values as Record<string, string | number>)[key] ?? ""
                        }
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                        required={field.required}
                      >
                        <option value="">בחר...</option>
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={
                          field.type === "number"
                            ? "number"
                            : field.type === "date"
                            ? "date"
                            : "text"
                        }
                        value={
                          (values as Record<string, string | number>)[key] ?? ""
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          handleChange(
                            key,
                            field.type === "number"
                              ? v === ""
                                ? ""
                                : Number(v)
                              : v
                          );
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                        required={field.required}
                        min={field.min}
                        max={field.max}
                        dir={field.type === "number" ? "rtl" : undefined}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* נתונים פיננסיים נוספים */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              נתונים פיננסיים נוספים
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-6">
              {fieldSections.financial.map((key) => {
                const field = fields.find((f) => f.id === key);
                if (!field) return null;
                return (
                  <div
                    key={key}
                    className={`space-y-2 ${
                      [
                        "employeeId",
                        "taxYear",
                        "creditPoints",
                        "children",
                      ].includes(key)
                        ? "md:max-w-xs"
                        : ""
                    }`}
                  >
                    <label className="block text-sm font-medium text-gray-900">
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 mr-1">*</span>
                      )}
                      {field.tooltip && (
                        <span
                          className="ml-2 text-blue-500 cursor-help"
                          title={field.tooltip}
                        >
                          ℹ️
                        </span>
                      )}
                    </label>
                    <input
                      type={
                        field.type === "number"
                          ? "number"
                          : field.type === "date"
                          ? "date"
                          : "text"
                      }
                      value={
                        (values as Record<string, string | number>)[key] ?? ""
                      }
                      onChange={(e) => {
                        const v = e.target.value;
                        handleChange(
                          key,
                          field.type === "number"
                            ? v === ""
                              ? ""
                              : Number(v)
                            : v
                        );
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                      required={field.required}
                      min={field.min}
                      max={field.max}
                      dir={field.type === "number" ? "rtl" : undefined}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* קצבאות */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">קצבאות</h3>
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-6">
              {fieldSections.benefits.map((key) => {
                const field = fields.find((f) => f.id === key);
                if (!field) return null;
                return (
                  <div
                    key={key}
                    className={`space-y-2 ${
                      [
                        "employeeId",
                        "taxYear",
                        "creditPoints",
                        "children",
                      ].includes(key)
                        ? "md:max-w-xs"
                        : ""
                    }`}
                  >
                    <label className="block text-sm font-medium text-gray-900">
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 mr-1">*</span>
                      )}
                      {field.tooltip && (
                        <span
                          className="ml-2 text-blue-500 cursor-help"
                          title={field.tooltip}
                        >
                          ℹ️
                        </span>
                      )}
                    </label>
                    <input
                      type={
                        field.type === "number"
                          ? "number"
                          : field.type === "date"
                          ? "date"
                          : "text"
                      }
                      value={
                        (values as Record<string, string | number>)[key] ?? ""
                      }
                      onChange={(e) => {
                        const v = e.target.value;
                        handleChange(
                          key,
                          field.type === "number"
                            ? v === ""
                              ? ""
                              : Number(v)
                            : v
                        );
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                      required={field.required}
                      min={field.min}
                      max={field.max}
                      dir={field.type === "number" ? "rtl" : undefined}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 mt-4 p-4 bg-blue-50 rounded-xl">
            <h3 className="text-lg font-medium text-blue-900">
              זכאויות נוספות
            </h3>
            <div className="flex flex-row flex-wrap gap-6 items-center">
              {EXTRA_CHECKBOXES.map((cb) => (
                <div className="flex items-center" key={cb.id}>
                  <input
                    id={cb.id}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded ml-2"
                    checked={!!extra[cb.id as keyof typeof extra]}
                    onChange={(e) => handleChange(cb.id, e.target.checked)}
                  />
                  <label htmlFor={cb.id} className="text-gray-700">
                    {cb.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <button
              type="button"
              onClick={goToPreviousStep}
              className="btn-secondary px-8 py-2"
            >
              חזרה
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="btn-primary px-8 py-2"
            >
              המשך
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
