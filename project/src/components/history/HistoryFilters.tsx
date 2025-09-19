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
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Search className="h-4 w-4 text-blue-600" />
            חיפוש
          </label>
          <input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="שם קובץ..."
            className="input-field-enhanced w-full"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            שנה
          </label>
          <input
            value={year}
            onChange={(e) => onYearChange(e.target.value)}
            placeholder="2024"
            className="input-field-enhanced w-32"
          />
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={onApplyFilters}
        >
          <Filter className="h-4 w-4" />
          סינון
        </button>
      </div>
    </div>
  );
};
