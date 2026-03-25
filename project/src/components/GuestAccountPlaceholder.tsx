import React from "react";
import { UserRound } from "lucide-react";

/** פרופיל / הגדרות — זמין רק אחרי התחברות (מצב אורח) */
export const GuestAccountPlaceholder: React.FC<{ title: string }> = ({
  title,
}) => {
  return (
    <div
      className="max-w-lg mx-auto rounded-2xl border border-[#e8eaf2] bg-white p-8 shadow-sm text-center space-y-4"
      dir="rtl"
    >
      <div className="flex justify-center">
        <div className="h-14 w-14 rounded-2xl bg-[#E6E9FF] flex items-center justify-center">
          <UserRound className="h-7 w-7 text-[#006D4E]" />
        </div>
      </div>
      <h1 className="text-xl font-bold text-[#131b2e]">{title}</h1>
      <p className="text-sm text-[#64748b] leading-relaxed">
        במצב אורח אין חשבון שמור. התחבר כדי לנהל פרופיל, הגדרות והיסטוריית דוחות —
        הנתונים האישיים נשמרים רק אחרי התחברות.
      </p>
      <button
        type="button"
        className="px-6 py-2.5 rounded-xl bg-[#006D4E] text-white text-sm font-semibold hover:bg-[#005a40]"
        onClick={() => window.dispatchEvent(new CustomEvent("open-auth"))}
      >
        התחברות
      </button>
    </div>
  );
};
