import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HistoryPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const HistoryPagination: React.FC<HistoryPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  if (totalItems === 0) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-[#e8eaf2]"
      dir="rtl"
    >
      <p className="text-sm text-[#64748b] order-2 sm:order-1">
        מציג {start.toLocaleString("he-IL")}–{end.toLocaleString("he-IL")} מתוך{" "}
        {totalItems.toLocaleString("he-IL")} בקשות
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-2 order-1 sm:order-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium border border-[#e8eaf2] bg-white text-[#131b2e] hover:bg-[#E6E9FF]/50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            הבא
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium border border-[#e8eaf2] bg-white text-[#131b2e] hover:bg-[#E6E9FF]/50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            הקודם
          </button>
        </div>
      )}
    </div>
  );
};
