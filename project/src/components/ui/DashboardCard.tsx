import React from "react";

export const DashboardCard: React.FC<{
  title?: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}> = ({ title, subtitle, rightSlot, children, className, contentClassName }) => {
  return (
    <div
      className={[
        "bg-card/90 text-card-foreground backdrop-blur rounded-xl border border-border shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] hover:shadow-md transition-shadow",
        className || "",
      ].join(" ")}
    >
      {(title || subtitle || rightSlot) && (
        <div className="px-6 pt-6 pb-4 border-b border-border flex items-start justify-between gap-3">
          <div>
            {title && (
              <div className="text-sm font-semibold text-foreground">{title}</div>
            )}
            {subtitle && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {subtitle}
              </div>
            )}
          </div>
          {rightSlot && <div className="shrink-0">{rightSlot}</div>}
        </div>
      )}
      <div className={["p-6", contentClassName || ""].join(" ")}>
        {children}
      </div>
    </div>
  );
};
