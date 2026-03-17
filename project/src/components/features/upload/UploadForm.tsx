import React, { useRef, useState } from "react";
import { Upload, Pencil, ArrowRight } from "lucide-react";
import { useTaxCalculator } from "../../../context/TaxCalculatorContext";
import type { TaxData } from "../../../context/TaxCalculatorContext";
import { UploadDropzone } from "./UploadDropzone";
import { UploadTips } from "./UploadTips";
import { UploadProgress } from "./UploadProgress";
import { MissingDataForm } from "./MissingDataForm";
import Toast from "../../Toast";
import { apiProcess106 } from "../../../utils/api";

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const openPickerRef = useRef<null | (() => void)>(null);

  const handleFileUpload = async (file: File) => {
    setError(null);
    setIsLoading(true);
    setMissingFields(null);
    setExtractedData(null);
    setMissingValues({});
    setSelectedFile(file);

    try {
      const result = await apiProcess106(file);
      if (!result.success) throw new Error(result.error || "שגיאה לא ידועה");

      setExtractedData(result.data);

      if (result.missingFields && result.missingFields.length > 0) {
        setMissingFields(result.missingFields);
      } else {
        // All data extracted successfully
        // Preserve taxYear from extraction when valid; otherwise default to last year
        const extractedYear = Number(result.data.taxYear);
        const boundedExtractedYear = !Number.isNaN(extractedYear)
          ? Math.max(
              Math.min(extractedYear, new Date().getFullYear() - 1),
              new Date().getFullYear() - 6,
            )
          : new Date().getFullYear() - 1;

        setTaxData({
          income: Number(result.data.income) || 0,
          taxPaid: Number(result.data.taxPaid) || 0,
          taxCredits: Number(result.data.creditPoints) || 2.25,
          hasFormData: true,
          maritalStatus: String(result.data.maritalStatus || "single"),
          taxYear: boundedExtractedYear,
          gender: result.data.gender,
          employmentType: result.data.employmentType,
          children: Number(result.data.children) || 0,
          birthDate: result.data.birthDate,
          workStartDate: result.data.workStartDate,
          workEndDate: result.data.workEndDate,
          additionalIncome: Number(result.data.additionalIncome) || 0,
          oldAgeAllowance: Number(result.data.oldAgeAllowance) || 0,
          childAllowance: Number(result.data.childAllowance) || 0,
          disabilityAllowance: Number(result.data.disabilityAllowance) || 0,
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          email: result.data.email,
          phone: result.data.phone,
          address: result.data.address,
          city: result.data.city,
          postalCode: result.data.postalCode,
          ...result.data, // הוספת כל הנתונים הנוספים
        });
        setToast({
          type: "success",
          message: "הקובץ עובד בהצלחה! מעבר לחישוב התוצאות...",
        });
        setTimeout(() => {
          console.log("🚀 UploadForm calling goToNextStep");
          goToNextStep();
        }, 1500);
      }
    } catch (err) {
      setError((err as Error).message);
      setToast({ type: "error", message: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMissingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚀 UploadForm handleMissingSubmit called");
    if (!extractedData) {
      console.log("❌ No extractedData, returning");
      return;
    }

    const finalData = { ...extractedData, ...missingValues };
    // Ensure taxYear is preserved exactly as entered by the user when valid
    const numericYear = Number(finalData.taxYear);
    const boundedYear = !Number.isNaN(numericYear)
      ? Math.max(
          Math.min(numericYear, new Date().getFullYear() - 1),
          new Date().getFullYear() - 6,
        )
      : undefined;
    console.log("📝 Final data:", finalData);

    const newTaxData = {
      income: Number(finalData.income) || 0,
      taxPaid: Number(finalData.taxPaid) || 0,
      taxCredits: Number(finalData.creditPoints) || 2.25,
      hasFormData: true,
      maritalStatus: String(finalData.maritalStatus || "single"),
      taxYear: boundedYear ?? new Date().getFullYear() - 1,
      gender: finalData.gender,
      employmentType: finalData.employmentType,
      children: Number(finalData.children) || 0,
      birthDate: finalData.birthDate,
      workStartDate: finalData.workStartDate,
      workEndDate: finalData.workEndDate,
      additionalIncome: Number(finalData.additionalIncome) || 0,
      oldAgeAllowance: Number(finalData.oldAgeAllowance) || 0,
      childAllowance: Number(finalData.childAllowance) || 0,
      disabilityAllowance: Number(finalData.disabilityAllowance) || 0,
      firstName: finalData.firstName,
      lastName: finalData.lastName,
      email: finalData.email,
      phone: finalData.phone,
      address: finalData.address,
      city: finalData.city,
      postalCode: finalData.postalCode,
      ...finalData, // הוספת כל הנתונים הנוספים
    };

    console.log("📝 Setting taxData in UploadForm:", newTaxData);
    setTaxData(newTaxData as unknown as TaxData);

    setToast({
      type: "success",
      message: "המידע נשמר בהצלחה! מעבר לחישוב התוצאות...",
    });

    console.log("🚀 Moving to next step...");
    setTimeout(() => {
      console.log("🚀 About to call goToNextStep");
      goToNextStep();
      console.log("✅ goToNextStep called");
    }, 1500);
  };

  const handleManualEntry = () => {
    console.log("🚀 UploadForm handleManualEntry called");
    const manualTaxData = {
      income: 0,
      taxPaid: 0,
      taxCredits: 2.25,
      hasFormData: false,
    };
    console.log("📝 Setting manual taxData:", manualTaxData);
    setTaxData(manualTaxData);
    console.log("🚀 Calling goToNextStep from handleManualEntry");
    goToNextStep();
  };

  const handleValueChange = (id: string, value: string | number | boolean) => {
    console.log("handleValueChange:", id, value);
    setMissingValues((prev) => ({
      ...prev,
      [id]: typeof value === "boolean" ? String(value) : value,
    }));
  };

  // If missing fields, show dynamic form
  if (missingFields && missingFields.length > 0 && extractedData) {
    return (
      <>
        <MissingDataForm
          extractedData={extractedData}
          missingValues={missingValues}
          onValueChange={handleValueChange}
          onSubmit={handleMissingSubmit}
        />
        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Hero */}

        {/* Tips box – smaller and centered */}
        <div className="bg-card text-card-foreground rounded-3xl shadow-md border border-border px-4 sm:px-5 py-4">
          <UploadTips />
        </div>

        {/* Upload box – smaller and centered */}
        <div className="bg-card text-card-foreground rounded-3xl shadow-xl border border-border px-5 sm:px-6 py-6 sm:py-7">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
              <Upload className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              העלאת טופס 106
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              בחר/י טופס 106 או גרור/י לכאן, ואז המשך לשלב הבא.
            </p>
          </div>

          {/* Upload content */}
          <div className="max-w-lg mx-auto space-y-4">
            <UploadDropzone
              onFileUpload={handleFileUpload}
              isLoading={isLoading}
              selectedFile={selectedFile}
              onOpenReady={(open) => {
                openPickerRef.current = open;
              }}
            />

            {selectedFile && !isLoading && !missingFields ? (
              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  onClick={handleManualEntry}
                  className="h-11 sm:h-12 btn-secondary rounded-xl flex items-center justify-center gap-2"
                >
                  <Pencil className="h-5 w-5" />
                  הזנה ידנית
                </button>
                <button
                  onClick={() => goToNextStep()}
                  className="h-11 sm:h-12 btn-primary rounded-xl flex items-center justify-center gap-2"
                >
                  <ArrowRight className="h-5 w-5" />
                  המשך לשלב הבא
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <button
                  onClick={handleManualEntry}
                  className="h-11 sm:h-12 btn-secondary rounded-xl flex items-center justify-center gap-2 px-6"
                >
                  <Pencil className="h-5 w-5" />
                  הזנה ידנית
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress Modal */}
      <UploadProgress isLoading={isLoading} error={error} success={false} />

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};
