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
  | "app.brand"
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
  | "prefs.emailNotifications"
  | "nav.assistant"
  | "auth.assistant.open"
  | "auth.assistant.close"
  | "assistant.title"
  | "assistant.subtitle"
  | "assistant.disclaimer.personalized"
  | "assistant.disclaimer.general"
  | "assistant.placeholder"
  | "assistant.send"
  | "assistant.thinking"
  | "assistant.llm.offBanner"
  | "assistant.empty"
  | "assistant.error.generic"
  | "assistant.error.retry"
  | "assistant.loadingHistory"
  | "assistant.bearer.ok"
  | "assistant.bearer.missing"
  | "assistant.welcome.title"
  | "assistant.welcome.subtitleGuest"
  | "assistant.welcome.subtitleDashboard"
  | "assistant.welcome.section.canDo"
  | "assistant.welcome.canDo.guest"
  | "assistant.welcome.canDo.dashboard"
  | "assistant.welcome.section.askYou"
  | "assistant.welcome.askYou.guest"
  | "assistant.welcome.askYou.dashboard";

type Dict = Record<I18nKey, string>;

const he: Dict = {
  "nav.navigation": "ניווט",
  "nav.dashboard": "דשבורד",
  "nav.incomes": "העלאת מסמכים",
  "nav.history": "היסטוריה",
  "nav.settings": "הגדרות",
  "nav.profile": "פרופיל",
  "app.title": "מס החזר",
  "app.subtitle": "החזר מס אישי",
  "app.brand": "ארכיטקט פיננסי",
  "header.dashboard": "דשבורד",
  "header.help": "עזרה",
  "header.about": "אודות",
  "layout.menu": "תפריט",
  "settings.title": "הגדרות",
  "settings.subtitle": "ניהול פרטי החשבון, אבטחה והעדפות אישיות.",
  "settings.tab.account": "חשבון",
  "settings.tab.security": "אבטחה",
  "settings.tab.preferences": "העדפות",
  "settings.account.title": "מידע אישי",
  "settings.account.subtitle": "עדכן את הפרטים המוצגים בחשבון שלך.",
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
  "nav.assistant": "עוזר מס",
  "auth.assistant.open": "שיחה עם עוזר המס (שאלות כלליות)",
  "auth.assistant.close": "סגירת עוזר המס",
  "assistant.title": "עוזר מס חכם",
  "assistant.subtitle": "שאלות על המערכת והחזר מס",
  "assistant.disclaimer.personalized":
    "התשובות מבוססות על הנתונים השמורים בחשבון שלך ובדוח האחרון — לא על מידע מחוץ למערכת.",
  "assistant.disclaimer.general":
    "התשובות כלליות בלבד — ללא שימוש בנתונים אישיים. להתאמה אישית התחבר לחשבון.",
  "assistant.placeholder": "כתוב שאלה…",
  "assistant.send": "שלח",
  "assistant.thinking": "מכין תשובה…",
  "assistant.llm.offBanner":
    "מצב שרת: אין מודל שפה מחובר (חסר OPENAI_API_KEY או CHAT_LLM_ENABLED=0) — התשובות מבוססות על כללים מוכנים, לא על AI.",
  "assistant.empty":
    "כתבו בשדה למטה בחופשיות — לדוגמה: איך מעלים טופס 106? למה ההחזר בדוח האחרון הוא 0?",
  "assistant.error.generic": "שגיאה בשליחת ההודעה",
  "assistant.error.retry": "לא הצלחתי לקבל תשובה מהשרת. נסה שוב בעוד רגע.",
  "assistant.loadingHistory": "טוען היסטוריית שיחה…",
  "assistant.bearer.ok":
    "שליחה עם החשבון שלך — נטענים הדוחות שנשמרו לעזרה אישית.",
  "assistant.bearer.missing":
    "לא נשלח טוקן התחברות — רענן את הדף או התחבר מחדש. בלי זה השרת מטפל בך כאורח.",
  "assistant.welcome.title": "מה אפשר לעשות כאן?",
  "assistant.welcome.subtitleGuest":
    "אני מכיר את המערכת — בלי התחברות אין לי גישה לדוחות או למספרים האישיים שלך.",
  "assistant.welcome.subtitleDashboard":
    "אני רואה את הדוחות ששמרת בחשבון (עד מספר מוגבל בכל שיחה) ויכול לעזור לפרש, להשוות ולחשב ממוצעים.",
  "assistant.welcome.section.canDo": "מה אני יודע לעשות",
  "assistant.welcome.canDo.guest":
    "• להסביר איך מעלים טופס 106 או ממלאים טופס ידני\n• לכוון לרישום, התחברות והיסטוריה בתפריט\n• לענות בעקרון על מושגים: החזר משוער, חישוב במערכת, מה המערכת לא מחליפה",
  "assistant.welcome.canDo.dashboard":
    "• להסביר מספרים מהדוח האחרון והדוחות השמורים (הכנסה, מס ששולם, החזר, מס גולמי/נטו)\n• להשוות בין שנים ולחשב ממוצעים על פני כמה דוחות\n• לעזור להבין את פירוט החישוב כשיש טקסט פירוט בדוח",
  "assistant.welcome.section.askYou": "כדי לדייק — על מה נתמקד?",
  "assistant.welcome.askYou.guest":
    "האם תרצה עזרה בהעלאת מסמך, בהתחברות לחשבון, או בהבנת איך עובד חישוב ההחזר?",
  "assistant.welcome.askYou.dashboard":
    "האם מעניין אותך בעיקר ההחזר, השוואה בין דוחות, או הסבר פשוט של המספרים?",
};

