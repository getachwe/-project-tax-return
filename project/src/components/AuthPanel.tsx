import React, { useEffect, useMemo, useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  apiSignIn,
  apiSignUp,
  apiResendConfirmation,
  apiResetPassword,
} from "../utils/api";
// import { Profile } from "./Profile";

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
    if (t) setToken(t);
    setEmail(getEmailFromToken(t));
  }, []);

  async function onSignIn() {
    try {
      setMessage(null);
      setLoading(true);
      const resp = (await apiSignIn(email, password)) as {
        data?: { session?: { access_token?: string } };
        access_token?: string; // backward compatibility
      };
      const fallback = (
        resp as unknown as { session?: { access_token?: string } }
      )?.session?.access_token;
      const t =
        resp?.data?.session?.access_token || fallback || resp?.access_token;
      if (!t) throw new Error("no token");
      localStorage.setItem("authToken", t);
      // Save email for next time
      localStorage.setItem("savedEmail", email.trim());
      setToken(t);
      setMessage("התחברת בהצלחה");
      // notify header to close dialog and update status
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("auth:loggedIn"));
      }, 100);
      // נווט לעמוד הראשי כדי לוודא שהמחשבון נטען
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

  function onSignOut() {
    localStorage.removeItem("authToken");
    setToken(null);
    window.dispatchEvent(new CustomEvent("auth:loggedOut"));
  }

  // מסך איפוס נקי כאשר מגיעים מהאימייל
  if (hasResetToken) {
    return (
      <div className="rtl">
        <ResetPasswordInline />
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

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                אימייל
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
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canSubmit) {
                      if (mode === "signin") {
                        onSignIn();
                      } else {
                        onSignUp();
                      }
                    }
                  }}
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canSubmit) {
                      if (mode === "signin") {
                        onSignIn();
                      } else {
                        onSignUp();
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                  title={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
                  aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            className={`w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md flex items-center justify-center gap-2 transition ease-in-out duration-200 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed ${
              loading ? "opacity-60 cursor-not-allowed" : ""
            }`}
            onClick={mode === "signin" ? onSignIn : onSignUp}
            disabled={!canSubmit}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {mode === "signin" ? "נכנס..." : "נרשם..."}
              </>
            ) : (
              <>
                {mode === "signin" ? (
                  <>
                    <span>כניסה</span>
                    <LogIn className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <span>הרשמה</span>
                    <UserPlus className="h-4 w-4" />
                  </>
                )}
              </>
            )}
          </button>

          {/* Messages */}
          {message && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 ${
                message.includes("שגיאה") || message.includes("לא נכון")
                  ? "bg-red-50 border border-red-200 text-red-700"
                  : "bg-green-50 border border-green-200 text-green-700"
              }`}
            >
              {message.includes("שגיאה") || message.includes("לא נכון") ? (
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
              ) : (
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="text-sm">{message}</span>
            </div>
          )}

          {/* Secondary Actions */}
          <div className="space-y-2 pt-1">
            {mode === "signin" && (
              <div className="flex flex-col sm:flex-row justify-center gap-4 text-sm text-gray-600">
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-700 hover:underline transition-colors text-center"
                  onClick={async () => {
                    try {
                      setMessage(null);
                      await apiResetPassword(email);
                      setMessage("נשלח מייל לאיפוס סיסמה (אם קיים משתמש)");
                    } catch (e) {
                      setMessage(e instanceof Error ? e.message : String(e));
                    }
                  }}
                >
                  שכחתי סיסמה
                </button>
                <span className="hidden sm:inline text-gray-300">|</span>
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-700 hover:underline transition-colors text-center"
                  onClick={async () => {
                    try {
                      setMessage(null);
                      await apiResendConfirmation(email);
                      setMessage("נשלח שוב מייל אימות");
                    } catch (e) {
                      setMessage(e instanceof Error ? e.message : String(e));
                    }
                  }}
                >
                  שלח שוב מייל אימות
                </button>
              </div>
            )}
            <div className="text-sm text-gray-600 text-center">
              {mode === "signin" ? "אין לך חשבון? " : "יש לך כבר חשבון? "}
              <button
                type="button"
                className="text-blue-700 hover:text-blue-800 hover:underline font-medium"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              >
                {mode === "signin" ? "הרשמה" : "התחברות"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="text-sm text-gray-700">
            מחובר כ־<span className="font-medium">{email || "משתמש"}</span>
          </div>
          <div className="flex justify-end">
            <button className="btn-secondary" onClick={onSignOut}>
              התנתק
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ResetPasswordInline: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const params = new URLSearchParams(location.hash.replace(/^#/, ""));
  const token = params.get("access_token") || "";

  async function submit() {
    if (!password || password.length < 8) {
      setMsg("סיסמה חייבת לכלול 8 תווים לפחות");
      return;
    }
    if (password !== confirm) {
      setMsg("האימות לא זהה לסיסמה");
      return;
    }
    try {
      setMsg(null);
      const metaEnv = import.meta as unknown as {
        env?: Record<string, unknown>;
      };
      const base =
        typeof metaEnv.env?.VITE_API_URL === "string"
          ? (metaEnv.env!.VITE_API_URL as string)
          : "http://localhost:4000";
      const res = await fetch(`${base}/api/auth/update-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: token, newPassword: password }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg("הסיסמה עודכנה. נכנסים למערכת...");
      // אחרי עדכון סיסמה — התחברות אוטומטית עם הטוקן מהקישור
      localStorage.setItem("authToken", token);
      // הסרת ה-hash וטעינה מחדש קלה כדי לנקות access_token מה-URL
      const cleanUrl = location.href.replace(location.hash, "");
      setTimeout(() => {
        window.history.replaceState({}, "", cleanUrl);
        window.dispatchEvent(new StorageEvent("storage"));
      }, 300);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="mt-4 p-4 border rounded-xl bg-gray-50 space-y-2">
      <div className="text-sm font-medium text-gray-800">איפוס סיסמה</div>
      <div className="grid gap-2">
        <input
          className="input"
          type="password"
          placeholder="סיסמה חדשה"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder="אימות סיסמה"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <button className="btn-primary w-full" onClick={submit}>
        עדכון סיסמה
      </button>
      {msg && <div className="text-xs text-blue-700 text-center">{msg}</div>}
    </div>
  );
};
