import React, { useLayoutEffect, useMemo, useState } from "react";
import {
  useTaxCalculator,
  isTaxDataFromUpload,
} from "../context/TaxCalculatorContext";
import { validateRequiredTaxCalculationFields } from "../utils/taxFormValidation";
import { scrollToTaxFormErrors } from "../utils/scrollToTaxFormErrors";
import type { TaxData } from "../context/TaxCalculatorContext";
import {
  FIELD_LABELS,
  FIELD_TOOLTIPS,
  MARITAL_OPTIONS,
  FILING_STATUS_OPTIONS,
  GENDER_OPTIONS,
  EMPLOYMENT_OPTIONS,
} from "../constants/fields";
import { DynamicFormField } from "./forms/DynamicForm";
import { TAX_FORM_FIELD_SCROLL_ORDER } from "../constants/taxFormFieldOrder";
import { showEmployerDetailFields } from "../utils/intakeFieldVisibility";
import { defaultFilingStatusFromMarital } from "../utils/intakeFilingDefaults";

const TOOLTIP_KEYS = new Set([
  "income",
  "taxPaid",
  "taxWithheld040",
  "taxWithheld043",
  "taxCredits",
  "additionalIncome",
  "taxYear",
  "childAllowance",
  "disabilityAllowance",
  "oldAgeAllowance",
  "additionalCreditPoints",
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
      "taxWithheld040",
      "taxWithheld043",
      "spouseIncome",
      "spouseTaxPaid",
      "children",
      "additionalIncome",
      "taxYear",
      "oldAgeAllowance",
      "disabilityPercent",
      "yearsSinceAliyah",
      "creditPoints",
      "additionalCreditPoints",
      "childAllowance",
      "disabilityAllowance",
    ].includes(key)
  )
    return "number";
  if (["birthDate", "workStartDate", "workEndDate"].includes(key))
    return "date";
  if (
    ["maritalStatus", "filingStatus", "gender", "employmentType"].includes(key)
  )
    return "select";
  if (["isArmyService", "isNationalService"].includes(key)) return "checkbox";
  return "text";
};

