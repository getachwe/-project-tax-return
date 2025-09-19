import React from "react";
import { Download, Eye, Trash2, Mail, Loader2 } from "lucide-react";
import { ReportItem } from "../../utils/api";

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
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="mr-3 text-gray-600">טוען דוחות...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">אין דוחות להצגה</div>
        <div className="text-gray-400 text-sm mt-2">הדוחות שלך יופיעו כאן</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {item.file_name}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">שנת מס:</span>{" "}
                  {item.year || "-"}
                </div>
                <div>
                  <span className="font-medium">תאריך יצירה:</span>{" "}
                  {new Date(item.created_at).toLocaleDateString("he-IL")}
                </div>
                <div>
                  <span className="font-medium">מס ששולם:</span> ₪
                  {(
                    item.calculationResult?.taxPaid ||
                    item.taxData?.taxPaid ||
                    0
                  ).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">החזר מס:</span> ₪
                  {(item.calculationResult?.refund || 0).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => onDownload(item.id)}
                disabled={downloadingIds.has(item.id)}
                className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
              >
                {downloadingIds.has(item.id) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                הורדה
              </button>
              <button
                onClick={() => onViewReport(item.id)}
                disabled={viewingIds.has(item.id)}
                className="btn-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
              >
                {viewingIds.has(item.id) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                צפה
              </button>
              <button
                onClick={() => onSendEmail(item)}
                disabled={emailingIds.has(item.id)}
                className="bg-green-100 text-green-700 hover:bg-green-200 flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                {emailingIds.has(item.id) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                שלח למייל
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                מחיקה
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
