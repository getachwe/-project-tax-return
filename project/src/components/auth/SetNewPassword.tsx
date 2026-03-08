import React, { useState } from "react";
import { Lock } from "lucide-react";
import { apiUpdatePassword } from "../../utils/api";

interface SetNewPasswordProps {
  accessToken: string;
  onSuccess: () => void;
}

export const SetNewPassword: React.FC<SetNewPasswordProps> = ({
  accessToken,
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit =
    newPassword.length >= 6 &&
    newPassword === confirmPassword &&
    !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setLoading(true);
      setMessage(null);
      await apiUpdatePassword(accessToken, newPassword);
      setMessage("הסיסמה עודכנה בהצלחה! ניתן להתחבר עכשיו");
      setTimeout(() => onSuccess(), 2000);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "שגיאה בעדכון הסיסמה"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6 w-full">
      <div className="text-center">
        <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-3">
          <Lock className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
          בחירת סיסמה חדשה
        </h2>
        <p className="text-gray-500 text-sm">
          הזן סיסמה חדשה (לפחות 6 תווים)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="new-password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            סיסמה חדשה
          </label>
          <input
            id="new-password"
            type="password"
            className="w-full px-4 py-2 h-10 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            אימות סיסמה
          </label>
          <input
            id="confirm-password"
            type="password"
            className="w-full px-4 py-2 h-10 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        {newPassword && confirmPassword && newPassword !== confirmPassword && (
          <p className="text-red-600 text-sm">הסיסמאות אינן תואמות</p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md flex items-center justify-center gap-2 transition ${
            !canSubmit ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "מעדכן..." : "עדכן סיסמה"}
        </button>
      </form>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.includes("הצלחה")
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
};
