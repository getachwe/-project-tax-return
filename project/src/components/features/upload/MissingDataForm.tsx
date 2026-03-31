import React, { useLayoutEffect, useMemo } from "react";
import { DynamicFormField } from "../../forms/DynamicForm";
import {
  FIELD_LABELS,
  FIELD_TOOLTIPS,
  MARITAL_OPTIONS,
  FILING_STATUS_OPTIONS,
  GENDER_OPTIONS,
  EMPLOYMENT_OPTIONS,
} from "../../../constants/fields";
import { TAX_FORM_FIELD_SCROLL_ORDER } from "../../../constants/taxFormFieldOrder";
import { mergeMissingUploadFieldValues } from "../../../utils/mergeMissingUploadFieldValues";
import { scrollToTaxFormErrors } from "../../../utils/scrollToTaxFormErrors";
import type { IncomeType } from "../../../constants/incomeType";
import { showEmployerDetailFields } from "../../../utils/intakeFieldVisibility";

interface MissingDataFormProps {
  extractedData: Record<string, string | number | undefined>;
  missingValues: Record<string, string | number | boolean>;
  onValueChange: (id: string, value: string | number | boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack?: () => void;
  fieldErrors?: Record<string, string>;
  showFieldErrors?: boolean;
  /** STEP 0: הסתרת שדות ילדים כשבפרופיל סומן "אין ילדים" */
  omitChildFields?: boolean;
  /** STEP 0: סוג הכנסה מהאינטייק — מסתיר שדות מעסיק לעצמאי/ת */
  incomeType?: IncomeType;
}

export const MissingDataForm: React.FC<MissingDataFormProps> = ({
  extractedData,
  missingValues,
  onValueChange,
  onSubmit,
  onBack,
  fieldErrors = {},
  showFieldErrors = false,
  omitChildFields = false,
  incomeType,
}) => {
  const mappedData = useMemo(
    () =>
      mergeMissingUploadFieldValues(extractedData, missingValues) as Record<
        string,
        string | number | boolean
      >,
    [extractedData, missingValues]
  );
  const isJointFiling = mappedData.filingStatus === "joint";
  const showEmployerFields = showEmployerDetailFields(incomeType);

  const getFieldType = (key: string): DynamicFormField["type"] => {
    if (
      [
        "income",
        "taxPaid",
        "taxWithheld040",
        "taxWithheld043",
        "spouseIncome",
        "spouseTaxPaid",
        "creditPoints",
        "children",
        "additionalIncome",
        "taxYear",
        "oldAgeAllowance",
        "childAllowance",
        "disabilityAllowance",
        "yearsSinceAliyah",
        "additionalCreditPoints",
      ].includes(key)
    )
      return "number";
    if (["birthDate", "workStartDate", "workEndDate"].includes(key))
      return "date";
    if (
      ["maritalStatus", "filingStatus", "gender", "employmentType"].includes(
        key
      )
    )
      return "select";
    if (
      ["academicDegree", "newImmigrant", "livingInPeriphery"].includes(key)
    )
      return "checkbox";
    return "text";
  };

  const getOptions = (key: string) => {
    if (key === "maritalStatus") return MARITAL_OPTIONS;
    if (key === "filingStatus") return FILING_STATUS_OPTIONS;
    if (key === "gender") return GENDER_OPTIONS;
    if (key === "employmentType") return EMPLOYMENT_OPTIONS;
    return undefined;
  };

  const TOOLTIP_KEYS = new Set([
    "income",
    "taxPaid",
    "taxWithheld040",
    "taxWithheld043",
    "filingStatus",
    "spouseIncome",
    "spouseTaxPaid",
    "taxCredits",
    "additionalIncome",
    "taxYear",
    "childAllowance",
    "disabilityAllowance",
    "oldAgeAllowance",
    "academicDegree",
    "newImmigrant",
    "livingInPeriphery",
    "yearsSinceAliyah",
    "additionalCreditPoints",
  ]);

  const fieldSections = useMemo(
    () => ({
      main: [
        "income",
        "taxPaid",
        "taxWithheld040",
        "taxWithheld043",
        "taxCredits",
        "additionalIncome",
        "workPeriod",
        "creditPoints",
        "additionalCreditPoints",
        ...(omitChildFields ? [] : ["children"]),
        "taxYear",
      ],
      personal: [
        "firstName",
        "lastName",
        "employeeId",
        "birthDate",
        "maritalStatus",
        "filingStatus",
        ...(isJointFiling ? ["spouseIncome", "spouseTaxPaid"] : []),
        "gender",
        "address",
        "residency",
      ],
      employment: [
        "employmentType",
        "workStartDate",
        "workEndDate",
        ...(showEmployerFields
          ? ["employerName", "deductionFileNumber", "kibbutzMember"]
          : []),
      ],
      financial: [
        "pensionAllocation",
        "employeePensionDeposit",
        "socialSecuritySalary",
      ],
      benefits: [
        ...(omitChildFields ? [] : ["childAllowance"]),
        "disabilityAllowance",
        "oldAgeAllowance",
      ],
      extraCredits: [
        "academicDegree",
        "newImmigrant",
        "yearsSinceAliyah",
        "livingInPeriphery",
      ],
    }),
    [omitChildFields, isJointFiling, showEmployerFields]
  );

  const yMin = new Date().getFullYear() - 6;
  const yMax = new Date().getFullYear() - 1;

  const fields: DynamicFormField[] = useMemo(
    () =>
      Object.values(fieldSections)
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
        "taxWithheld040",
        "taxWithheld043",
        "spouseIncome",
        "spouseTaxPaid",
        "taxYear",
        "children",
        "additionalIncome",
        "oldAgeAllowance",
        "childAllowance",
        "disabilityAllowance",
        "yearsSinceAliyah",
        "creditPoints",
        "additionalCreditPoints",
      ].includes(key)
        ? key === "taxYear"
          ? yMin
          : 0
        : undefined,
      max:
        key === "taxYear"
          ? yMax
          : key === "yearsSinceAliyah"
            ? 4
            : key === "additionalCreditPoints"
              ? 5
              : undefined,
    })),
    [fieldSections, yMin, yMax]
  );

  const sectionTitles: Record<keyof typeof fieldSections, string> = {
    main: "נתונים עיקריים לחישוב מס",
    personal: "נתונים אישיים",
    employment: "נתוני עבודה",
    financial: "נתונים פיננסיים נוספים",
    benefits: "קצבאות",
    extraCredits: "זכאויות נוספות",
  };

  const inputClass = (key: string) =>
    [
      "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800",
      showFieldErrors && fieldErrors[key] ? "border-red-500" : "border-gray-300",
    ].join(" ");

  function renderField(key: string) {
    const field = fields.find((f) => f.id === key);
    if (!field) return null;
    const raw = mappedData[key];
    const err = showFieldErrors && fieldErrors[key];

    if (field.type === "checkbox") {
      const checked =
        raw === true ||
        raw === "true" ||
        raw === 1 ||
        raw === "1";
      return (
        <div
          key={key}
          data-tax-field={key}
          className="space-y-2 md:col-span-2"
        >
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-900">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary shrink-0"
              checked={checked}
              onChange={(e) => onValueChange(key, e.target.checked)}
              aria-invalid={!!err}
            />
            <span className="text-right leading-snug">
              {field.label}
              {field.tooltip && (
                <span
                  className="mr-2 text-blue-500 cursor-help"
                  title={field.tooltip}
                >
                  ℹ️
                </span>
              )}
            </span>
          </label>
          {err && <p className="text-sm text-red-600 mt-1">{err}</p>}
        </div>
      );
    }

    const displayValue =
      raw === undefined || raw === null
        ? ""
        : field.type === "number"
          ? String(raw)
          : String(raw);

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
            value={displayValue}
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
            value={displayValue}
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <form className="space-y-6" dir="rtl" onSubmit={handleFormSubmit}>
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
          type="submit"
          className="order-1 sm:order-2 btn-primary px-8 py-2 w-full sm:w-auto"
        >
          המשך לחישוב
        </button>
      </div>
    </form>
  );
};
