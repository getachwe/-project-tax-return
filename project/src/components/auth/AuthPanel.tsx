import React, { useEffect, useMemo, useState } from "react";
import { LogIn, UserPlus, AlertCircle } from "lucide-react";
import {
  apiSignIn,
  apiSignUp,
  apiResendConfirmation,
  apiGoogleSignIn,
} from "../../utils/api";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";
import { PasswordReset } from "./PasswordReset";

export const AuthPanel: React.FC = () => {
  const hasResetToken = !!new URLSearchParams(
    location.hash.replace(/^#/, "")
  ).get("access_token");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  // Load saved email on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const canSubmit = useMemo(() => {
    const emailOk = /.+@.+\..+/.test(email.trim());
    const passOk = password.trim().length >= 6;
    return emailOk && passOk && !loading;
  }, [email, password, loading]);

  function getEmailFromToken(t: string | null): string {
    try {
      if (!t) return "";
      const payload = JSON.parse(
        atob((t.split(".")[1] || "").replace(/-/g, "+").replace(/_/g, "/"))
      );
      return payload?.email || "";
    } catch {
      return "";
    }
  }

  useEffect(() => {
    const t = localStorage.getItem("authToken");
    setToken(t);
    setEmail(getEmailFromToken(t));
  }, []);

  async function onSignIn() {
    try {
      setMessage(null);
      setLoading(true);
      const resp = (await apiSignIn(email, password)) as {
        data?: { session?: { access_token?: string } };
        access_token?: string;
      };
      const fallback = (
        resp as unknown as { session?: { access_token?: string } }
      )?.session?.access_token;
      const t =
        resp?.data?.session?.access_token || fallback || resp?.access_token;
      if (!t) throw new Error("no token");
      localStorage.setItem("authToken", t);
      localStorage.setItem("savedEmail", email.trim());
      setToken(t);
      setMessage("התחברת בהצלחה");
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("auth:loggedIn"));
      }, 100);
      try {
        const base = location.href.replace(location.hash, "");
        history.replaceState({}, "", base + "#/");
      } catch {
        // ignore navigation errors
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onSignUp() {
    try {
      setMessage(null);
      setLoading(true);
      await apiSignUp(email, password);
      setMessage("נרשמת בהצלחה — אשר את המייל ואז תוכל להתחבר");
      setMode("signin");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onGoogleSignIn() {
    try {
      setMessage(null);
      setLoading(true);
      const { url } = await apiGoogleSignIn();
      window.location.href = url;
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  }

  function onSignOut() {
    localStorage.removeItem("authToken");
    setToken(null);
    window.dispatchEvent(new CustomEvent("auth:loggedOut"));
  }

  const handleResendConfirmation = async () => {
    try {
      setLoading(true);
      await apiResendConfirmation(email);
      setMessage("אימייל אישור נשלח שוב");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  // מסך איפוס נקי כאשר מגיעים מהאימייל
  if (hasResetToken) {
    return (
      <div className="rtl">
        <PasswordReset onSuccess={onSignOut} />
      </div>
    );
  }

  return (
    <div className="rtl">
      {!token ? (
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6 w-full">
          {/* Header */}
          <div className="text-center">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-3">
              {mode === "signin" ? (
                <LogIn className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
              ) : (
                <UserPlus className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
              {mode === "signin" ? "התחברות לחשבון" : "הרשמה למערכת"}
            </h2>
            <p className="text-gray-500 text-sm">
              {mode === "signin"
                ? "התחבר לחשבון שלך כדי להתחיל"
                : "צור חשבון חדש כדי להתחיל להשתמש במערכת"}
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="relative w-full max-w-sm mx-auto">
            <div className="grid grid-cols-2 bg-gray-100 rounded-xl p-1">
              <button
                className={`h-10 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm font-medium ${
                  mode === "signin"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                onClick={() => setMode("signin")}
              >
                <LogIn className="h-4 w-4" />
                התחברות
              </button>
              <button
                className={`h-10 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm font-medium ${
                  mode === "signup"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                onClick={() => setMode("signup")}
              >
                <UserPlus className="h-4 w-4" />
                הרשמה
              </button>
            </div>
          </div>

          {/* Form */}
          {mode === "signin" ? (
            <LoginForm
              email={email}
              password={password}
              showPassword={showPassword}
              loading={loading}
              canSubmit={canSubmit}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              onSubmit={onSignIn}
            />
          ) : (
            <SignupForm
              email={email}
              password={password}
              showPassword={showPassword}
              loading={loading}
              canSubmit={canSubmit}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              onSubmit={onSignUp}
            />
          )}

          {/* Message */}
          {message && (
            <div
              className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                message.includes("הצלחה") || message.includes("נרשמת")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              <AlertCircle className="h-4 w-4" />
              {message}
            </div>
          )}

          {/* Resend Confirmation */}
          {message?.includes("אשר את המייל") && (
            <button
              onClick={handleResendConfirmation}
              disabled={loading}
              className="w-full text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              שלח אימייל אישור שוב
            </button>
          )}

          {/* Google Sign In Button */}
          <div className="pt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">או</span>
              </div>
            </div>
            <button
              onClick={onGoogleSignIn}
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              התחבר עם Google
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="space-y-2 pt-1">
            <div className="text-center text-sm text-gray-500">
              <button
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                {mode === "signin"
                  ? "אין לך חשבון? הירשם כאן"
                  : "יש לך חשבון? התחבר כאן"}
              </button>
            </div>
            <div className="text-center text-sm text-gray-500">
              <span>שכחת סיסמה?</span>
              <button
                onClick={() => {
                  // TODO: Implement forgot password
                  setMessage("פונקציונליות שכחת סיסמה תתווסף בקרוב");
                }}
                className="text-blue-600 hover:text-blue-700 hover:underline transition-colors mr-1"
              >
                לחץ כאן
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            מחובר בהצלחה!
          </h2>
          <p className="text-gray-600 mb-4">ברוך הבא למערכת חישוב המס</p>
          <button
            onClick={onSignOut}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            התנתק
          </button>
        </div>
      )}
    </div>
  );
};
