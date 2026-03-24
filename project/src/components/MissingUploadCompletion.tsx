import React, { useCallback, useState } from "react";
import {
  useTaxCalculator,
  defaultTaxData,
  type TaxData,
} from "../context/TaxCalculatorContext";
import { MissingDataForm } from "./features/upload/MissingDataForm";
import { validateRequiredTaxCalculationFields } from "../utils/taxFormValidation";
import { mergeMissingUploadFieldValues } from "../utils/mergeMissingUploadFieldValues";
import Toast from "./Toast";

export const MissingUploadCompletion: React.FC = () => {
  const {
    pendingMissingUpload,
    patchPendingMissingUploadField,
    setPendingMissingUpload,
    setTaxData,
    goToNextStep,
    goToPreviousStep,
  } = useTaxCalculator();

  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleValueChange = useCallback(
    (id: string, value: string | number | boolean) => {
      setSubmitAttempted(false);
      setFieldErrors({});
      patchPendingMissingUploadField(id, value);
    },
    [patchPendingMissingUploadField]
  );

  if (!pendingMissingUpload) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { extractedData, missingValues } = pendingMissingUpload;
    const merged = mergeMissingUploadFieldValues(extractedData, missingValues);

    const validationErrors = validateRequiredTaxCalculationFields({
      income: merged.income,
      taxPaid: merged.taxPaid,
      taxYear: merged.taxYear,
      maritalStatus: merged.maritalStatus,
    });

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setSubmitAttempted(true);
      return;
    }

    const numericYear = Number(merged.taxYear);
    const boundedYear = !Number.isNaN(numericYear)
      ? Math.max(
          Math.min(numericYear, new Date().getFullYear() - 1),
          new Date().getFullYear() - 6,
        )
      : undefined;

    const newTaxData = {
      ...defaultTaxData,
      ...merged,
      income: Number(merged.income) || 0,
      taxPaid: Number(merged.taxPaid) || 0,
      taxCredits: Number(merged.taxCredits) || 2.25,
      maritalStatus: String(merged.maritalStatus || "single"),
      taxYear: boundedYear ?? new Date().getFullYear() - 1,
      gender: merged.gender,
      employmentType: merged.employmentType,
      children: Number(merged.children) || 0,
      birthDate: merged.birthDate,
      workStartDate: merged.workStartDate,
      workEndDate: merged.workEndDate,
      additionalIncome: Number(merged.additionalIncome) || 0,
      oldAgeAllowance: Number(merged.oldAgeAllowance) || 0,
      childAllowance: Number(merged.childAllowance) || 0,
      disabilityAllowance: Number(merged.disabilityAllowance) || 0,
      firstName: merged.firstName,
      lastName: merged.lastName,
      email: merged.email,
      phone: merged.phone,
      address: merged.address,
      city: merged.city,
      postalCode: merged.postalCode,
      dataSource: "upload" as const,
      hasFormData: true,
    };

    setSubmitAttempted(false);
    setFieldErrors({});
    setPendingMissingUpload(null);
    setTaxData(newTaxData as TaxData);
    setToast({
      type: "success",
      message: "המידע נשמר בהצלחה! מעבר לחישוב התוצאות...",
    });
    setTimeout(() => {
      goToNextStep();
    }, 1500);
  };

  const handleBack = () => {
    setSubmitAttempted(false);
    setFieldErrors({});
    setPendingMissingUpload(null);
    goToPreviousStep();
  };

  return (
    <>
      <MissingDataForm
        extractedData={pendingMissingUpload.extractedData}
        missingValues={pendingMissingUpload.missingValues}
        onValueChange={handleValueChange}
        onSubmit={handleSubmit}
        onBack={handleBack}
        fieldErrors={fieldErrors}
        showFieldErrors={submitAttempted}
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
};
