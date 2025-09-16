import React from "react";
import { Tooltip } from "../Tooltip";
import {
  Mail,
  Lock,
  Calendar,
  Hash,
  FileText,
  DollarSign,
  Users,
  Baby,
  Building2,
} from "lucide-react";

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
  // פונקציה לקבלת אייקון לפי סוג השדה
  const getFieldIcon = (fieldId: string, fieldType: string) => {
    if (!fieldId) return <FileText className="h-4 w-4 text-gray-400" />;
    if (fieldId.includes("email") || fieldId.includes("mail"))
      return <Mail className="h-4 w-4 text-gray-400" />;
    if (fieldId.includes("password") || fieldId.includes("סיסמה"))
      return <Lock className="h-4 w-4 text-gray-400" />;
    if (fieldId.includes("date") || fieldId.includes("תאריך"))
      return <Calendar className="h-4 w-4 text-gray-400" />;
    if (
      fieldId.includes("income") ||
      fieldId.includes("הכנסה") ||
      fieldId.includes("tax")
    )
      return <DollarSign className="h-4 w-4 text-gray-400" />;
    if (fieldId.includes("children") || fieldId.includes("ילדים"))
      return <Baby className="h-4 w-4 text-gray-400" />;
    if (fieldId.includes("employment") || fieldId.includes("עבודה"))
      return <Building2 className="h-4 w-4 text-gray-400" />;
    if (fieldId.includes("marital") || fieldId.includes("משפחה"))
      return <Users className="h-4 w-4 text-gray-400" />;
    if (fieldType === "number")
      return <Hash className="h-4 w-4 text-gray-400" />;
    return <FileText className="h-4 w-4 text-gray-400" />;
  };

  const inputBase =
    "input-field-enhanced focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 border rounded-lg pl-10 pr-4 py-3 w-full disabled:bg-gray-100 disabled:cursor-not-allowed text-sm" +
    (error ? " border-red-500 bg-red-50" : " border-gray-300 bg-white") +
    (className ? ` ${className}` : "");

  return (
    <div className="mb-5">
      <div className="flex items-center gap-1 mb-2">
        <label
          htmlFor={id}
          className="form-label text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {tooltip && <Tooltip content={tooltip} />}
      </div>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {getFieldIcon(id, type)}
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
          <div className="flex items-center gap-3">
            <input
              id={id}
              name={id}
              type="checkbox"
              aria-label={label}
              className={
                "h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-400 transition-all duration-200" +
                (error ? " border-red-500" : " border-gray-300")
              }
              checked={!!value}
              onChange={onChange}
              disabled={disabled}
              aria-invalid={!!error}
              aria-describedby={error ? `${id}-error` : undefined}
            />
            <label
              htmlFor={id}
              className="text-sm text-gray-700 cursor-pointer"
            >
              {label}
            </label>
          </div>
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
      </div>
      {error && (
        <div id={`${id}-error`} className="text-xs text-red-600 mt-1">
          {error}
        </div>
      )}
    </div>
  );
};
