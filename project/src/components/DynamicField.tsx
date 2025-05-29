import React from "react";
import { Tooltip } from "./Tooltip";

interface Option {
  value: string;
  label: string;
}

interface DynamicFieldProps {
  id: string;
  label: string;
  tooltip?: string;
  type: "text" | "number" | "date" | "select" | "checkbox";
  value: string | number | boolean;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
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

export const DynamicField: React.FC<DynamicFieldProps> = ({
  id,
  label,
  tooltip,
  type,
  value,
  onChange,
  options,
  required,
  error,
  disabled,
  readOnly,
  min,
  max,
  step,
  className = "",
}) => {
  const inputBase =
    "input-field focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition border rounded px-3 py-2 w-full disabled:bg-gray-100 disabled:cursor-not-allowed" +
    (error ? " border-red-500" : " border-gray-300") +
    (className ? ` ${className}` : "");

  return (
    <div className="mb-4">
      <div className="flex items-center gap-1">
        <label htmlFor={id} className="form-label">
          {label}
        </label>
        {tooltip && <Tooltip content={tooltip} />}
      </div>
      {type === "select" && options ? (
        <select
          id={id}
          name={id}
          aria-label={label}
          className={inputBase}
          value={typeof value === "boolean" ? "" : value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        >
          <option value="">בחר/י...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === "date" ? (
        <input
          id={id}
          name={id}
          type="date"
          aria-label={label}
          className={inputBase}
          value={typeof value === "boolean" ? "" : value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          min={min}
          max={max}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      ) : type === "checkbox" ? (
        <input
          id={id}
          name={id}
          type="checkbox"
          aria-label={label}
          className={
            "h-4 w-4 text-blue-600 border-gray-300 rounded ml-2 focus:ring-2 focus:ring-blue-400 transition" +
            (error ? " border-red-500" : " border-gray-300")
          }
          checked={!!value}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      ) : (
        <input
          id={id}
          name={id}
          type={type}
          aria-label={label}
          className={inputBase + (type === "number" ? " text-right" : "")}
          value={typeof value === "boolean" ? "" : value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          min={min}
          max={max}
          step={step}
          dir={type === "number" ? "rtl" : undefined}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      )}
      {error && (
        <div id={`${id}-error`} className="text-xs text-red-600 mt-1">
          {error}
        </div>
      )}
    </div>
  );
};
