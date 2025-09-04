import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FilePlus, Loader2 } from "lucide-react";
import { useTaxCalculator } from "../context/TaxCalculatorContext";
import {
  FIELD_LABELS,
  FIELD_TOOLTIPS,
  MARITAL_OPTIONS,
  GENDER_OPTIONS,
  EMPLOYMENT_OPTIONS,
} from "../constants/fields";
import { DynamicForm, DynamicFormField } from "./DynamicForm";

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
          return;
        }
        setTaxData({
          ...result.data,
          hasFormData: true,
        });
        setIsLoading(false);
        goToNextStep();
      } catch (err) {
        setIsLoading(false);
        setError((err as Error).message);
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
      goToNextStep();
    } catch (err) {
      setIsLoading(false);
      setError((err as Error).message);
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
      <form onSubmit={handleMissingSubmit} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-blue-700 mb-2">
            השלמת נתונים חסרים
          </h2>
          <p className="text-gray-600">אנחנו צריכים עוד קצת מידע כדי להמשיך:</p>
        </div>
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <div className="font-bold mb-2">
            הנתונים שחולצו אוטומטית מהטופס (ניתן לערוך הכל):
          </div>
          <DynamicForm
            fields={fields}
            values={values}
            onChange={handleChange}
          />
        </div>
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md">{error}</div>
        )}
        <button
          type="submit"
          className={`btn-primary ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 ml-2 inline" />
              מעבד...
            </>
          ) : (
            "המשך"
          )}
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 p-0 w-full">
      <div className="flex flex-col items-center gap-2">
        <Upload className="h-14 w-14 text-blue-700 mb-2" />
        <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
          העלאת טופס 106
        </h2>
        <p className="text-gray-600 mb-4">
          העלה קובץ PDF, JPG או PNG של טופס 106 שלך, או המשך להזנה ידנית.
        </p>
      </div>
      <div
        {...getRootProps()}
        className={`w-full max-w-md border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-white/60 hover:bg-blue-50"
        }`}
      >
        <input {...getInputProps()} />
        <FilePlus className="h-10 w-10 text-blue-400 mb-2" />
        <span className="text-gray-700 font-medium">
          גרור/י לכאן קובץ או לחץ/י לבחירה
        </span>
        {selectedFile && (
          <span className="mt-2 text-blue-700">{selectedFile.name}</span>
        )}
      </div>
      <button
        type="button"
        onClick={handleManualEntry}
        className="btn-secondary w-full max-w-md mt-2"
      >
        הזנה ידנית במקום העלאה
      </button>
      {isLoading && <Loader2 className="animate-spin text-blue-700 mt-4" />}
      {error && <div className="error-text text-center mt-2">{error}</div>}
    </div>
  );
};
