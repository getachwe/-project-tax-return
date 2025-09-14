import React, { useEffect, useState } from "react";
import { Calculator, ChevronDown, History, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog } from "@headlessui/react";
import { AuthPanel } from "./AuthPanel";

export const Header: React.FC = () => {
  const [openDialog, setOpenDialog] = useState<
    null | "help" | "about" | "auth"
  >(null);
  const [loginToast, setLoginToast] = useState<string | null>(null);
  useEffect(() => {
    // Handle Supabase redirect params from email links
    try {
      const params = new URLSearchParams(location.hash.replace(/^#/, ""));
      const access = params.get("access_token");
      const type = params.get("type");
      if (access) {
        // Save session token and treat as logged in for confirmation/magic links
        localStorage.setItem("authToken", access);
        // notify listeners (Header AuthStatus listens to storage)
        window.dispatchEvent(new StorageEvent("storage"));
        // show small toast
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
        // For password recovery keep dialog open; otherwise close
        if (type === "recovery") {
          setOpenDialog("auth");
        } else {
          setOpenDialog(null);
        }
        // Clean the hash from URL
        history.replaceState(null, "", location.pathname + location.search);
      }
    } catch {
      // ignore parsing errors for URL hash params
    }

    const close = () => setOpenDialog(null);
    window.addEventListener("auth:loggedIn", close);
    window.addEventListener("auth:loggedOut", close);
    return () => {
      window.removeEventListener("auth:loggedIn", close);
      window.removeEventListener("auth:loggedOut", close);
    };
  }, []);

  // If dialog opened while already logged-in, close it immediately
  useEffect(() => {
    if (openDialog === "auth") {
      try {
        // If there is a valid token, auto-close the auth dialog
        const token = localStorage.getItem("authToken");
        if (token) setOpenDialog(null);
      } catch {
        // ignore
      }
    }
  }, [openDialog]);
  return (
    <header className="bg-white border-b border-gray-200">
      {loginToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow z-[60]">
          {loginToast}
        </div>
      )}
      <div className="max-w-7xl mx-auto py-3 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-7 w-7 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-800 tracking-tight">
            מחשבון החזרי מס
          </h1>
        </div>
        <nav>
          <ul className="flex gap-5">
            <li>
              <button
                type="button"
                onClick={() => setOpenDialog("help")}
                className="text-gray-600 hover:text-blue-600 font-normal transition-colors duration-200"
              >
                עזרה
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setOpenDialog("about")}
                className="text-gray-600 hover:text-blue-600 font-normal transition-colors duration-200"
              >
                אודות
              </button>
            </li>
            <li>
              <AuthStatus />
            </li>
            {/* הוסר קישור היסטוריה מפה; קיים בתפריט המשתמש */}
          </ul>
        </nav>
      </div>
      {/* Dialogs */}
      <Dialog
        open={openDialog === "help"}
        onClose={() => setOpenDialog(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-gray-100">
            <Dialog.Title className="text-xl font-bold mb-2 text-center text-blue-700">
              עזרה
            </Dialog.Title>
            <div className="text-gray-700 text-center mb-4 space-y-2 rtl">
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
                אם נתקלתם בבעיה, ניתן לפנות אלינו דרך טופס "צור קשר" בתחתית
                העמוד.
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
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-gray-100">
            <Dialog.Title className="text-xl font-bold mb-2 text-center text-blue-700">
              אודות
            </Dialog.Title>
            <div className="text-gray-700 text-center mb-4 space-y-2 rtl">
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
              <p>לשאלות נוספות ניתן לפנות אלינו דרך טופס "צור קשר".</p>
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
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-gray-100">
            <Dialog.Title className="text-xl font-bold mb-2 text-center text-blue-700">
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

const AuthStatus: React.FC = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);

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

  // כאשר אין טוקן לא מציגים כלום (הכניסה מתבצעת בעמוד הראשי)
  if (!token) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 transition"
        title={email}
      >
        <User className="h-5 w-5 text-blue-600" />
        <span className="text-sm">החשבון שלי</span>
        <span className="text-sm max-w-[12rem] truncate hidden sm:inline">
          {email}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs text-gray-500">מחובר כ:</p>
            <p className="text-sm font-medium text-gray-800 truncate">
              {email}
            </p>
          </div>
          <button
            className="w-full text-right px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            onClick={() => {
              setOpen(false);
              navigate("/history");
            }}
          >
            <History className="h-4 w-4 text-blue-600" />
            היסטוריה
          </button>
          <button
            className="w-full text-right px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            onClick={() => {
              localStorage.removeItem("authToken");
              setOpen(false);
              window.dispatchEvent(new StorageEvent("storage"));
            }}
          >
            <LogOut className="h-4 w-4 text-red-600" />
            התנתק
          </button>
        </div>
      )}
    </div>
  );
};
