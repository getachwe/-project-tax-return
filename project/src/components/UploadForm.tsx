import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FilePlus, Loader2 } from "lucide-react";
import { useTaxCalculator } from "../context/TaxCalculatorContext";

const FIELD_LABELS: Record<string, string> = {
  income: "הכנסה (158)",
  taxPaid: "מס שנוכה (244)",
  taxCredits: "זיכויי מס (248)",
  additionalIncome: "הכנסה נוספת (045)",
  employmentType: "סוג משרה",
  workPeriod: "תקופת עבודה",
  creditPoints: "נקודות זיכוי",
  children: "מספר ילדים מתחת לגיל 18",
  maritalStatus: "מצב משפחתי",
  taxYear: "שנת המס",
  birthDate: "תאריך לידה",
  workStartDate: "תאריך תחילת עבודה",
  workEndDate: "תאריך סיום עבודה",
  childAllowance: "קצבת ילדים",
  disabilityAllowance: "קצבת נכות",
  oldAgeAllowance: "קצבת זקנה",
  address: "כתובת",
  residency: "תושבות",
};
const MARITAL_OPTIONS = [
  { value: "single", label: "רווק/ה" },
  { value: "married", label: "נשוי/אה" },
  { value: "divorced", label: "גרוש/ה" },
  { value: "widowed", label: "אלמן/ה" },
];

export const UploadForm: React.FC = () => {
  const { goToNextStep, setTaxData } = useTaxCalculator();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[] | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [missingValues, setMissingValues] = useState<any>({});

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

  const handleMissingChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setMissingValues({ ...missingValues, [e.target.name]: e.target.value });
  };

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

  // If missing fields, show dynamic form
  if (missingFields && missingFields.length > 0) {
    return (
      <form onSubmit={handleMissingSubmit} className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            השלמת נתונים חסרים
          </h2>
          <p className="text-gray-600">אנחנו צריכים עוד קצת מידע כדי להמשיך:</p>
        </div>
        {extractedData && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <div className="font-bold mb-2">
              הנתונים שחולצו אוטומטית מהטופס:
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">שדה</th>
                  <th className="p-2 border">ערך</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(FIELD_LABELS).map(([key, label]) => (
                  <tr key={key} className="border-b">
                    <td className="p-2 border">{label}</td>
                    <td className="p-2 border">
                      {extractedData && extractedData[key] ? (
                        extractedData[key]
                      ) : (
                        <input
                          type="text"
                          className="border p-1 w-full"
                          placeholder="הזן ערך"
                          name={key}
                          onChange={handleMissingChange}
                          value={missingValues[key] || ""}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {missingFields.map((field) => (
          <div key={field} className="mb-4">
            <label className="form-label" htmlFor={field}>
              {FIELD_LABELS[field] || field}
            </label>
            {field === "maritalStatus" ? (
              <select
                id="maritalStatus"
                name="maritalStatus"
                className="input-field"
                value={missingValues.maritalStatus || ""}
                onChange={handleMissingChange}
                required
              >
                <option value="">בחר/י...</option>
                {MARITAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={field}
                name={field}
                type="number"
                className="input-field"
                value={missingValues[field] || ""}
                onChange={handleMissingChange}
                required
              />
            )}
          </div>
        ))}
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">העלאת טופס 106</h2>
        <p className="text-gray-600">
          העלה את טופס 106 שלך (או טופס דומה) כקובץ PDF או תמונה ואנחנו נחלץ את
          הנתונים באופן אוטומטי.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
        }`}
      >
        <input {...getInputProps()} />

        <Upload className="mx-auto h-12 w-12 text-gray-400" />

        <p className="mt-2 text-gray-600">
          {isDragActive
            ? "שחרר את הקובץ כאן"
            : "גרור ושחרר קובץ כאן, או לחץ לבחירת קובץ"}
        </p>

        <p className="mt-1 text-sm text-gray-500">
          PDF, JPG, או PNG (מקסימום 5MB)
        </p>

        {selectedFile && (
          <div className="mt-4 p-2 bg-blue-50 rounded-md inline-flex items-center">
            <FilePlus className="h-5 w-5 text-blue-500 ml-2" />
            <span className="text-sm text-blue-700">{selectedFile.name}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md">{error}</div>
      )}

      <div className="flex justify-between items-center mt-6">
        <button
          type="button"
          onClick={handleManualEntry}
          className="btn-secondary"
        >
          הזנה ידנית
        </button>

        <button
          type="button"
          onClick={() => onDrop(acceptedFiles)}
          disabled={!selectedFile || isLoading}
          className={`btn-primary ${
            !selectedFile || isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 ml-2 inline" />
              מעלה ומעבד...
            </>
          ) : (
            "המשך"
          )}
        </button>
      </div>
    </div>
  );
};
