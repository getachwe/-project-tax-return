import React, { useState } from "react";
import { Calculator } from "lucide-react";
import { Dialog } from "@headlessui/react";

export const Header: React.FC = () => {
  const [openDialog, setOpenDialog] = useState<null | "help" | "about">(null);
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
    </header>
  );
};
