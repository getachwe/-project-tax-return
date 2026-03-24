import React, { useLayoutEffect } from "react";
import { DynamicFormField } from "../../forms/DynamicForm";
import {
  FIELD_LABELS,
  FIELD_TOOLTIPS,
  MARITAL_OPTIONS,
  GENDER_OPTIONS,
  EMPLOYMENT_OPTIONS,
} from "../../../constants/fields";
import { TAX_FORM_FIELD_SCROLL_ORDER } from "../../../constants/taxFormFieldOrder";
import { mergeMissingUploadFieldValues } from "../../../utils/mergeMissingUploadFieldValues";
import { scrollToTaxFormErrors } from "../../../utils/scrollToTaxFormErrors";

interface MissingDataFormProps {
  extractedData: Record<string, string | number | undefined>;
  missingValues: Record<string, string | number>;
  onValueChange: (id: string, value: string | number | boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack?: () => void;
  fieldErrors?: Record<string, string>;
  showFieldErrors?: boolean;
}

export const MissingDataForm: React.FC<MissingDataFormProps> = ({
  extractedData,
  missingValues,
  onValueChange,
  onSubmit,
  onBack,
  fieldErrors = {},
  showFieldErrors = false,
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

  const fieldSections = {
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
    employment: [
      "employmentType",
      "workStartDate",
      "workEndDate",
      "employerName",
      "deductionFileNumber",
      "kibbutzMember",
    ],
    financial: [
      "pensionAllocation",
      "employeePensionDeposit",
      "socialSecuritySalary",
    ],
    benefits: ["childAllowance", "disabilityAllowance", "oldAgeAllowance"],
  };

  const yMin = new Date().getFullYear() - 6;
  const yMax = new Date().getFullYear() - 1;

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
          ? yMin
          : 0
        : undefined,
      max: key === "taxYear" ? yMax : undefined,
    }));

  const mappedData = mergeMissingUploadFieldValues(
    extractedData,
    missingValues
  ) as Record<string, string | number>;

  const sectionTitles: Record<keyof typeof fieldSections, string> = {
    main: "נתונים עיקריים לחישוב מס",
    personal: "נתונים אישיים",
    employment: "נתוני עבודה",
    financial: "נתונים פיננסיים נוספים",
    benefits: "קצבאות",
  };

  const inputClass = (key: string) =>
    [
      "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800",
      showFieldErrors && fieldErrors[key] ? "border-red-500" : "border-gray-300",
    ].join(" ");

  function renderField(key: string) {
    const field = fields.find((f) => f.id === key);
    if (!field) return null;
    const raw = (mappedData as Record<string, string | number>)[key] ?? "";
    const err = showFieldErrors && fieldErrors[key];

    return (
      <div
        key={key}
        data-tax-field={key}
        className={`space-y-2 ${
          ["employeeId", "taxYear", "creditPoints", "children"].includes(key)
            ? "md:max-w-xs"
            : ""
        }`}
      >
        <label className="block text-sm font-medium text-gray-900">
          {field.label}
          {field.required && (
            <span className="text-red-500 mr-1" aria-hidden>
              *
            </span>
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
            value={raw ?? ""}
            onChange={(e) => onValueChange(key, e.target.value)}
            className={inputClass(key)}
            required={field.required}
            aria-invalid={!!err}
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
            value={raw}
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
            className={inputClass(key)}
            required={field.required}
            min={field.min}
            max={field.max}
            dir={field.type === "number" ? "rtl" : undefined}
            aria-invalid={!!err}
          />
        )}
        {err && <p className="text-sm text-red-600 mt-1">{err}</p>}
      </div>
    );
  }

  const hasBlockingErrors =
    showFieldErrors && Object.keys(fieldErrors).length > 0;

  useLayoutEffect(() => {
    if (!hasBlockingErrors) return;
    scrollToTaxFormErrors({
      summaryId: "missing-upload-validation-summary",
      fieldOrder: TAX_FORM_FIELD_SCROLL_ORDER,
      errorFieldIds: Object.keys(fieldErrors),
    });
  }, [hasBlockingErrors, fieldErrors, showFieldErrors]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="text-right mt-2">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#1e40af] mb-2">
          השלמת נתונים
        </h2>
        <p className="text-[#64748b] text-sm sm:text-base leading-relaxed max-w-2xl mr-0 ml-auto">
          הנתונים הבאים חולצו מהטופס שהעלית. אנא בדוק, השלם שדות חסרים והמשך
          רק כשכל שדות החובה מלאים.
        </p>
      </div>

      {hasBlockingErrors && (
        <div
          id="missing-upload-validation-summary"
          className="rounded-lg border-2 border-red-300 bg-red-50 px-4 py-4 text-sm text-red-900 text-right shadow-sm scroll-mt-20"
          role="alert"
          aria-live="polite"
        >
          <p className="font-bold mb-2">
            לא ניתן להמשיך — חסרים נתונים חיוניים לחישוב המס:
          </p>
          <ul className="list-disc list-inside space-y-1 mr-1 text-red-800">
            {Object.keys(fieldErrors).map((id) => (
              <li key={id}>
                {FIELD_LABELS[id] ?? id}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-red-800/90">
            הדף יגלול אוטומטית לשדה הראשון שדורש השלמה. גם מתחת לכל שדה מופיעה
            הערה באדום.
          </p>
        </div>
      )}

      <div className="space-y-10">
        {(Object.keys(fieldSections) as (keyof typeof fieldSections)[]).map(
          (sectionKey) => (
            <div
              key={sectionKey}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                {sectionTitles[sectionKey]}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-6">
                {fieldSections[sectionKey].map((key) => renderField(key))}
              </div>
            </div>
          )
        )}
      </div>

      <div
        className={[
          "flex flex-col sm:flex-row gap-3 items-center pt-4",
          onBack ? "sm:justify-between" : "justify-center",
        ].join(" ")}
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="order-2 sm:order-1 btn-secondary px-8 py-2 w-full sm:w-auto"
          >
            חזרה להעלאה
          </button>
        )}
        <button
          type="button"
          onClick={onSubmit}
          className="order-1 sm:order-2 btn-primary px-8 py-2 w-full sm:w-auto"
        >
          המשך לחישוב
        </button>
      </div>
    </div>
  );
};
