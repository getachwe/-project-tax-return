import React from "react";

type Variant = "neutral" | "success" | "warning" | "danger" | "info" | "process";

const styles: Record<Variant, string> = {
  neutral: "bg-muted text-foreground border-border",
  success: "bg-emerald-50 text-[#006D4E] border-emerald-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  danger: "bg-rose-100 text-rose-800 border-rose-200",
  info: "bg-sky-100 text-sky-800 border-sky-200",
  process: "bg-rose-50 text-rose-700 border-rose-200",
};

export const StatusBadge: React.FC<{
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}> = ({ variant = "neutral", children, className }) => {
  return (
    <span
      className={[
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
        styles[variant],
        className || "",
      ].join(" ")}
    >
      {children}
    </span>
  );
};

