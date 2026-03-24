import React from "react";
import {
  Download,
  ExternalLink,
  Loader2,
  Mail,
  Trash2,
} from "lucide-react";
import { ReportItem } from "../../utils/api";
import { StatusBadge } from "../ui/StatusBadge";

interface HistoryListProps {
  items: ReportItem[];
  loading: boolean;
  onDownload: (id: string) => void;
  onViewReport: (id: string) => void;
  onDelete: (id: string) => void;
  onSendEmail: (item: ReportItem) => void;
  downloadingIds: Set<string>;
  viewingIds: Set<string>;
  emailingIds: Set<string>;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  items,
  loading,
  onDownload,
  onViewReport,
  onDelete,
  onSendEmail,
  downloadingIds,
  viewingIds,
  emailingIds,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16 gap-3 text-[#64748b]">
        <Loader2 className="h-8 w-8 animate-spin text-[#006D4E]" />
        <span>טוען דוחות...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 rounded-xl border border-dashed border-[#d8dcf0] bg-white/50">
        <p className="text-[#131b2e] font-semibold">אין דוחות להצגה</p>
        <p className="text-sm text-[#64748b] mt-2">
          הדוחות שלך יופיעו כאן לאחר חישוב
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#e8eaf2] bg-white shadow-sm">
      <table className="w-full text-right text-sm min-w-[640px]">
        <thead>
          <tr className="bg-[#f8f9fc] text-[#64748b] text-xs font-semibold uppercase tracking-wide border-b border-[#e8eaf2]">
            <th className="px-4 py-3 font-semibold">תאריך</th>
            <th className="px-4 py-3 font-semibold">שנת מס</th>
            <th className="px-4 py-3 font-semibold">סכום החזר</th>
            <th className="px-4 py-3 font-semibold">סטטוס</th>
            <th className="px-4 py-3 font-semibold text-left">פעולות</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e8eaf2]">
          {items.map((item) => {
            const refundVal = Number(
              (item.calculationResult as { refund?: number })?.refund ?? 0
            );
            const approved = refundVal >= 0;
            const statusLabel = approved ? "אושר" : "בטיפול";
            const statusVariant = approved ? "success" : "process";

            const downloadBusy = downloadingIds.has(item.id);

            return (
              <tr
                key={item.id}
                className="hover:bg-[#E6E9FF]/25 transition-colors"
              >
                <td className="px-4 py-4 text-[#131b2e] whitespace-nowrap">
                  {new Date(item.created_at).toLocaleDateString("he-IL")}
                </td>
                <td className="px-4 py-4 font-medium text-[#131b2e]">
                  {item.year ?? "—"}
                </td>
                <td className="px-4 py-4 font-extrabold text-[#006D4E] tabular-nums">
                  {Math.round(refundVal).toLocaleString("he-IL")} ₪
                </td>
                <td className="px-4 py-4">
                  <StatusBadge variant={statusVariant}>{statusLabel}</StatusBadge>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onDownload(item.id)}
                      disabled={downloadBusy}
                      title="הורד PDF"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#E6E9FF] text-[#131b2e] hover:bg-[#dce0fa] border border-[#d8dcf0] disabled:opacity-45 disabled:pointer-events-none transition-colors"
                    >
                      {downloadBusy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      הורד PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => onViewReport(item.id)}
                      disabled={viewingIds.has(item.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#006D4E] text-white hover:bg-[#005a40] disabled:opacity-50 transition-colors"
                    >
                      {viewingIds.has(item.id) ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ExternalLink className="h-3.5 w-3.5" />
                      )}
                      פתח בדשבורד
                    </button>
                    <button
                      type="button"
                      onClick={() => onSendEmail(item)}
                      disabled={emailingIds.has(item.id)}
                      className="inline-flex items-center justify-center p-2 rounded-lg text-[#006D4E] hover:bg-[#E6E9FF]/80 transition-colors disabled:opacity-50"
                      aria-label="שליחה במייל"
                      title="שלח במייל"
                    >
                      {emailingIds.has(item.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      className="inline-flex items-center justify-center p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                      aria-label="מחיקה"
                      title="מחק דוח"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
