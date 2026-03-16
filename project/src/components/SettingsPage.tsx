import React, { useEffect, useState } from "react";
import { apiGetProfile, apiUpdateProfile, apiUpdatePassword, apiMe } from "../utils/api";
import { usePreferences } from "../context/PreferencesContext";
import { useI18n } from "../i18n/useI18n";

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

  const tabButtonClasses = (tab: TabKey) =>
    [
      "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
      activeTab === tab
        ? "bg-emerald-500 text-white shadow-sm"
        : "bg-slate-100 text-slate-700 hover:bg-slate-200",
    ].join(" ");

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="bg-white/90 backdrop-blur border border-slate-200 rounded-3xl shadow-sm p-6 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {t("settings.title")}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {t("settings.subtitle")}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className={tabButtonClasses("account")}
              onClick={() => setActiveTab("account")}
            >
              {t("settings.tab.account")}
            </button>
            <button
              type="button"
              className={tabButtonClasses("security")}
              onClick={() => setActiveTab("security")}
            >
              {t("settings.tab.security")}
            </button>
            <button
              type="button"
              className={tabButtonClasses("preferences")}
              onClick={() => setActiveTab("preferences")}
            >
              {t("settings.tab.preferences")}
            </button>
          </div>
        </div>
        {message && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
            {message}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {activeTab === "account" && (
          <div className="bg-white/90 backdrop-blur border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">{t("settings.account.title")}</h2>
            <p className="text-sm text-slate-600">
              {t("settings.account.subtitle")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-slate-700">שם פרטי</span>
                <input
                  className="input-field"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-slate-700">שם משפחה</span>
                <input
                  className="input-field"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-sm text-slate-700">אימייל</span>
                <input
                  className="input-field bg-slate-50"
                  value={email}
                  disabled
                />
              </label>
            </div>
            {createdAt && (
              <p className="text-xs text-slate-500 mt-1">
                חשבון נוצר בתאריך:{" "}
                {new Date(createdAt).toLocaleString("he-IL")}
              </p>
            )}
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={handleSaveAccount}
                disabled={loading}
                className="btn-primary px-5"
              >
                {loading ? "..." : t("settings.save")}
              </button>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="bg-card/90 text-card-foreground backdrop-blur border border-border rounded-3xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">{t("settings.security.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("settings.security.subtitle")}
            </p>
            {lastLoginAt && (
              <p className="text-xs text-muted-foreground">
                {t("settings.lastLogin")}:{" "}
                {new Date(lastLoginAt).toLocaleString("he-IL")}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">סיסמה חדשה</span>
                {/* label translated via surrounding text in future pass */}
                <input
                  type="password"
                  className="input-field"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">
                  {t("settings.password.confirm")}
                </span>
                <input
                  type="password"
                  className="input-field"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={loading}
                className="btn-primary px-5"
              >
                עדכן סיסמה
              </button>
              <button
                type="button"
                onClick={handleLogoutAll}
                className="btn-secondary px-5"
              >
                {t("settings.logout.device")}
              </button>
            </div>
          </div>
        )}

        {activeTab === "preferences" && (
          <div className="bg-card/90 text-card-foreground backdrop-blur border border-border rounded-3xl shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">{t("settings.preferences.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("settings.preferences.subtitle")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">{t("prefs.theme")}</span>
                <select
                  className="input-field"
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
              <label className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">{t("prefs.language")}</span>
                <select
                  className="input-field"
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
              <label className="flex items-center gap-3 mt-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  checked={prefs.emailNotifications}
                  onChange={(e) =>
                    handlePrefsChange({ emailNotifications: e.target.checked })
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {t("prefs.emailNotifications")}
                </span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

