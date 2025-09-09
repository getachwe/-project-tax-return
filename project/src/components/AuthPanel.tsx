import React, { useEffect, useState } from "react";
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
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

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
      setToken(t);
      setMessage("התחברת בהצלחה");
      // notify header to close dialog
      window.dispatchEvent(new CustomEvent("auth:loggedIn"));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    }
  }

  async function onSignUp() {
    try {
      setMessage(null);
      await apiSignUp(email, password);
      setMessage("נרשמת בהצלחה — אשר את המייל ואז תוכל להתחבר");
      setMode("signin");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
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
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-5">
          <div className="flex gap-2 text-sm justify-center">
            <button
              className={`px-4 py-1.5 rounded-full ${
                mode === "signin"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
              onClick={() => setMode("signin")}
            >
              התחברות
            </button>
            <button
              className={`px-4 py-1.5 rounded-full ${
                mode === "signup"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
              onClick={() => setMode("signup")}
            >
              הרשמה
            </button>
          </div>

          <div className="space-y-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-600">אימייל</span>
              <input
                className="input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-600">סיסמה</span>
              <input
                className="input"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          </div>

          {mode === "signin" ? (
            <div className="space-y-2">
              <button className="btn-primary w-full" onClick={onSignIn}>
                כניסה למערכת
              </button>
              <div className="flex justify-between text-xs text-gray-600">
                <button
                  type="button"
                  className="text-blue-700 hover:underline"
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
                <button
                  type="button"
                  className="text-blue-700 hover:underline"
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
              <div className="text-xs text-gray-500 text-center">
                אין לך חשבון? עבור ללשונית הרשמה
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button className="btn-primary w-full" onClick={onSignUp}>
                יצירת חשבון
              </button>
              <div className="text-xs text-gray-600 text-center">
                לאחר הרשמה יש לאשר את המייל ואז להתחבר
              </div>
            </div>
          )}

          {/* reset-password inline when access_token in URL */}
          {new URLSearchParams(location.hash.replace(/^#/, "")).get(
            "access_token"
          ) && <ResetPasswordInline />}

          {message && (
            <div className="text-sm text-blue-700 text-center">{message}</div>
          )}
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
