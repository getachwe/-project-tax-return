import React from "react";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";

interface LoginFormProps {
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  canSubmit: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onTogglePassword: () => void;
  onSubmit: () => Promise<void>;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  email,
  password,
  showPassword,
  loading,
  canSubmit,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    await onSubmit();
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-bold text-[#3c4a42] mb-1"
        >
          כתובת אימייל
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-4 w-4 text-gray-400" />
          </div>
          <input
            id="email"
            type="email"
            aria-label="כתובת אימייל"
            className="w-full pl-10 pr-4 py-2 h-10 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors hover:scale-[1.01]"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          סיסמה
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-4 w-4 text-gray-400" />
          </div>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            aria-label="סיסמה"
            className="w-full pl-10 pr-12 py-2 h-10 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors hover:scale-[1.01]"
            placeholder="הכנס סיסמה"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={onTogglePassword}
            aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit || loading}
        className={`w-full h-10 bg-gradient-to-br from-[#006c49] to-[#10b981] hover:from-[#005236] hover:to-[#10b981] text-white rounded-lg font-extrabold shadow-md flex items-center justify-center gap-2 transition ease-in-out duration-200 hover:scale-[1.01] ${
          !canSubmit || loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? (
          "טוען..."
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            המשך למערכת
          </>
        )}
      </button>
    </form>
  );
};
