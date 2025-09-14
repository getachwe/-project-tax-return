import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FilePlus, Loader2, Pencil, BarChart } from "lucide-react";
import { useTaxCalculator } from "../context/TaxCalculatorContext";
import {
  FIELD_LABELS,
  FIELD_TOOLTIPS,
  MARITAL_OPTIONS,
  GENDER_OPTIONS,
  EMPLOYMENT_OPTIONS,
} from "../constants/fields";
import { DynamicForm, DynamicFormField } from "./DynamicForm";
import Toast from "./Toast";

export const UploadForm: React.FC = () => {
  const { goToNextStep, setTaxData } = useTaxCalculator();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[] | null>(null);
  const [extractedData, setExtractedData] = useState<Record<
    string,
    string | number | undefined
  > | null>(null);
  const [missingValues, setMissingValues] = useState<
    Record<string, string | number>
  >({});
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setError(null);
      setIsLoading(true);
      setMissingFields(null);
      setExtractedData(null);
      setMissingValues({});
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("http://localhost:4000/api/process-106", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) throw new Error("שגיאה בעיבוד הקובץ");
        const result = await response.json();
        if (!result.success) throw new Error(result.error || "שגיאה לא ידועה");
        if (result.missingFields && result.missingFields.length > 0) {
          setExtractedData(result.data);
          setMissingFields(result.missingFields);
          setIsLoading(false);
          setToast({
            type: "info",
            message: "נמצאו נתונים – יש להשלים שדות חסרים",
          });
          return;
        }
        setTaxData({
          ...result.data,
          hasFormData: true,
        });
        setIsLoading(false);
        setToast({ type: "success", message: "הקובץ עובד בהצלחה!" });
        goToNextStep();
      } catch (err) {
        setIsLoading(false);
        setError((err as Error).message);
        setToast({ type: "error", message: (err as Error).message });
      }
    },
    [goToNextStep, setTaxData]
  );

  const handleMissingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      // Combine extractedData and missingValues
      const allData = { ...extractedData, ...missingValues };
      // Send to backend for simulation
      const response = await fetch("http://localhost:4000/api/process-106", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(allData),
      });
      if (!response.ok) throw new Error("שגיאה בעיבוד הנתונים");
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "שגיאה לא ידועה");
      setTaxData({ ...allData, ...result.data, hasFormData: true });
      setIsLoading(false);
      setToast({ type: "success", message: "נשמר והמשכנו לשלב הבא" });
      goToNextStep();
    } catch (err) {
      setIsLoading(false);
      setError((err as Error).message);
      setToast({ type: "error", message: (err as Error).message });
    }
  };

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      onDrop,
      accept: {
        "application/pdf": [".pdf"],
        "image/jpeg": [".jpg", ".jpeg"],
        "image/png": [".png"],
      },
      maxFiles: 1,
      maxSize: 5 * 1024 * 1024, // 5MB
    });

  const selectedFile = acceptedFiles[0];

  const handleManualEntry = () => {
    setTaxData({
      income: 0,
      taxPaid: 0,
      taxCredits: 2.25,
      hasFormData: false,
    });
    goToNextStep();
  };

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

  // If missing fields, show dynamic form
  if (missingFields && missingFields.length > 0) {
    // Editable form for ALL fields
    const allFieldKeys = Object.keys(FIELD_LABELS);
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

    const fields: DynamicFormField[] = allFieldKeys.map((key) => ({
      id: key,
      label: FIELD_LABELS[key],
      type: getFieldType(key),
      tooltip: TOOLTIP_KEYS.has(key) ? FIELD_TOOLTIPS[key] : undefined,
      options: getOptions(key),
      required: ["income", "taxPaid", "taxYear", "maritalStatus"].includes(key),
      min: key === "taxYear" ? new Date().getFullYear() - 6 : undefined,
      max: key === "taxYear" ? new Date().getFullYear() - 1 : undefined,
    }));
    const values = { ...extractedData, ...missingValues };
    const handleChange = (id: string, value: string | number | boolean) => {
      setMissingValues((prev) => ({
        ...prev,
        [id]: typeof value === "boolean" ? String(value) : value,
      }));
    };
    return (
      <form onSubmit={handleMissingSubmit} className="space-y-8 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
            <Pencil className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent mb-3">
            השלמת נתונים חסרים
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
            אנחנו צריכים עוד קצת מידע כדי להמשיך. הנתונים שחולצו מהטופס מוצגים
            למטה וניתן לערוך אותם.
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
            <h3 className="text-xl font-semibold text-purple-800">
              הנתונים שחולצו אוטומטית מהטופס
            </h3>
          </div>
          <DynamicForm
            fields={fields}
            values={values}
            onChange={handleChange}
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <button
            type="submit"
            className={`btn-primary px-8 py-4 text-lg ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-3">
                <Loader2 className="animate-spin h-5 w-5" />
                מעבד...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>המשך לשלב הבא</span>
                <BarChart className="h-5 w-5" />
              </span>
            )}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="w-full">
      {/* Mobile Layout */}
      <div className="flex flex-col items-center gap-8 p-4 lg:hidden">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg animate-bounce-gentle">
              <Upload className="h-10 w-10 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent mb-2">
              העלאת טופס 106
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed max-w-lg">
              העלה קובץ PDF, JPG או PNG של טופס 106 שלך, או המשך להזנה ידנית.
            </p>
          </div>
        </div>
      </div>

      {/* Medium Desktop Layout */}
      <div className="hidden lg:grid xl:hidden lg:grid-cols-2 lg:gap-8 lg:items-start">
        {/* Left Side - Actions (Upload) */}
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center lg:text-right">
            <div className="relative inline-block mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Upload className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              העלאת טופס 106
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              בחר/י טופס 106 או גרור/י לכאן
            </p>
          </div>

          {/* Upload Box */}
          <div
            {...getRootProps()}
            className={`w-full min-h-[180px] border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:scale-[1.01] shadow-md hover:shadow-lg animate-fadeIn ${
              isDragActive
                ? "border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg scale-[1.01]"
                : "border-gray-300 bg-white/80 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 hover:border-blue-500"
            }`}
          >
            <input {...getInputProps()} />
            <div className="relative mb-3">
              <FilePlus
                className={`h-10 w-10 transition-all duration-300 ${
                  isDragActive
                    ? "text-blue-600 animate-bounce-gentle"
                    : "text-blue-400 hover:text-blue-600"
                }`}
              />
              {isDragActive && (
                <div className="absolute inset-0 animate-ping">
                  <FilePlus className="h-10 w-10 text-blue-300" />
                </div>
              )}
            </div>
            <div className="text-center space-y-2">
              <span className="text-gray-700 font-medium text-center leading-relaxed block">
                גרורו קובץ לכאן
              </span>
              <div className="text-xs text-gray-500">PDF, JPG, PNG • 50MB</div>
            </div>
            {selectedFile && (
              <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg w-full">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-emerald-700 font-medium text-sm">
                    קובץ נבחר: {selectedFile.name}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons Group */}
          <div className="space-y-3">
            {/* Primary CTA Button */}
            <button
              type="button"
              onClick={() => {
                if (selectedFile) {
                  console.log("Processing file:", selectedFile);
                } else {
                  const input = document.querySelector(
                    'input[type="file"]'
                  ) as HTMLInputElement;
                  input?.click();
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3 font-semibold transition-all duration-200 hover:scale-[1.02] shadow-md hover:shadow-lg"
            >
              {selectedFile ? "העלה והמשך" : "בחר קובץ והמשך"}
            </button>

            {/* Manual Entry Button */}
            <button
              type="button"
              onClick={handleManualEntry}
              className="w-full border border-blue-300 text-blue-600 hover:bg-blue-50 rounded-lg px-4 py-2 transition-all duration-200 hover:scale-[1.02] shadow-sm hover:shadow-md text-center text-sm"
            >
              הזנה ידנית
            </button>
          </div>
        </div>

        {/* Right Side - Tips */}
        <div className="space-y-6">
          {/* Spacer to match left side icon */}
          <div className="h-20"></div>

          {/* Tips Header */}
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            טיפים מהירים
          </h3>

          {/* Tips Cards */}
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm">📄</span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  קובץ קריא וברור
                </span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm">📄</span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  PDF, JPG, PNG
                </span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm">📦</span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  5MB המנקסימל:
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Large Desktop Layout */}
      <div className="hidden xl:grid xl:grid-cols-2 xl:gap-12 xl:items-start">
        {/* Left Side - Actions (Upload) */}
        <div className="space-y-8">
          <div className="text-center lg:text-right">
            <div className="relative inline-block mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl">
                <Upload className="h-10 w-10 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              העלאת טופס 106
            </h2>
            <p className="text-gray-600 text-base mb-4">
              בחר/י טופס 106 או גרור/י לכאן
            </p>
          </div>

          {/* Upload Box */}
          <div
            {...getRootProps()}
            className={`w-full min-h-[220px] border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:scale-[1.01] shadow-md hover:shadow-lg animate-fadeIn ${
              isDragActive
                ? "border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg scale-[1.01]"
                : "border-gray-300 bg-white/80 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 hover:border-blue-500"
            }`}
          >
            <input {...getInputProps()} />
            <div className="relative mb-4">
              <FilePlus
                className={`h-12 w-12 transition-all duration-300 ${
                  isDragActive
                    ? "text-blue-600 animate-bounce-gentle"
                    : "text-blue-400 hover:text-blue-600"
                }`}
              />
              {isDragActive && (
                <div className="absolute inset-0 animate-ping">
                  <FilePlus className="h-12 w-12 text-blue-300" />
                </div>
              )}
            </div>
            <div className="text-center space-y-3">
              <span className="text-gray-700 font-medium text-center leading-relaxed text-lg block">
                גרורו קובץ לכאן
              </span>
              <div className="text-sm text-gray-500">PDF, JPG, PNG • 50MB</div>
            </div>
            {selectedFile && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg w-full">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-emerald-700 font-medium text-sm">
                    קובץ נבחר: {selectedFile.name}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons Group */}
          <div className="space-y-4">
            {/* Primary CTA Button */}
            <button
              type="button"
              onClick={() => {
                if (selectedFile) {
                  console.log("Processing file:", selectedFile);
                } else {
                  const input = document.querySelector(
                    'input[type="file"]'
                  ) as HTMLInputElement;
                  input?.click();
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-4 font-semibold transition-all duration-200 hover:scale-[1.02] shadow-md hover:shadow-lg text-lg"
            >
              {selectedFile ? "העלה והמשך" : "בחר קובץ והמשך"}
            </button>

            {/* Manual Entry Button */}
            <button
              type="button"
              onClick={handleManualEntry}
              className="w-full border border-blue-300 text-blue-600 hover:bg-blue-50 rounded-lg px-4 py-3 transition-all duration-200 hover:scale-[1.02] shadow-sm hover:shadow-md text-center"
            >
              הזנה ידנית
            </button>
          </div>
        </div>

        {/* Right Side - Tips */}
        <div className="space-y-8">
          {/* Spacer to match left side icon */}
          <div className="h-24"></div>

          {/* Tips Cards */}
          <div className="space-y-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-6 flex items-center gap-3">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              טיפים מהירים
            </h3>
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-base">📄</span>
                  </div>
                  <span className="text-base font-medium text-gray-700">
                    קובץ קריא וברור
                  </span>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-base">📄</span>
                  </div>
                  <span className="text-base font-medium text-gray-700">
                    PDF, JPG, PNG
                  </span>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-base">📦</span>
                  </div>
                  <span className="text-base font-medium text-gray-700">
                    5MB המנקסימל:
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Upload Area */}
      <div className="lg:hidden">
        <div
          {...getRootProps()}
          className={`w-full max-w-lg mx-auto border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
            isDragActive
              ? "border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg scale-[1.02]"
              : "border-gray-300 bg-white/80 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 hover:shadow-md hover:border-blue-400"
          }`}
        >
          <input {...getInputProps()} />
          <div className="relative mb-4">
            <FilePlus
              className={`h-12 w-12 transition-all duration-300 ${
                isDragActive
                  ? "text-blue-600 animate-bounce-gentle"
                  : "text-blue-400 hover:text-blue-600"
              }`}
            />
            {isDragActive && (
              <div className="absolute inset-0 animate-ping">
                <FilePlus className="h-12 w-12 text-blue-300" />
              </div>
            )}
          </div>
          <span className="text-gray-700 font-medium text-center leading-relaxed">
            גרור/י לכאן קובץ או לחץ/י לבחירה
          </span>
          {selectedFile && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg w-full">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-emerald-700 font-medium text-sm">
                  {selectedFile.name}
                </span>
              </div>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl w-full">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="animate-spin text-blue-600 h-6 w-6" />
              <span className="text-blue-700 font-medium">
                מעבד את הקובץ...
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl w-full">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}

        {toast && <Toast type={toast.type} message={toast.message} />}
      </div>
    </div>
  );
};
