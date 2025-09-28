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
  min?: number;
  max?: number;
}

interface DynamicFormProps {
  fields: DynamicFormField[];
  values: Record<string, string | number | undefined>;
  onChange: (id: string, value: string | number | boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  values,
  onChange,
  onSubmit,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    console.log("DynamicForm form submitted");
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6">
        {fields.map((field) => (
          <DynamicField
            key={field.id}
            id={field.id}
            label={field.label}
            tooltip={field.tooltip}
            type={field.type}
            value={values[field.id] ?? ""}
            onChange={(e) => {
              console.log("DynamicForm onChange:", field.id, e.target.value);
              onChange(field.id, e.target.value);
            }}
            options={field.options}
            required={field.required}
            min={field.min}
            max={field.max}
          />
        ))}
      </div>

      <div className="flex justify-center pt-6">
        <button
          type="submit"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
        >
          המשך לחישוב
        </button>
      </div>
    </form>
  );
};
