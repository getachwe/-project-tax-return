import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  useTaxCalculator,
  defaultTaxData,
  type TaxData,
} from "../context/TaxCalculatorContext";
import { MissingDataForm } from "./features/upload/MissingDataForm";
import { validateRequiredTaxCalculationFields } from "../utils/taxFormValidation";
import {
  mergeMissingUploadFieldValues,
  coerceBool,
} from "../utils/mergeMissingUploadFieldValues";
import { defaultFilingStatusFromMarital } from "../utils/intakeFilingDefaults";
import Toast from "./Toast";

export const MissingUploadCompletion: React.FC = () => {
  const {
    pendingMissingUpload,
    patchPendingMissingUploadField,
    setPendingMissingUpload,
    setTaxData,
    goToNextStep,
    goToPreviousStep,
    taxData,
  } = useTaxCalculator();

  const omitChildFields = taxData.hasChildren === false;

  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const submitLockRef = useRef(false);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current != null) {
        clearTimeout(advanceTimeoutRef.current);
        advanceTimeoutRef.current = null;
      }
      submitLockRef.current = false;
    };
  }, []);

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
    if (submitLockRef.current) return;
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

    submitLockRef.current = true;

    const numericYear = Number(merged.taxYear);
    const boundedYear = !Number.isNaN(numericYear)
      ? Math.max(
          Math.min(numericYear, new Date().getFullYear() - 1),
          new Date().getFullYear() - 6,
        )
      : undefined;

    const maritalResolved = String(
      merged.maritalStatus || taxData.maritalStatus || "single",
    );
    const filingResolved =
      merged.filingStatus === "joint" || merged.filingStatus === "single"
        ? merged.filingStatus
        : defaultFilingStatusFromMarital(maritalResolved);
    const newTaxData = {
      ...defaultTaxData,
      intakeCompleted: taxData.intakeCompleted ?? true,
      hasChildren: taxData.hasChildren,
      incomeType: taxData.incomeType,
      ...merged,
      maritalStatus: maritalResolved,
      filingStatus: filingResolved,
      income: Number(merged.income) || 0,
      taxPaid: Number(merged.taxPaid) || 0,
      taxCredits: Number(merged.taxCredits) || 2.25,
      taxYear: boundedYear ?? new Date().getFullYear() - 1,
      gender: merged.gender,
      employmentType: merged.employmentType,
      children: omitChildFields
        ? 0
        : Number(merged.children) || 0,
      birthDate: merged.birthDate,
      workStartDate: merged.workStartDate,
      workEndDate: merged.workEndDate,
      additionalIncome: Number(merged.additionalIncome) || 0,
      oldAgeAllowance: Number(merged.oldAgeAllowance) || 0,
      childAllowance: omitChildFields
        ? 0
        : Number(merged.childAllowance) || 0,
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
      academicDegree: coerceBool(merged.academicDegree),
      newImmigrant: coerceBool(merged.newImmigrant),
      livingInPeriphery: coerceBool(merged.livingInPeriphery),
      yearsSinceAliyah: Number(merged.yearsSinceAliyah) || 0,
      ...(filingResolved === "single"
        ? { spouseIncome: 0, spouseTaxPaid: 0 }
        : {}),
    };

    setSubmitAttempted(false);
    setFieldErrors({});
    setPendingMissingUpload(null);
    setTaxData(newTaxData as TaxData);
    setToast({
      type: "success",
      message: "המידע נשמר בהצלחה! מעבר לחישוב התוצאות...",
    });
    if (advanceTimeoutRef.current != null) {
      clearTimeout(advanceTimeoutRef.current);
    }
    advanceTimeoutRef.current = window.setTimeout(() => {
      advanceTimeoutRef.current = null;
      goToNextStep();
      submitLockRef.current = false;
    }, 1500);
  };

  const handleBack = () => {
    submitLockRef.current = false;
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
        omitChildFields={omitChildFields}
        incomeType={taxData.incomeType}
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
