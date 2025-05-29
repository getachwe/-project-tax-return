import React from "react";
import { DynamicField } from "./DynamicField";

interface Option {
  value: string;
  label: string;
}

export interface DynamicFormField {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "checkbox";
  tooltip?: string;
  options?: Option[];
  required?: boolean;
  error?: string;
  disabled?: boolean;
  readOnly?: boolean;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  className?: string;
}

interface DynamicFormProps {
  fields: DynamicFormField[];
  values: Record<string, any>;
  onChange: (id: string, value: any) => void;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  submitLabel?: string;
  className?: string;
  errors?: Record<string, string>;
  disabled?: boolean;
  readOnly?: boolean;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  values,
  onChange,
  onSubmit,
  submitLabel = "שלח/י",
  className = "",
  errors = {},
  disabled = false,
  readOnly = false,
}) => {
  return (
    <form onSubmit={onSubmit} className={`space-y-2 ${className}`}>
      {fields.map((field) => (
        <DynamicField
          key={field.id}
          id={field.id}
          label={field.label}
          tooltip={field.tooltip}
          type={field.type}
          value={values[field.id] ?? ""}
          onChange={(e) => {
            const value =
              field.type === "checkbox"
                ? (e.target as HTMLInputElement).checked
                : e.target.value;
            onChange(field.id, value);
          }}
          options={field.options}
          required={field.required}
          error={field.error || errors[field.id]}
          disabled={field.disabled ?? disabled}
          readOnly={field.readOnly ?? readOnly}
          min={field.min}
          max={field.max}
          step={field.step}
          className={field.className}
        />
      ))}
      {onSubmit && (
        <button
          type="submit"
          className="btn btn-primary w-full mt-4"
          disabled={disabled}
        >
          {submitLabel}
        </button>
      )}
    </form>
  );
};
