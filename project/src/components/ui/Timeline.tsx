import React from "react";

export type TimelineItem = {
  title: string;
  date?: string;
  description?: string;
  status?: "done" | "active" | "pending";
};

export const Timeline: React.FC<{ items: TimelineItem[] }> = ({ items }) => {
  return (
    <div className="space-y-4">
      {items.map((it, idx) => (
        <div key={idx} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className={[
                "h-3.5 w-3.5 rounded-full border",
                it.status === "done"
                  ? "bg-emerald-500 border-emerald-500"
                  : it.status === "active"
                  ? "bg-sky-500 border-sky-500"
                  : "bg-card border-border",
              ].join(" ")}
            />
            {idx < items.length - 1 && (
              <div className="w-px flex-1 bg-border mt-1" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-foreground">
                {it.title}
              </div>
              {it.date && (
                <div className="text-xs text-muted-foreground">{it.date}</div>
              )}
            </div>
            {it.description && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {it.description}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

