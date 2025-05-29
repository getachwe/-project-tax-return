import React, { useState } from "react";
import { Dialog } from "@headlessui/react";

export const Footer: React.FC = () => {
  const [openDialog, setOpenDialog] = useState<
    null | "terms" | "privacy" | "contact"
  >(null);
  return (
    <footer className="bg-white border-t border-gray-200 mt-10">
      <div className="max-w-7xl mx-auto py-3 px-4 sm:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-right">
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} מחשבון החזרי מס. כל הזכויות שמורות.
          </p>
        </div>
        <div className="flex gap-5">
          <button
            type="button"
            onClick={() => setOpenDialog("terms")}
            className="text-gray-600 hover:text-blue-600 font-normal text-sm transition-colors duration-200"
          >
            תנאי שימוש
          </button>
          <button
            type="button"
            onClick={() => setOpenDialog("privacy")}
            className="text-gray-600 hover:text-blue-600 font-normal text-sm transition-colors duration-200"
          >
            מדיניות פרטיות
          </button>
          <button
            type="button"
            onClick={() => setOpenDialog("contact")}
            className="text-gray-600 hover:text-blue-600 font-normal text-sm transition-colors duration-200"
          >
            צור קשר
          </button>
        </div>
      </div>
      {/* Dialogs */}
      <Dialog
        open={openDialog === "terms"}
        onClose={() => setOpenDialog(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-gray-100">
            <Dialog.Title className="text-xl font-bold mb-2 text-center text-blue-700">
              תנאי שימוש
            </Dialog.Title>
            <div className="text-gray-700 text-center mb-4 space-y-2 rtl">
              <p>השימוש באתר ובמחשבון החזרי מס ניתן כשירות חינמי למשתמשים.</p>
              <p>המשתמש מתחייב להזין נתונים נכונים ומדויקים.</p>
              <p>
                האתר אינו אחראי לכל נזק ישיר או עקיף שייגרם כתוצאה מהשימוש
                במחשבון.
              </p>
              <p>
                החישוב המוצג הינו להערכה בלבד ואינו מהווה תחליף לייעוץ מקצועי.
              </p>
              <p>האתר שומר לעצמו את הזכות לעדכן את תנאי השימוש בכל עת.</p>
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
        open={openDialog === "privacy"}
        onClose={() => setOpenDialog(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-gray-100">
            <Dialog.Title className="text-xl font-bold mb-2 text-center text-blue-700">
              מדיניות פרטיות
            </Dialog.Title>
            <div className="text-gray-700 text-center mb-4 space-y-2 rtl">
              <p>
                האתר אינו שומר נתונים אישיים של המשתמשים מעבר לזמן השימוש בפועל.
              </p>
              <p>
                כל המידע שמוזן במחשבון נשמר באופן מקומי בלבד ואינו מועבר לצדדים
                שלישיים.
              </p>
              <p>
                האתר עושה שימוש בעוגיות (Cookies) לצורך שיפור חוויית המשתמש
                בלבד.
              </p>
              <p>לשאלות בנושא פרטיות ניתן לפנות אלינו דרך טופס "צור קשר".</p>
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
        open={openDialog === "contact"}
        onClose={() => setOpenDialog(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl border border-gray-100">
            <Dialog.Title className="text-xl font-bold mb-2 text-center text-blue-700">
              צור קשר
            </Dialog.Title>
            <div className="text-gray-700 text-center mb-4 space-y-2 rtl">
              <p>נשמח לעמוד לרשותכם בכל שאלה, הערה או בקשה.</p>
              <p>
                ניתן ליצור קשר באמצעות דוא"ל:{" "}
                <a
                  href="mailto:support@tax-return.co.il"
                  className="text-blue-700 underline"
                >
                  support@tax-return.co.il
                </a>
              </p>
              <p>או באמצעות טופס יצירת קשר באתר.</p>
              <p>הצוות שלנו ישמח לסייע ולענות בהקדם האפשרי.</p>
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
    </footer>
  );
};
