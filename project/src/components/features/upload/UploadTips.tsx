import React from "react";
import { FileText, Camera, Shield, Clock } from "lucide-react";

export const UploadTips: React.FC = () => {
  const tips = [
    {
      icon: FileText,
      title: "קבצי PDF",
      description: "הטופס המקורי שקבלת מהמעביד",
    },
    {
      icon: Camera,
      title: "תמונות",
      description: "צילום ברור של הטופס",
    },
    {
      icon: Shield,
      title: "אבטחה",
      description: "המידע מוצפן ולא נשמר",
    },
    {
      icon: Clock,
      title: "מהיר",
      description: "עיבוד תוך שניות ספורות",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">טיפים להעלאה</h3>
      <div className="space-y-3">
        {tips.map((tip, index) => {
          const IconComponent = tip.icon;
          return (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <IconComponent className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">
                  {tip.title}
                </h4>
                <p className="text-gray-600 text-xs leading-relaxed">
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
