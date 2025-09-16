import React, { useState } from "react";
import { Pencil } from "lucide-react";
import { DynamicForm, DynamicFormField } from "../../forms/DynamicForm";
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
  console.log("MissingDataForm values:", values);

  return (
    <div className="space-y-8 p-6">
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

      <DynamicForm
        fields={fields}
        values={values}
        onChange={onValueChange}
        onSubmit={onSubmit}
      />
    </div>
  );
};
