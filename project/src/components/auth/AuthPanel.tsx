import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogIn,
  AlertCircle,
  CheckCircle2,
  Shield,
  MessageCircle,
  ChevronDown,
} from "lucide-react";
import {
  apiSignIn,
  apiSignUp,
  apiResendConfirmation,
  apiGoogleSignIn,
} from "../../utils/api";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";
import { PasswordReset } from "./PasswordReset";
import { SetNewPassword } from "./SetNewPassword";
import { BrandLockup } from "../ui/BrandMark";
import { TaxAssistantChat } from "../assistant/TaxAssistantChat";
import { useI18n } from "../../i18n/useI18n";

export const AuthPanel: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const hashParams = new URLSearchParams(
    location.hash.replace(/^#/, "").split("?")[0] || "",
  );
  const accessToken = hashParams.get("access_token");
  const typeRecovery = hashParams.get("type") === "recovery";
  const isRecoveryFlow = !!accessToken && typeRecovery;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

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
        atob((t.split(".")[1] || "").replace(/-/g, "+").replace(/_/g, "/")),
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
      window.dispatchEvent(new CustomEvent("auth:loggedIn"));
      navigate("/incomes", { replace: true });
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

  // מגיעים מקישור איפוס סיסמה במייל – טופס בחירת סיסמה חדשה
  if (isRecoveryFlow && accessToken) {
    const handleSetPasswordSuccess = () => {
      history.replaceState(
        null,
        "",
        location.pathname + location.search + "#/",
      );
      localStorage.removeItem("authToken");
      setToken(null);
      setShowForgotPassword(false);
      setMessage("הסיסמה עודכנה. התחבר עם הסיסמה החדשה");
    };
    return (
      <div className="rtl">
        <SetNewPassword
          accessToken={accessToken}
          onSuccess={handleSetPasswordSuccess}
        />
      </div>
    );
  }

  // לחיצה על "שכחת סיסמה" – טופס בקשת קישור איפוס
  if (showForgotPassword) {
    return (
      <div className="rtl">
        <PasswordReset
          onSuccess={() => {
            setShowForgotPassword(false);
            setMessage("אימייל איפוס סיסמה נשלח! בדוק את תיבת המייל");
          }}
        />
        <button
          onClick={() => setShowForgotPassword(false)}
          className="mt-4 w-full text-sm text-gray-600 hover:text-gray-800"
        >
          ← חזור להתחברות
        </button>
      </div>
    );
  }

  return (
    <div className="rtl">
      {!token ? (
        <div className="min-h-[70vh] flex flex-col bg-white dark:bg-slate-950 text-[#131b2e] dark:text-slate-50 rounded-2xl shadow-lg overflow-hidden border border-[#e8eaf2]">
          <div className="flex flex-col lg:flex-row-reverse flex-1 min-h-0">
            <section className="lg:w-[65%] relative overflow-hidden bg-gradient-to-b from-[#f8fafc] via-white to-[#f0fdf9]/40 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 px-6 pt-6 pb-10 sm:px-10 sm:pt-7 sm:pb-12 lg:px-12 lg:pt-8 lg:pb-14 flex items-start justify-center">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.4]"
                style={{
                  backgroundImage:
                    "radial-gradient(#94a3b8 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-l from-white/90 via-transparent to-emerald-50/30 dark:from-slate-950/90 dark:to-emerald-950/20"
                aria-hidden
              />

              <div className="relative z-10 w-full max-w-lg mx-auto text-right space-y-6 lg:space-y-8">
                <div className="space-y-4">
                  <h2 className="text-[1.65rem] sm:text-4xl lg:text-[2.75rem] font-extrabold leading-tight sm:leading-[1.12] text-[#131b2e] dark:text-slate-50">
                    <span className="text-[#131b2e]">מחשבון </span>
                    <span className="text-[#006D4E]">החזר המס</span>
                    <br />
                    <span className="text-[#131b2e]">החכם </span>
                    <span className="text-[#006D4E]">שלך</span>
                  </h2>
                  <p className="text-base sm:text-[1.05rem] leading-relaxed text-[#565e74] dark:text-slate-300 font-medium border-r-4 border-[#00A86B]/35 pr-4 -mr-px">
                    האלגוריתם שלנו בודק את סעיפי החוק הרלוונטיים כדי להציג לך
                    הערכת החזר מס — פשוט, מהיר ומדויק.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
                  <div className="rounded-2xl border border-[#e8eaf2] dark:border-slate-700 bg-white/85 dark:bg-slate-900/70 p-5 shadow-sm hover:shadow-md transition-shadow text-right">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#006D4E]">
                        <CheckCircle2 className="h-5 w-5" strokeWidth={2.25} />
                      </span>
                      <div className="space-y-1 min-w-0">
                        <h3 className="font-bold text-[#131b2e] dark:text-slate-50 text-sm sm:text-base">
                          דיוק מקסימלי
                        </h3>
                        <p className="text-xs sm:text-sm text-[#64748b] dark:text-slate-400 leading-snug">
                          ניתוח לפי הנתונים מהטופס והכללים שמופעלים בחישוב.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#e8eaf2] dark:border-slate-700 bg-white/85 dark:bg-slate-900/70 p-5 shadow-sm hover:shadow-md transition-shadow text-right">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#006D4E]">
                        <Shield className="h-5 w-5" strokeWidth={2.25} />
                      </span>
                      <div className="space-y-1 min-w-0">
                        <h3 className="font-bold text-[#131b2e] dark:text-slate-50 text-sm sm:text-base">
                          אבטחה ופרטיות
                        </h3>
                        <p className="text-xs sm:text-sm text-[#64748b] dark:text-slate-400 leading-snug">
                          הצפנה ושמירה לפי סטנדרטים מחמירים — הנתונים שלך אצלך.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#e8eaf2] dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 shadow-sm overflow-hidden text-right">
                  <button
                    type="button"
                    onClick={() => setAssistantOpen((o) => !o)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-[#006D4E]/[0.06] dark:hover:bg-slate-800/80 transition-colors"
                    aria-expanded={assistantOpen}
                  >
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-[#64748b] transition-transform duration-200 ${assistantOpen ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                    <span className="flex flex-row-reverse items-center gap-2 min-w-0 flex-1">
                      <MessageCircle
                        className="h-5 w-5 shrink-0 text-[#006D4E]"
                        aria-hidden
                      />
                      <span className="font-bold text-sm sm:text-base text-[#131b2e] dark:text-slate-50 text-right leading-snug">
                        {assistantOpen
                          ? t("auth.assistant.close")
                          : t("auth.assistant.open")}
                      </span>
                    </span>
                  </button>
                  {assistantOpen && (
                    <div className="border-t border-[#e8eaf2] dark:border-slate-700 bg-[#f8fafc]/90 dark:bg-slate-950/50 px-2 sm:px-3 pb-3 pt-2">
                      <TaxAssistantChat
                        variant="guest"
                        className="!max-w-none w-full mx-0 shadow-md border-[#d8dcf0]/70 min-h-[min(340px,42vh)] max-h-[min(540px,58vh)]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Auth — רקע אפור עדין כמו צד הטפסים; ברכה + מותג (טקסט בלבד) באותה שורה */}
            <section className="lg:w-[35%] bg-[#f8f9fc] dark:bg-slate-900 px-6 pt-6 pb-8 sm:px-8 sm:pt-7 lg:px-10 lg:pt-8 lg:pb-12 flex items-start justify-center border-t border-[#e8eaf2] dark:border-slate-800 lg:border-t-0 lg:border-s lg:border-[#e8eaf2] dark:lg:border-slate-800">
              <div className="w-full max-w-md space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 sm:gap-5 pb-5 border-b border-[#e2e8f0] dark:border-slate-700/80">
                  <div className="text-right space-y-1.5 min-w-0 sm:max-w-[min(100%,17rem)]">
                    <h3 className="text-2xl font-extrabold text-[#131b2e] dark:text-slate-50 leading-tight tracking-tight">
                      ברוכים הבאים
                    </h3>
                    <p className="text-sm font-medium text-[#565e74] dark:text-slate-300 leading-relaxed">
                      התחבר כדי להתחיל בחישוב ההחזר שלך
                    </p>
                  </div>
                  <BrandLockup
                    size="md"
                    title={t("app.title")}
                    subtitle={t("app.subtitle")}
                    className="shrink-0 sm:max-w-[12.5rem]"
                  />
                </div>

                <div className="space-y-5">
                  {/* Google sign in */}
                  <button
                    onClick={onGoogleSignIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white/90 dark:bg-slate-900 text-[#131b2e] dark:text-slate-50 font-bold text-base rounded-lg shadow-sm hover:shadow-md border border-[#bbcabf]/60 dark:border-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      className="w-5 h-5 shrink-0"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
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
                    <span>התחברות עם Google</span>
                  </button>

                  <div className="relative flex items-center">
                    <div className="flex-grow border-t border-[#bbcabf]/60 dark:border-slate-700" />
                    <span className="mx-3 text-xs sm:text-sm text-[#565e74] dark:text-slate-300 whitespace-nowrap">
                      או באמצעות אימייל
                    </span>
                    <div className="flex-grow border-t border-[#bbcabf]/60 dark:border-slate-700" />
                  </div>

                  {/* טפסים קיימים */}
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
                </div>

                {/* Message */}
                {message && (
                  <div
                    className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                      message.includes("הצלחה") || message.includes("נרשמת")
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
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
                    className="w-full text-sm text-emerald-700 dark:text-emerald-300 hover:underline transition-colors text-right"
                  >
                    שלח אימייל אישור שוב
                  </button>
                )}

                {/* Info Box */}
                <div className="p-4 bg-emerald-50/80 rounded-xl border-r-4 border-[#006D4E] text-sm text-[#131b2e] dark:text-slate-50">
                  <p className="leading-relaxed">
                    <span className="font-bold">הידעת?</span> שכירים בישראל
                    משאירים בממוצע 8,500 ₪ בקופת המדינה מדי שנה בגלל חוסר
                    מודעות.
                  </p>
                </div>

                {/* Secondary actions */}
                <div className="pt-2 space-y-2 text-xs sm:text-sm text-[#565e74] dark:text-slate-300 text-right">
                  <div>
                    {mode === "signin" ? (
                      <>
                        אין לך עדיין חשבון?{" "}
                        <button
                          onClick={() => setMode("signup")}
                          className="text-emerald-700 dark:text-emerald-300 hover:underline font-semibold"
                        >
                          להרשמה
                        </button>
                      </>
                    ) : (
                      <>
                        כבר יש לך חשבון?{" "}
                        <button
                          onClick={() => setMode("signin")}
                          className="text-emerald-700 dark:text-emerald-300 hover:underline font-semibold"
                        >
                          להתחברות
                        </button>
                      </>
                    )}
                  </div>
                  <div>
                    <button
                      onClick={() => setShowForgotPassword(true)}
                      className="text-emerald-700 dark:text-emerald-300 hover:underline"
                    >
                      שכחת סיסמה?
                    </button>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[#565e74] dark:text-slate-400">
                    בכניסתך למערכת הנך מאשר את{" "}
                    <a
                      href="#"
                      className="text-emerald-700 dark:text-emerald-300 underline"
                    >
                      תנאי השימוש
                    </a>{" "}
                    ו
                    <a
                      href="#"
                      className="text-emerald-700 dark:text-emerald-300 underline"
                    >
                      {" "}
                      מדיניות הפרטיות
                    </a>
                  </p>
                </div>
              </div>
            </section>
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
