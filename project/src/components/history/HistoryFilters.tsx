import React from "react";
import { Search, Calendar, Filter } from "lucide-react";

interface HistoryFiltersProps {
  searchTerm: string;
  year: string;
  onSearchChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onApplyFilters: () => void;
}

export const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  searchTerm,
  year,
  onSearchChange,
  onYearChange,
  onApplyFilters,
}) => {
  return (
    <div className="bg-white rounded-xl border border-[#e8eaf2] shadow-sm p-5 mb-6">
      <div className="flex flex-col md:flex-row items-end gap-4">
        <div className="flex-1 w-full">
          <label className="flex items-center gap-2 text-sm font-bold text-[#3c4a42] mb-2">
            <Search className="h-4 w-4 text-primary" />
            חיפוש
          </label>
          <input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="שם קובץ..."
            className="input-field-enhanced w-full"
          />
        </div>
        <div className="w-full md:w-32">
          <label className="flex items-center gap-2 text-sm font-bold text-[#3c4a42] mb-2">
            <Calendar className="h-4 w-4 text-primary" />
            שנה
          </label>
          <input
            value={year}
            onChange={(e) => onYearChange(e.target.value)}
            placeholder={`${new Date().getFullYear() - 1}`}
            className="input-field-enhanced w-full md:w-32"
          />
        </div>
        <div className="w-full md:w-auto">
          <button
            className="btn-primary w-full md:w-auto flex items-center justify-center gap-2"
            onClick={onApplyFilters}
          >
            <Filter className="h-4 w-4" />
            סינון
          </button>
        </div>
      </div>
    </div>
  );
};
