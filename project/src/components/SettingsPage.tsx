import React, { useEffect, useState } from "react";
import {
  apiGetProfile,
  apiUpdateProfile,
  apiUpdatePassword,
  apiMe,
} from "../utils/api";
import { usePreferences } from "../context/PreferencesContext";
import { useI18n } from "../i18n/useI18n";
import {
  Briefcase,
  Shield,
  Landmark,
  BellRing,
  AlertTriangle,
} from "lucide-react";

function userRefFromToken(t: string) {
  try {
    const p = JSON.parse(
      atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return typeof p.sub === "string" ? `${p.sub.slice(0, 10)}…` : "—";
  } catch {
    return "—";
  }
}

type Props = {
  token: string;
};

type TabKey = "account" | "security" | "preferences";

export const SettingsPage: React.FC<Props> = ({ token }) => {
  const { prefs, updatePrefs } = usePreferences();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabKey>("account");

  // Shared state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Account
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  // Security
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [lastLoginAt, setLastLoginAt] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("single");

  useEffect(() => {
    let mounted = true;

    async function loadInitial() {
      try {
        setLoading(true);
        setError(null);

        // Profile basics
        const profile = await apiGetProfile(token);
        if (!mounted) return;
        setFirstName(profile?.first_name || "");
        setLastName(profile?.last_name || "");
        setEmail(profile?.email || "");
        setCreatedAt(profile?.created_at || profile?.updated_at || null);

        // Auth info (for last login)
        try {
          const me = await apiMe(token);
          if (!mounted) return;
          const lastSignIn =
            me?.user?.last_sign_in_at || me?.user?.created_at || null;
          setLastLoginAt(lastSignIn);
        } catch {
          // non‑fatal
        }

        // Preferences are managed globally via PreferencesProvider
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "שגיאה בטעינת ההגדרות");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadInitial();
    return () => {
      mounted = false;
    };
  }, [token]);

  function showMessage(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 4000);
  }

  async function handleSaveAccount() {
    try {
      setLoading(true);
      setError(null);
      await apiUpdateProfile(token, firstName, lastName);
      showMessage(t("settings.saved"));
    } catch (e: any) {
      setError(e?.message || "שגיאה בשמירת הפרופיל");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword() {
    if (!newPassword || !confirmPassword) {
      setError("נא למלא סיסמה חדשה ואישור");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("settings.password.mismatch"));
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await apiUpdatePassword(token, newPassword);
      setNewPassword("");
      setConfirmPassword("");
      showMessage(t("settings.password.updated"));
    } catch (e: any) {
      setError(e?.message || "שגיאה בעדכון הסיסמה");
    } finally {
      setLoading(false);
    }
  }

  function handleLogoutAll() {
    // פרקטית – ננתק את המשתמש מהמכשיר הנוכחי
    localStorage.removeItem("authToken");
    localStorage.removeItem("lastActivity");
    window.dispatchEvent(new CustomEvent("auth:loggedOut"));
    showMessage(t("settings.logout.device"));
  }

  function handlePrefsChange(next: Partial<typeof prefs>) {
    updatePrefs(next);
    showMessage(t("settings.saved"));
  }

  const tabClass = (tab: TabKey) =>
    [
      "pb-2 px-2 text-sm font-bold border-b-2 transition-colors -mb-px",
      activeTab === tab
        ? "text-[#006D4E] border-[#00A86B]"
        : "text-[#64748b] border-transparent hover:text-[#131b2e]",
    ].join(" ");

  return (
    <div className="w-full pb-12" dir="rtl">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131b2e]">
            {t("settings.title")}
          </h1>
          <p className="text-sm text-[#64748b] mt-2 max-w-2xl">
            {t("settings.subtitle")}
          </p>
          <nav className="flex flex-wrap gap-6 mt-8 border-b border-[#e8eaf2]">
            <button type="button" className={tabClass("account")} onClick={() => setActiveTab("account")}>
              {t("settings.tab.account")}
            </button>
            <button type="button" className={tabClass("security")} onClick={() => setActiveTab("security")}>
              {t("settings.tab.security")}
            </button>
            <button type="button" className={tabClass("preferences")} onClick={() => setActiveTab("preferences")}>
              {t("settings.tab.preferences")}
            </button>
          </nav>
        </header>

        {message && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {activeTab === "account" && (
          <div className="space-y-6">
            <div
              role="alert"
              className="rounded-xl border-r-4 border-red-400 bg-rose-50 px-4 py-4 flex gap-3 items-start"
            >
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-900 text-sm">חסר טופס 106 לשנת המס האחרונה</p>
                <p className="text-xs text-red-800/90 mt-1 leading-relaxed">
                  העלאת הטופס תאפשר ניתוח מלא ודיוק מירבי בחישוב ההחזר.
                </p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 items-start">
              <section className="rounded-xl border border-[#e8eaf2] bg-white shadow-sm p-6 space-y-4">
                <h2 className="text-lg font-extrabold text-[#131b2e]">
                  {t("settings.account.title")}
                </h2>
                <p className="text-sm text-[#64748b]">{t("settings.account.subtitle")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-[#131b2e]">שם פרטי</span>
                    <input className="input-field rounded-lg" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-[#131b2e]">שם משפחה</span>
                    <input className="input-field rounded-lg" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </label>
                  <label className="flex flex-col gap-1.5 sm:col-span-2">
                    <span className="text-sm font-medium text-[#131b2e]">אימייל</span>
                    <input className="input-field rounded-lg bg-slate-50" value={email} disabled />
                  </label>
                  <label className="flex flex-col gap-1.5 sm:col-span-2">
                    <span className="text-sm font-medium text-[#131b2e]">טלפון</span>
                    <input
                      className="input-field rounded-lg"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="לתצוגה בלבד — לא נשמר בשרת"
                    />
                  </label>
                </div>
                {createdAt && (
                  <p className="text-xs text-[#64748b]">
                    חשבון נוצר: {new Date(createdAt).toLocaleString("he-IL")}
                  </p>
                )}
                <div className="flex justify-end pt-2">
                  <button type="button" onClick={handleSaveAccount} disabled={loading} className="btn-primary px-8 rounded-xl">
                    {loading ? "…" : t("settings.save")}
                  </button>
                </div>
              </section>

              <section className="rounded-xl border border-[#d8dcf0] bg-[#E6E9FF]/80 p-6 space-y-4">
                <div className="flex items-center gap-2 text-[#131b2e]">
                  <Briefcase className="h-5 w-5 text-[#006D4E]" />
                  <h2 className="text-lg font-extrabold">זיהוי פיננסי</h2>
                </div>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-[#131b2e]">מזהה משתמש במערכת</span>
                  <input className="input-field rounded-lg bg-white/80 text-[#64748b]" readOnly value={userRefFromToken(token)} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-[#131b2e]">מצב משפחתי</span>
                  <select className="input-field rounded-lg bg-white/90" value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)}>
                    <option value="single">רווק/ה</option>
                    <option value="married">נשוי/אה</option>
                    <option value="divorced">גרוש/ה</option>
                    <option value="widowed">אלמן/ה</option>
                  </select>
                </label>
                <p className="text-[11px] text-[#64748b] leading-relaxed">
                  השדות בכרטיס זה הם לתצוגה והתאמה לעיצוב; שמירת שינויים נשלחת רק לשם פרטי ומשפחה בלחיצה על &quot;שמירת שינויים&quot;.
                </p>
              </section>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-[#e8eaf2] bg-white p-5 shadow-sm">
                <Shield className="h-8 w-8 text-[#006D4E] mb-3" />
                <h3 className="font-bold text-[#131b2e]">אבטחת חשבון</h3>
                <p className="text-xs text-[#64748b] mt-2 leading-relaxed">אימות דו-שלבי (2FA) — ניהול דרך לשונית אבטחה.</p>
                <button type="button" onClick={() => setActiveTab("security")} className="mt-3 text-sm font-bold text-[#006D4E] hover:underline">
                  נהל אבטחה
                </button>
              </div>
              <div className="rounded-xl border border-[#e8eaf2] bg-white p-5 shadow-sm">
                <Landmark className="h-8 w-8 text-[#006D4E] mb-3" />
                <h3 className="font-bold text-[#131b2e]">חשבון בנק להחזר</h3>
                <p className="text-xs text-[#64748b] mt-2 leading-relaxed">פרטי חשבון לקבלת ההחזר (המחשה לפי העיצוב).</p>
                <span className="mt-3 inline-block text-sm font-semibold text-[#131b2e]">בנק לאומי ****12</span>
                <button type="button" className="block mt-2 text-sm font-bold text-[#006D4E] hover:underline">
                  עדכן פרטי בנק
                </button>
              </div>
              <div className="rounded-xl border border-[#e8eaf2] bg-white p-5 shadow-sm">
                <BellRing className="h-8 w-8 text-[#006D4E] mb-3" />
                <h3 className="font-bold text-[#131b2e]">עדכונים ודיוור</h3>
                <p className="text-xs text-[#64748b] mt-2 leading-relaxed">התראות במייל/SMS על סטטוס הבקשה.</p>
                <button type="button" onClick={() => setActiveTab("preferences")} className="mt-3 text-sm font-bold text-[#006D4E] hover:underline">
                  שנה הגדרות
                </button>
              </div>
            </div>

            <section className="rounded-xl border border-rose-200 bg-rose-50/60 p-6">
              <h3 className="text-sm font-extrabold text-red-700 mb-4">אזור רגיש</h3>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <p className="text-sm text-red-900/90 max-w-xl leading-relaxed">
                  מחיקת החשבון תסיר לצמיתות את כל הנתונים והמסמכים המשויכים אליך במערכת. פעולה זו אינה הפיכה.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    window.alert(
                      "מחיקת חשבון מלאה דורשת פנייה לתמיכה. השתמש ב&quot;עזרה&quot; בתפריט הצד."
                    )
                  }
                  className="shrink-0 px-5 py-2.5 rounded-xl border-2 border-red-600 text-red-700 font-bold bg-white hover:bg-red-50 transition-colors"
                >
                  מחק חשבון
                </button>
              </div>
            </section>
          </div>
        )}

        {activeTab === "security" && (
          <div className="rounded-xl border border-[#e8eaf2] bg-white shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-[#131b2e]">{t("settings.security.title")}</h2>
            <p className="text-sm text-[#64748b]">{t("settings.security.subtitle")}</p>
            {lastLoginAt && (
              <p className="text-xs text-[#64748b]">
                {t("settings.lastLogin")}: {new Date(lastLoginAt).toLocaleString("he-IL")}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-[#64748b]">סיסמה חדשה</span>
                <input type="password" className="input-field rounded-lg" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-[#64748b]">{t("settings.password.confirm")}</span>
                <input type="password" className="input-field rounded-lg" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </label>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <button type="button" onClick={handleChangePassword} disabled={loading} className="btn-primary px-6 rounded-xl">
                עדכן סיסמה
              </button>
              <button type="button" onClick={handleLogoutAll} className="btn-secondary px-6 rounded-xl border-[#e8eaf2]">
                {t("settings.logout.device")}
              </button>
            </div>
          </div>
        )}

        {activeTab === "preferences" && (
          <div className="rounded-xl border border-[#e8eaf2] bg-white shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-[#131b2e]">{t("settings.preferences.title")}</h2>
            <p className="text-sm text-[#64748b]">{t("settings.preferences.subtitle")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-[#64748b]">{t("prefs.theme")}</span>
                <select
                  className="input-field rounded-lg"
                  value={prefs.theme}
                  onChange={(e) =>
                    handlePrefsChange({
                      theme: e.target.value as (typeof prefs)["theme"],
                    })
                  }
                >
                  <option value="light">{t("prefs.light")}</option>
                  <option value="dark">{t("prefs.dark")}</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-[#64748b]">{t("prefs.language")}</span>
                <select
                  className="input-field rounded-lg"
                  value={prefs.language}
                  onChange={(e) =>
                    handlePrefsChange({
                      language: e.target.value as (typeof prefs)["language"],
                    })
                  }
                >
                  <option value="he">עברית</option>
                  <option value="en">English</option>
                </select>
              </label>
              <label className="flex items-center gap-3 mt-2 sm:col-span-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  checked={prefs.emailNotifications}
                  onChange={(e) =>
                    handlePrefsChange({ emailNotifications: e.target.checked })
                  }
                />
                <span className="text-sm text-[#64748b]">{t("prefs.emailNotifications")}</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

