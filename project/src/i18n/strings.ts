import type { Language } from "../context/PreferencesContext";

export type I18nKey =
  | "nav.navigation"
  | "nav.dashboard"
  | "nav.incomes"
  | "nav.history"
  | "nav.settings"
  | "nav.profile"
  | "app.title"
  | "app.subtitle"
  | "header.dashboard"
  | "header.help"
  | "header.about"
  | "layout.menu"
  | "settings.title"
  | "settings.subtitle"
  | "settings.tab.account"
  | "settings.tab.security"
  | "settings.tab.preferences"
  | "settings.account.title"
  | "settings.account.subtitle"
  | "settings.security.title"
  | "settings.security.subtitle"
  | "settings.preferences.title"
  | "settings.preferences.subtitle"
  | "settings.save"
  | "settings.saved"
  | "settings.password.updated"
  | "settings.password.new"
  | "settings.password.confirm"
  | "settings.password.mismatch"
  | "settings.logout.device"
  | "settings.lastLogin"
  | "prefs.theme"
  | "prefs.light"
  | "prefs.dark"
  | "prefs.language"
  | "prefs.emailNotifications";

type Dict = Record<I18nKey, string>;

const he: Dict = {
  "nav.navigation": "ניווט",
  "nav.dashboard": "דשבורד",
  "nav.incomes": "הכנסות",
  "nav.history": "היסטוריה",
  "nav.settings": "הגדרות",
  "nav.profile": "פרופיל",
  "app.title": "Tax Refund",
  "app.subtitle": "מחשבון החזרי מס חכם",
  "header.dashboard": "דשבורד",
  "header.help": "עזרה",
  "header.about": "אודות",
  "layout.menu": "תפריט",
  "settings.title": "הגדרות",
  "settings.subtitle": "ניהול פרטי החשבון, אבטחה והעדפות אישיות.",
  "settings.tab.account": "חשבון",
  "settings.tab.security": "אבטחה",
  "settings.tab.preferences": "העדפות",
  "settings.account.title": "פרטי חשבון",
  "settings.account.subtitle": "עדכן את שם המשתמש והפרטים הבסיסיים שלך.",
  "settings.security.title": "אבטחה",
  "settings.security.subtitle": "נהל את הסיסמה והחיבור למערכת.",
  "settings.preferences.title": "העדפות",
  "settings.preferences.subtitle": "הגדר מצב תצוגה, שפה והתראות אימייל.",
  "settings.save": "שמור שינויים",
  "settings.saved": "הפרטים נשמרו בהצלחה",
  "settings.password.updated": "הסיסמה עודכנה בהצלחה",
  "settings.password.new": "סיסמה חדשה",
  "settings.password.confirm": "אישור סיסמה",
  "settings.password.mismatch": "הסיסמאות אינן תואמות",
  "settings.logout.device": "התנתק מהמכשיר הזה",
  "settings.lastLogin": "התחברות אחרונה",
  "prefs.theme": "מצב תצוגה",
  "prefs.light": "מצב בהיר",
  "prefs.dark": "מצב כהה",
  "prefs.language": "שפה",
  "prefs.emailNotifications": "קבל התראות במייל על דוחות חדשים",
};

const en: Dict = {
  "nav.navigation": "Navigation",
  "nav.dashboard": "Dashboard",
  "nav.incomes": "Incomes",
  "nav.history": "History",
  "nav.settings": "Settings",
  "nav.profile": "Profile",
  "app.title": "Tax Refund",
  "app.subtitle": "Smart tax refund calculator",
  "header.dashboard": "Dashboard",
  "header.help": "Help",
  "header.about": "About",
  "layout.menu": "Menu",
  "settings.title": "Settings",
  "settings.subtitle": "Manage your account, security and preferences.",
  "settings.tab.account": "Account",
  "settings.tab.security": "Security",
  "settings.tab.preferences": "Preferences",
  "settings.account.title": "Account",
  "settings.account.subtitle": "Update your basic profile details.",
  "settings.security.title": "Security",
  "settings.security.subtitle": "Manage password and sessions.",
  "settings.preferences.title": "Preferences",
  "settings.preferences.subtitle": "Theme, language and email notifications.",
  "settings.save": "Save changes",
  "settings.saved": "Saved successfully",
  "settings.password.updated": "Password updated",
  "settings.password.new": "New password",
  "settings.password.confirm": "Confirm password",
  "settings.password.mismatch": "Passwords do not match",
  "settings.logout.device": "Log out on this device",
  "settings.lastLogin": "Last login",
  "prefs.theme": "Theme",
  "prefs.light": "Light",
  "prefs.dark": "Dark",
  "prefs.language": "Language",
  "prefs.emailNotifications": "Email notifications for new reports",
};

export function getDict(lang: Language): Dict {
  return lang === "en" ? en : he;
}

