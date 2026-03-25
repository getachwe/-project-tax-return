import React, { useEffect, useState } from "react";
import {
  Bell,
  ChevronDown,
  History,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Dialog } from "@headlessui/react";
import { AuthPanel } from "./auth/AuthPanel";
import { useI18n } from "../i18n/useI18n";
import { BrandLockup } from "./ui/BrandMark";
import { exitGuestExploreSession } from "../utils/guestMode";

export type HeaderProps = {
  variant?: "marketing" | "dashboard";
  /** מצב סיור ללא התחברות — מוצג באנר ופעולות אורח בשורת המשתמש */
  guestExplore?: boolean;
};

export const Header: React.FC<HeaderProps> = ({
  variant = "marketing",
  guestExplore = false,
}) => {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const [openDialog, setOpenDialog] = useState<
    null | "help" | "about" | "auth"
  >(null);
  const [loginToast, setLoginToast] = useState<string | null>(null);

  useEffect(() => {
    const onHelp = () => setOpenDialog("help");
    window.addEventListener("dashboard:openHelp", onHelp);
    return () => window.removeEventListener("dashboard:openHelp", onHelp);
  }, []);

  useEffect(() => {
    const openAuth = () => setOpenDialog("auth");
    window.addEventListener("open-auth", openAuth);
    return () => window.removeEventListener("open-auth", openAuth);
  }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.hash.replace(/^#/, ""));
      const access = params.get("access_token");
      const type = params.get("type");
      if (access) {
        localStorage.setItem("authToken", access);
        window.dispatchEvent(new StorageEvent("storage"));
        try {
          const payload = JSON.parse(
            atob(
              (access.split(".")[1] || "").replace(/-/g, "+").replace(/_/g, "/")
            )
          );
          const email = payload?.email ? String(payload.email) : "";
          if (email && type !== "recovery") {
            setLoginToast(`מחובר כ־${email}`);
            setTimeout(() => setLoginToast(null), 2500);
          }
        } catch {
          // ignore jwt parse errors
        }
        if (type === "recovery") {
          setOpenDialog("auth");
        } else {
          setOpenDialog(null);
        }
        history.replaceState(null, "", location.pathname + location.search);
      }
    } catch {
      // ignore
    }

    const close = () => setOpenDialog(null);
    window.addEventListener("auth:loggedIn", close);
    window.addEventListener("auth:loggedOut", close);
    return () => {
      window.removeEventListener("auth:loggedIn", close);
      window.removeEventListener("auth:loggedOut", close);
    };
  }, []);

  useEffect(() => {
    if (openDialog === "auth") {
      try {
        const token = localStorage.getItem("authToken");
        if (token) setOpenDialog(null);
      } catch {
        // ignore
      }
    }
  }, [openDialog]);

  const navClass = (path: string) => {
    const on =
      path === "/"
        ? pathname === "/" || pathname === "/results"
        : pathname === path;
    return [
      "text-sm font-medium pb-1 border-b-2 transition-colors",
      on
        ? "text-[#006D4E] border-[#00A86B]"
        : "text-[#64748b] border-transparent hover:text-[#131b2e]",
    ].join(" ");
  };

  return (
    <header
      className={
        variant === "dashboard"
          ? "bg-white border-b border-[#e8eaf2] shadow-sm"
          : "bg-white/80 backdrop-blur border-b border-border"
      }
      dir="rtl"
    >
      {loginToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-[#006D4E] text-white px-4 py-2 rounded-full shadow-lg z-[60] text-sm">
          {loginToast}
        </div>
      )}
      <div
        className={
          variant === "dashboard"
            ? "max-w-[1920px] mx-auto h-14 px-4 sm:px-6 flex items-center justify-between gap-4"
            : "max-w-7xl mx-auto py-3 px-4 sm:px-8 flex items-center justify-between"
        }
      >
        {variant === "dashboard" ? (
          <>
            <div className="flex items-center gap-8 min-w-0">
              <span className="text-lg font-extrabold text-[#006D4E] shrink-0">
                {t("app.title")}
              </span>
              <nav className="hidden md:flex items-center gap-8">
                <NavLink to="/" end className={() => navClass("/")}>
                  {t("header.dashboard")}
                </NavLink>
                <NavLink to="/incomes" className={() => navClass("/incomes")}>
                  {t("nav.incomes")}
                </NavLink>
                <NavLink to="/history" className={() => navClass("/history")}>
                  {t("nav.history")}
                </NavLink>
              </nav>
            </div>
            <DashboardUserBar guestExplore={guestExplore} />
          </>
        ) : (
          <>
            <BrandLockup
              size="sm"
              title={t("app.title")}
              subtitle={t("app.subtitle")}
            />
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <button
                type="button"
                onClick={() => setOpenDialog("help")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("header.help")}
              </button>
              <button
                type="button"
                onClick={() => setOpenDialog("about")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("header.about")}
              </button>
            </nav>
          </>
        )}
      </div>

      {variant === "dashboard" && guestExplore && (
        <div
          className="bg-amber-50 border-b border-amber-200 text-amber-950 text-xs sm:text-sm px-4 py-2 text-center"
          dir="rtl"
        >
          <span className="font-semibold">מצב אורח:</span> אין שמירת דוחות
          בשרת ואין טיוטת מס בדפדפן — לניסוי המערכת בלבד. סגירת הטאב מסיימת את
          הסשן.
        </div>
      )}

      <Dialog
        open={openDialog === "help"}
        onClose={() => setOpenDialog(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-card p-8 shadow-2xl border border-border">
            <Dialog.Title className="text-xl font-bold mb-2 text-center text-foreground">
              עזרה
            </Dialog.Title>
            <div className="text-muted-foreground text-center mb-4 space-y-2 rtl">
              <p>ברוכים הבאים למחשבון החזרי מס!</p>
              <p>
                באמצעות כלי זה תוכלו לבדוק בקלות ובמהירות האם מגיע לכם החזר מס
                מהמדינה.
              </p>
              <p>
                להתחלת השימוש, העלו את טופס 106 או הזינו את הנתונים הרלוונטיים
                ידנית.
              </p>
              <p>בכל שלב ניתן לחזור אחורה, לעדכן נתונים או להתחיל חישוב חדש.</p>
              <p>
                אם נתקלתם בבעיה, ניתן לפנות אלינו דרך טופס &quot;צור קשר&quot;
                בתחתית העמוד.
              </p>
            </div>
            <div className="flex justify-center">
              <button
                className="btn-primary"
                onClick={() => setOpenDialog(null)}
              >
                סגור
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
      <Dialog
        open={openDialog === "about"}
        onClose={() => setOpenDialog(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-card p-8 shadow-2xl border border-border">
            <Dialog.Title className="text-xl font-bold mb-2 text-center text-foreground">
              אודות
            </Dialog.Title>
            <div className="text-muted-foreground text-center mb-4 space-y-2 rtl">
              <p>
                מחשבון החזרי מס פותח במטרה להנגיש לכל אזרח את האפשרות לבדוק
                זכאות להחזר מס בצורה פשוטה, מהירה וללא עלות.
              </p>
              <p>
                המערכת עושה שימוש בנתונים שמוזנים על ידכם בלבד, ואינה שומרת או
                מעבירה מידע לצדדים שלישיים.
              </p>
              <p>
                החישוב מבוסס על כללי רשות המיסים בישראל, אך אינו מהווה ייעוץ מס
                אישי.
              </p>
              <p>לשאלות נוספות ניתן לפנות אלינו דרך טופס &quot;צור קשר&quot;.</p>
            </div>
            <div className="flex justify-center">
              <button
                className="btn-primary"
                onClick={() => setOpenDialog(null)}
              >
                סגור
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
      <Dialog
        open={openDialog === "auth"}
        onClose={() => setOpenDialog(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-card p-8 shadow-2xl border border-border">
            <Dialog.Title className="text-xl font-bold mb-2 text-center text-foreground">
              {(() => {
                try {
                  const p = new URLSearchParams(
                    location.hash.replace(/^#/, "")
                  );
                  return p.get("type") === "recovery"
                    ? "איפוס סיסמה"
                    : "כניסה למערכת";
                } catch {
                  return "כניסה למערכת";
                }
              })()}
            </Dialog.Title>
            <AuthPanel />
            <div className="flex justify-center mt-4">
              <button
                className="btn-primary"
                onClick={() => setOpenDialog(null)}
              >
                סגור
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </header>
  );
};

const DashboardUserBar: React.FC<{ guestExplore?: boolean }> = ({
  guestExplore = false,
}) => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [ping, setPing] = useState(false);

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

    const onStorage = () => {
      const nt = localStorage.getItem("authToken");
      setToken(nt);
      setEmail(getEmailFromToken(nt));
    };

    const onLoggedIn = () => {
      const nt = localStorage.getItem("authToken");
      setToken(nt);
      setEmail(getEmailFromToken(nt));
    };

    const onLoggedOut = () => {
      setToken(null);
      setEmail("");
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("auth:loggedIn", onLoggedIn);
    window.addEventListener("auth:loggedOut", onLoggedOut);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth:loggedIn", onLoggedIn);
      window.removeEventListener("auth:loggedOut", onLoggedOut);
    };
  }, []);

  if (guestExplore && !token) {
    return (
      <div className="flex items-center gap-2 shrink-0" dir="rtl">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("open-auth"))}
          className="text-sm font-semibold text-[#006D4E] hover:underline px-2 py-1 rounded-lg"
        >
          התחברות
        </button>
        <button
          type="button"
          onClick={() => {
            exitGuestExploreSession();
            window.dispatchEvent(new CustomEvent("auth:loggedOut"));
            navigate("/");
          }}
          className="text-sm rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-amber-900 hover:bg-amber-100"
        >
          סיום סיור
        </button>
      </div>
    );
  }

  if (!token) return null;

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <button
        type="button"
        className="relative p-2 rounded-full text-[#64748b] hover:bg-[#E6E9FF]/80 transition-colors"
        aria-label="התראות"
        onClick={() => {
          setPing(true);
          setTimeout(() => setPing(false), 2000);
        }}
      >
        <Bell className="h-5 w-5" />
        {ping && (
          <span className="absolute top-1.5 left-1.5 h-2 w-2 rounded-full bg-[#00A86B]" />
        )}
      </button>
      <button
        type="button"
        onClick={() => navigate("/settings")}
        className="p-2 rounded-full text-[#64748b] hover:bg-[#E6E9FF]/80 transition-colors"
        aria-label="הגדרות"
      >
        <Settings className="h-5 w-5" />
      </button>
      <div className="relative mr-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 p-1 rounded-full border border-[#e8eaf2] bg-[#faf8f3] hover:bg-[#f3eee6] transition-colors"
          title={email}
          aria-expanded={open}
        >
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
            <User className="h-4 w-4 text-amber-800/80" />
          </div>
          <ChevronDown className="w-4 h-4 text-[#64748b] hidden sm:block pr-1" />
        </button>
        {open && (
          <div className="absolute left-0 mt-2 w-56 bg-white border border-[#e8eaf2] rounded-xl shadow-xl overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-[#e8eaf2] text-right">
              <p className="text-xs text-muted-foreground">מחובר כ:</p>
              <p className="text-sm font-medium text-foreground truncate">
                {email}
              </p>
            </div>
            <button
              className="w-full text-right px-4 py-3 text-sm text-foreground hover:bg-[#E6E9FF]/50 flex items-center gap-3"
              onClick={() => {
                setOpen(false);
                navigate("/profile");
              }}
            >
              <User className="h-4 w-4 text-[#006D4E]" />
              פרופיל
            </button>
            <button
              className="w-full text-right px-4 py-3 text-sm text-foreground hover:bg-[#E6E9FF]/50 flex items-center gap-3"
              onClick={() => {
                setOpen(false);
                navigate("/history");
              }}
            >
              <History className="h-4 w-4 text-[#006D4E]" />
              היסטוריה
            </button>
            <button
              className="w-full text-right px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
              onClick={() => {
                localStorage.removeItem("authToken");
                localStorage.removeItem("lastActivity");
                setOpen(false);
                window.dispatchEvent(new CustomEvent("auth:loggedOut"));
              }}
            >
              <LogOut className="h-4 w-4" />
              התנתק
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
