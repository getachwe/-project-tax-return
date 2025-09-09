import React, { useEffect, useState } from "react";
import { Calculator } from "lucide-react";
import { Dialog } from "@headlessui/react";
import { AuthPanel } from "./AuthPanel";

export const Header: React.FC = () => {
  const [openDialog, setOpenDialog] = useState<
    null | "help" | "about" | "auth"
  >(null);
  useEffect(() => {
    const hasToken = new URLSearchParams(location.hash.replace(/^#/, "")).get(
      "access_token"
    );
    if (hasToken) setOpenDialog("auth");
    const close = () => setOpenDialog(null);
    window.addEventListener("auth:loggedIn", close);
    window.addEventListener("auth:loggedOut", close);
    return () => {
      window.removeEventListener("auth:loggedIn", close);
      window.removeEventListener("auth:loggedOut", close);
    };
  }, []);
  return (
    <header className="bg-white border-b border-gray-200">
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
              <AuthStatus onOpen={() => setOpenDialog("auth")} />
            </li>
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
              {new URLSearchParams(location.hash.replace(/^#/, "")).get(
                "access_token"
              )
                ? "איפוס סיסמה"
                : "כניסה למערכת"}
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

const AuthStatus: React.FC<{ onOpen: () => void }> = ({ onOpen }) => {
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
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!token) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="text-gray-600 hover:text-blue-600 font-normal transition-colors duration-200"
      >
        התחברות
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 transition"
        title={email}
      >
        <span className="inline-block h-6 w-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
          {email?.[0]?.toUpperCase() || "U"}
        </span>
        <span className="text-sm max-w-[12rem] truncate">{email}</span>
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
          <button
            className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => {
              localStorage.removeItem("authToken");
              setOpen(false);
              window.dispatchEvent(new StorageEvent("storage"));
            }}
          >
            התנתק
          </button>
        </div>
      )}
    </div>
  );
};