const en: Dict = {
  "nav.navigation": "Navigation",
  "nav.dashboard": "Dashboard",
  "nav.incomes": "Upload",
  "nav.history": "History",
  "nav.settings": "Settings",
  "nav.profile": "Profile",
  "app.title": "Tax Refund",
  "app.subtitle": "Personal tax refund",
  "app.brand": "Financial Architect",
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
  "nav.assistant": "Tax assistant",
  "auth.assistant.open": "Chat with the tax assistant (general questions)",
  "auth.assistant.close": "Close tax assistant",
  "assistant.title": "Smart tax assistant",
  "assistant.subtitle": "Questions about the app and tax refunds",
  "assistant.disclaimer.personalized":
    "Answers use data saved in your account and your latest report only — not external sources.",
  "assistant.disclaimer.general":
    "General answers only — no personal data. Sign in for personalized help.",
  "assistant.placeholder": "Type a question…",
  "assistant.send": "Send",
  "assistant.thinking": "Thinking…",
  "assistant.llm.offBanner":
    "Server: no LLM configured (missing OPENAI_API_KEY or CHAT_LLM_ENABLED=0) — replies use built-in rules, not AI.",
  "assistant.empty":
    "Type freely in the field below — for example: How do I upload form 106? Why is my latest refund zero?",
  "assistant.error.generic": "Could not send message",
  "assistant.error.retry": "The server did not respond. Please try again shortly.",
  "assistant.loadingHistory": "Loading chat history…",
  "assistant.bearer.ok":
    "Signed in — your saved reports are loaded for personalized answers.",
  "assistant.bearer.missing":
    "No auth token is being sent — refresh or sign in again. Without it the server treats you as a guest.",
  "assistant.welcome.title": "What can you do here?",
  "assistant.welcome.subtitleGuest":
    "I know how the app works — without signing in I cannot see your reports or personal numbers.",
  "assistant.welcome.subtitleDashboard":
    "I can use your saved reports (up to a limit per chat) to explain, compare and compute averages.",
  "assistant.welcome.section.canDo": "What I can help with",
  "assistant.welcome.canDo.guest":
    "• Explain how to upload form 106 or use the manual form\n• Point you to sign-up, sign-in and history in the menu\n• Explain concepts: estimated refund, in-app calculation, what we do not replace",
  "assistant.welcome.canDo.dashboard":
    "• Explain numbers from your latest and saved reports (income, tax paid, refund, gross/net tax)\n• Compare years and averages across multiple saved reports\n• Help interpret calculation text when your report includes an explanation",
  "assistant.welcome.section.askYou": "To focus — what do you need?",
  "assistant.welcome.askYou.guest":
    "Do you need help uploading a document, signing in, or understanding how the refund estimate works?",
  "assistant.welcome.askYou.dashboard":
    "Are you mainly interested in your refund, comparing reports, or a plain-language explanation of the numbers?",
};

export function getDict(lang: Language): Dict {
  return lang === "en" ? en : he;
}

