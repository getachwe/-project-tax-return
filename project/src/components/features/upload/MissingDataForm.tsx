import React from "react";
import { Pencil } from "lucide-react";
import { DynamicFormField } from "../../forms/DynamicForm";
import {
  FIELD_LABELS,
  FIELD_TOOLTIPS,
  MARITAL_OPTIONS,
  GENDER_OPTIONS,
  EMPLOYMENT_OPTIONS,
} from "../../../constants/fields";

interface MissingDataFormProps {
  extractedData: Record<string, string | number | undefined>;
  missingValues: Record<string, string | number>;
  onValueChange: (id: string, value: string | number | boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const MissingDataForm: React.FC<MissingDataFormProps> = ({
  extractedData,
  missingValues,
  onValueChange,
  onSubmit,
}) => {
  const getFieldType = (key: string): DynamicFormField["type"] => {
    if (
      [
        "income",
        "taxPaid",
        "creditPoints",
        "children",
        "additionalIncome",
        "taxYear",
        "oldAgeAllowance",
        "childAllowance",
        "disabilityAllowance",
      ].includes(key)
    )
      return "number";
    if (["birthDate", "workStartDate", "workEndDate"].includes(key))
      return "date";
    if (["maritalStatus", "gender", "employmentType"].includes(key))
      return "select";
    return "text";
  };

  const getOptions = (key: string) => {
    if (key === "maritalStatus") return MARITAL_OPTIONS;
    if (key === "gender") return GENDER_OPTIONS;
    if (key === "employmentType") return EMPLOYMENT_OPTIONS;
    return undefined;
  };

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

  // סידור השדות לפי נושאים
  const fieldSections = {
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
  };

  const fields: DynamicFormField[] = Object.values(fieldSections)
    .flat()
    .map((key) => ({
      id: key,
      label: FIELD_LABELS[key],
      type: getFieldType(key),
      tooltip: TOOLTIP_KEYS.has(key)
        ? FIELD_TOOLTIPS[key as keyof typeof FIELD_TOOLTIPS]
        : undefined,
      options: getOptions(key),
      required: ["income", "taxPaid", "taxYear", "maritalStatus"].includes(key),
      min: key === "taxYear" ? new Date().getFullYear() - 6 : undefined,
      max: key === "taxYear" ? new Date().getFullYear() - 1 : undefined,
    }));

  // מיפוי נתונים מחולצים לשדות הנכונים
  const mappedData = {
    ...extractedData,
    ...missingValues,

    // נתונים עיקריים לחישוב מס – לא מוחקים ערכי משתמש ריקים
    income:
      (Object.prototype.hasOwnProperty.call(missingValues, "income")
        ? missingValues.income
        : extractedData.income) ?? 0,
    taxPaid:
      (Object.prototype.hasOwnProperty.call(missingValues, "taxPaid")
        ? missingValues.taxPaid
        : extractedData.taxPaid) ?? 0,
    taxCredits:
      (Object.prototype.hasOwnProperty.call(missingValues, "taxCredits")
        ? missingValues.taxCredits
        : extractedData.pensionContribution ?? extractedData.taxDeductions) ??
      0,
    workPeriod:
      (Object.prototype.hasOwnProperty.call(missingValues, "workPeriod")
        ? (missingValues as Record<string, string | number>)["workPeriod"]
        : extractedData.workPeriod) ??
      (extractedData.workMonths ? `${extractedData.workMonths} חודשים` : ""),
    creditPoints:
      (Object.prototype.hasOwnProperty.call(missingValues, "creditPoints")
        ? missingValues.creditPoints
        : extractedData.creditPoints) ?? 0,
    children:
      (Object.prototype.hasOwnProperty.call(missingValues, "children")
        ? missingValues.children
        : extractedData.children) ?? 0,
    taxYear:
      (Object.prototype.hasOwnProperty.call(missingValues, "taxYear")
        ? missingValues.taxYear
        : extractedData.taxYear) ?? 2023,
  };

  console.log("MissingDataForm mapped values:", mappedData);

  return (
    <div className="space-y-10 p-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
          <Pencil className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent mb-3">
          השלמת נתונים חסרים
        </h2>
        <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
          אנחנו צריכים עוד קצת מידע כדי להמשיך. הנתונים שחולצו מהטופס מוצגים
          להלן - אנא בדוק ועדכן אותם במידת הצורך.
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
                      (mappedData as Record<string, string | number>)[key] ?? ""
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      onValueChange(
                        key,
                        field.type === "number"
                          ? v === ""
                            ? ""
                            : Number(v)
                          : v
                      );
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white"
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
                <div key={key} className="space-y-2">
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
                        (mappedData as Record<string, string | number>)[key] ??
                        ""
                      }
                      onChange={(e) => onValueChange(key, e.target.value)}
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
                        (mappedData as Record<string, string | number>)[key] ??
                        ""
                      }
                      onChange={(e) => {
                        const v = e.target.value;
                        onValueChange(
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
                <div key={key} className="space-y-2">
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
                        (mappedData as Record<string, string | number>)[key] ??
                        ""
                      }
                      onChange={(e) => onValueChange(key, e.target.value)}
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
                        (mappedData as Record<string, string | number>)[key] ??
                        ""
                      }
                      onChange={(e) => {
                        const v = e.target.value;
                        onValueChange(
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
                <div key={key} className="space-y-2">
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
                      (mappedData as Record<string, string | number>)[key] ?? ""
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      onValueChange(
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
                <div key={key} className="space-y-2">
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
                      (mappedData as Record<string, string | number>)[key] ?? ""
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      onValueChange(
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

        {/* כפתור המשך */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg transition-all duration-200"
          >
            המשך לחישוב
          </button>
        </div>
      </div>
    </div>
  );
};
