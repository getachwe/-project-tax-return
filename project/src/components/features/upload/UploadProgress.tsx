import React from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface UploadProgressProps {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  isLoading,
  error,
  success,
}) => {
  if (!isLoading && !error && !success) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        {isLoading && (
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              מעבד קובץ
            </h3>
            <p className="text-gray-600 text-sm">
              אנא המתן בזמן שאנחנו מנתחים את הטופס...
            </p>
          </div>
        )}

        {error && (
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              שגיאה בעיבוד
            </h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              נסה שוב
            </button>
          </div>
        )}

        {success && (
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              הקובץ עובד בהצלחה!
            </h3>
            <p className="text-gray-600 text-sm">המידע נחלץ בהצלחה מהטופס</p>
          </div>
        )}
      </div>
    </div>
  );
};