const getOptions = (key: string) => {
  if (key === "maritalStatus") return MARITAL_OPTIONS;
  if (key === "filingStatus") return FILING_STATUS_OPTIONS;
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
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [errorScrollNonce, setErrorScrollNonce] = useState(0);

  /** STEP 0: בלי ילדים — לא מציגים שדות ילדים / קצבת ילדים */
  const omitChildFields = taxData.hasChildren === false;
  const isJointFiling = taxData.filingStatus === "joint";
  const showEmployerFields = showEmployerDetailFields(taxData.incomeType);

  // סידור השדות לפי נושאים
  const fieldSections = useMemo(
    () => ({
      // נתונים עיקריים לחישוב מס
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

      // נתונים אישיים
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

      // נתוני עבודה
      employment: [
        "employmentType",
        "workStartDate",
        "workEndDate",
        ...(showEmployerFields
          ? ["employerName", "deductionFileNumber", "kibbutzMember"]
          : []),
      ],

      // נתונים פיננסיים נוספים
      financial: [
        "pensionAllocation",
        "employeePensionDeposit",
        "socialSecuritySalary",
      ],

      // קצבאות
      benefits: [
        ...(omitChildFields ? [] : ["childAllowance"]),
        "disabilityAllowance",
        "oldAgeAllowance",
      ],
    }),
    [omitChildFields, isJointFiling, showEmployerFields],
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
            "taxWithheld040",
            "taxWithheld043",
            "spouseIncome",
            "spouseTaxPaid",
            "taxYear",
            "children",
            "additionalIncome",
            "oldAgeAllowance",
            "creditPoints",
            "additionalCreditPoints",
            "childAllowance",
            "disabilityAllowance",
          ].includes(key)
            ? key === "taxYear"
              ? new Date().getFullYear() - 6
              : 0
            : undefined,
          max:
            key === "taxYear"
              ? new Date().getFullYear() - 1
              : key === "additionalCreditPoints"
                ? 5
                : undefined,
        })),
    [fieldSections]
  );

  const values: Record<string, string | number | undefined> = {
    ...Object.fromEntries(
      Object.entries(taxData)
        .filter(([key]) => key !== "hasFormData" && key !== "dataSource")
        .map(([key, value]) => [key, value as string | number | undefined])
    ),
    ...Object.fromEntries(
      Object.entries(extra).map(([key, value]) => [key, String(value)])
    ),
  };

  const handleChange = (id: string, value: string | number | boolean) => {
    setSubmitAttempted(false);
    if (id in extra) {
      setExtra((prev) => ({ ...prev, [id]: value }));
    } else if (id === "maritalStatus") {
      const fs = defaultFilingStatusFromMarital(String(value));
      setTaxData({
        ...taxData,
        maritalStatus: value as TaxData["maritalStatus"],
        filingStatus: fs,
        ...(fs === "single" ? { spouseIncome: 0, spouseTaxPaid: 0 } : {}),
      });
    } else if (id === "filingStatus") {
      const fs = value === "joint" ? "joint" : "single";
      setTaxData({
        ...taxData,
        filingStatus: fs,
        ...(fs === "single" ? { spouseIncome: 0, spouseTaxPaid: 0 } : {}),
      });
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
      console.log("Form not valid, showing field errors");
      setSubmitAttempted(true);
      setErrorScrollNonce((n) => n + 1);
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
    const source =
      taxData.dataSource ??
      (taxData.hasFormData ? ("upload" as const) : ("manual" as const));
    setTaxData({
      ...(taxData as unknown as TaxData),
      ...finalFromForm,
      ...extra,
      dataSource: source,
      hasFormData: source === "upload",
      ...(omitChildFields ? { children: 0, childAllowance: 0 } : {}),
    } as TaxData);
    console.log("🚀 About to call goToNextStep from ManualForm");
    goToNextStep();
    console.log("✅ goToNextStep called from ManualForm");
  };

  const valuesRecord = values as Record<string, unknown>;
  const errors = validateRequiredTaxCalculationFields(valuesRecord);
  const isFormValid = Object.keys(errors).length === 0;

  useLayoutEffect(() => {
    if (errorScrollNonce === 0) return;
    const errs = validateRequiredTaxCalculationFields(
      valuesRecord as Record<string, unknown>
    );
    scrollToTaxFormErrors({
      summaryId: "manual-form-validation-summary",
      fieldOrder: TAX_FORM_FIELD_SCROLL_ORDER,
      errorFieldIds: Object.keys(errs),
    });
    // גלילה רק כשמגדילים errorScrollNonce (ניסיון שליחה שנכשל)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorScrollNonce]);

  const inputClass = (key: string) =>
    [
      "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800",
      submitAttempted && errors[key] ? "border-red-500" : "border-gray-300",
    ].join(" ");

  return (
    <>
      <div className="space-y-6" dir="rtl">
        <div className="text-right mt-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1e40af] mb-2">
            השלמת נתונים
          </h2>
          <p className="text-[#64748b] text-sm sm:text-base leading-relaxed max-w-2xl mr-0 ml-auto">
            {isTaxDataFromUpload(taxData)
              ? "הנתונים הבאים חולצו מהטופס שהעלית. אנא בדוק ותקן במידת הצורך."
              : "אנא הזן את הנתונים הבאים כדי שנוכל לחשב את החזר המס האפשרי שלך."}
          </p>
          {taxData.incomeType &&
            taxData.incomeType !== "employee" && (
              <p className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200/70 rounded-lg px-3 py-2 max-w-2xl mr-0 ml-auto leading-snug">
                ציינת הכנסה שאינה שכירות בלבד — החישוב במערכת הוא הערכה; להמשך
                דיוק נדרשות הרחבות טופס (עומדות בתוכנית העבודה).
              </p>
            )}
        </div>
        {submitAttempted && !isFormValid && (
          <div
            id="manual-form-validation-summary"
            className="rounded-lg border-2 border-red-300 bg-red-50 px-4 py-4 text-sm text-red-900 text-right shadow-sm scroll-mt-20"
            role="alert"
            aria-live="polite"
          >
            <p className="font-bold mb-2">
              לא ניתן להמשיך — חסרים נתונים חיוניים לחישוב המס:
            </p>
            <ul className="list-disc list-inside space-y-1 mr-1 text-red-800">
              {fields
                .filter((f) => errors[f.id])
                .map((f) => (
                  <li key={f.id}>{f.label}</li>
                ))}
            </ul>
            <p className="mt-3 text-red-800/90">
              הדף יגלול אוטומטית לשדה הראשון שדורש השלמה. גם מתחת לכל שדה מופיעה
              הערה באדום.
            </p>
          </div>
        )}
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
                    data-tax-field={key}
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
                      className={inputClass(key)}
                      required={field.required}
                      min={field.min}
                      max={field.max}
                      dir={field.type === "number" ? "rtl" : undefined}
                      aria-invalid={submitAttempted && !!errors[key]}
                    />
                    {submitAttempted && errors[key] && (
                      <p className="text-sm text-red-600 mt-1">{errors[key]}</p>
                    )}
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
                    data-tax-field={key}
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
                        className={inputClass(key)}
                        required={field.required}
                        aria-invalid={submitAttempted && !!errors[key]}
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
                        className={inputClass(key)}
                        required={field.required}
                        min={field.min}
                        max={field.max}
                        dir={field.type === "number" ? "rtl" : undefined}
                        aria-invalid={submitAttempted && !!errors[key]}
                      />
                    )}
                    {submitAttempted && errors[key] && (
                      <p className="text-sm text-red-600 mt-1">{errors[key]}</p>
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
                    data-tax-field={key}
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
                        className={inputClass(key)}
                        required={field.required}
                        aria-invalid={submitAttempted && !!errors[key]}
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
                        className={inputClass(key)}
                        required={field.required}
                        min={field.min}
                        max={field.max}
                        dir={field.type === "number" ? "rtl" : undefined}
                        aria-invalid={submitAttempted && !!errors[key]}
                      />
                    )}
                    {submitAttempted && errors[key] && (
                      <p className="text-sm text-red-600 mt-1">{errors[key]}</p>
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
                    data-tax-field={key}
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
                      className={inputClass(key)}
                      required={field.required}
                      min={field.min}
                      max={field.max}
                      dir={field.type === "number" ? "rtl" : undefined}
                      aria-invalid={submitAttempted && !!errors[key]}
                    />
                    {submitAttempted && errors[key] && (
                      <p className="text-sm text-red-600 mt-1">{errors[key]}</p>
                    )}
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
                    data-tax-field={key}
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
                      className={inputClass(key)}
                      required={field.required}
                      min={field.min}
                      max={field.max}
                      dir={field.type === "number" ? "rtl" : undefined}
                      aria-invalid={submitAttempted && !!errors[key]}
                    />
                    {submitAttempted && errors[key] && (
                      <p className="text-sm text-red-600 mt-1">{errors[key]}</p>
                    )}
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
