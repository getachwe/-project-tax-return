import React, { useState } from "react";
import { Mail, CheckCircle } from "lucide-react";
import { apiResetPassword } from "../../utils/api";

interface PasswordResetProps {
  onSuccess: () => void;
}

export const PasswordReset: React.FC<PasswordResetProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setLoading(true);
      setMessage(null);
      await apiResetPassword(email);
      setMessage("אימייל איפוס סיסמה נשלח! בדוק את תיבת המייל שלך");
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "שגיאה בשליחת אימייל האיפוס"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6 w-full">
      <div className="text-center">
        <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-3">
          <CheckCircle className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
          איפוס סיסמה
        </h2>
        <p className="text-gray-500 text-sm">
          הזן את האימייל שלך ונשלח לך קישור לאיפוס הסיסמה
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="reset-email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            אימייל
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-gray-400" />
            </div>
            <input
              id="reset-email"
              type="email"
              aria-label="כתובת אימייל"
              className="w-full pl-10 pr-4 py-2 h-10 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit || loading}
          className={`w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md flex items-center justify-center gap-2 transition ease-in-out duration-200 ${
            !canSubmit || loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "שולח..." : "שלח קישור איפוס"}
        </button>
      </form>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.includes("נשלח") || message.includes("הצלחה")
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
