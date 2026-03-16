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
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-foreground">טיפים להעלאת הקובץ</h3>
      <div className="space-y-2">
        {tips.map((tip, index) => {
          const IconComponent = tip.icon;
          return (
            <div
              key={index}
              className="flex items-start gap-2.5 p-2.5 bg-card border border-border rounded-xl text-sm"
            >
              <div className="flex-shrink-0 w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                <IconComponent className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-foreground text-xs mb-0.5">
                  {tip.title}
                </h4>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {tip.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
