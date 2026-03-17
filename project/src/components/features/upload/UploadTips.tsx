import React from "react";
import { FileText, Camera } from "lucide-react";

export const UploadTips: React.FC = () => {
  const tips = [
    {
      icon: FileText,
      title: "קובץ חד וברור",
      description: "העלה קובץ PDF מקורי או סריקה באיכות טובה",
    },
    {
      icon: Camera,
      title: "צילום מלא של הטופס",
      description: "ודא שכל שורות הטופס מופיעות בתמונה בלי חיתוכים",
    },
  ];

  return (
    <details className="group" dir="rtl">
      <summary className="cursor-pointer select-none list-none flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">
            טיפים להעלאה (אופציונלי)
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            2 טיפים קטנים שיעזרו לחילוץ להיות מדויק יותר
          </div>
        </div>
        <span className="text-xs text-muted-foreground group-open:hidden">
          הצג
        </span>
        <span className="text-xs text-muted-foreground hidden group-open:inline">
          הסתר
        </span>
      </summary>

      <div className="mt-3 space-y-2">
        {tips.map((tip, index) => {
          const IconComponent = tip.icon;
          return (
            <div
              key={index}
              className="flex items-start gap-2.5 p-2.5 bg-muted/40 border border-border rounded-xl"
            >
              <div className="flex-shrink-0 w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200">
                <IconComponent className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-foreground text-xs mb-0.5">
                  {tip.title}
                </div>
                <div className="text-muted-foreground text-xs leading-relaxed">
                  {tip.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </details>
  );
};
