import React from "react";
import { CheckCircle2, FileText, UploadCloud } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

export type ActivityItem = {
  title: string;
  date?: string;
  statusLabel?: string;
  statusVariant?: "neutral" | "success" | "warning" | "danger" | "info";
  icon?: "upload" | "file" | "check";
};

const iconMap = {
  upload: UploadCloud,
  file: FileText,
  check: CheckCircle2,
};

export const ActivityList: React.FC<{ items: ActivityItem[] }> = ({ items }) => {
  return (
    <div className="space-y-3">
      {items.map((it, idx) => {
        const Icon = iconMap[it.icon || "file"];
        return (
          <div
            key={idx}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/70 px-3 py-2"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {it.title}
                </div>
                {it.date && (
                  <div className="text-xs text-muted-foreground">{it.date}</div>
                )}
              </div>
            </div>
            {it.statusLabel && (
              <StatusBadge variant={it.statusVariant || "neutral"}>
                {it.statusLabel}
              </StatusBadge>
            )}
          </div>
        );
      })}
    </div>
  );
};

