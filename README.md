# Hebrew Tax Refund Calculator

מערכת מחשבון החזרי מס - פרויקט Fullstack מודרני הכולל פרונטנד (React + Vite + Tailwind) ובקאנד (Node.js + Express).
המערכת מאפשרת חישוב החזר מס, העלאת מסמכים, הפקת PDF, וממשק משתמש נוח בעברית.

---

## תוכן עניינים

- [תיאור כללי](#תיאור-כללי)
- [טכנולוגיות עיקריות](#טכנולוגיות-עיקריות)
- [מבנה הפרויקט](#מבנה-הפרויקט)
- [התקנה והרצה](#התקנה-והרצה)
- [קבצים רגישים](#קבצים-רגישים)
- [דוגמה לשימוש](#דוגמה-לשימוש)
- [תרומות](#תרומות)

---

## תיאור כללי

המערכת כוללת:

- **פרונטנד**: אפליקציית React מודרנית עם Tailwind CSS, טפסים, ולוגיקה מתקדמת.
- **בקאנד**: שרת Express שמבצע חישובי מס, הפקת PDF, עיבוד קבצים, ועוד.
- **העלאת מסמכים**: תמיכה ב-upload, OCR, ויצירת דוחות PDF.
- **UI בעברית**: ממשק RTL, נגישות, ועיצוב מודרני.

---

## טכנולוגיות עיקריות

- React 18, Vite, TypeScript, Tailwind CSS, ShadCN/UI
- Node.js, Express, Multer, Puppeteer, Tesseract.js, PDFKit, PDFMake
- ESLint, Zod, React Hook Form, ועוד

---

## מבנה הפרויקט

```
project-tax-return/
│
├── project/      # קוד הפרונטנד (React)
│   ├── src/
│   ├── public/
│   ├── index.html
│   └── ...
│
├── backend/      # קוד הבקאנד (Node.js/Express)
│   ├── server.js
│   ├── pdfGenerator.js
│   ├── ...
│
├── package.json
├── package-lock.json
└── README.md
```

---

## התקנה והרצה

### דרישות מוקדמות

- Node.js (מומלץ 18+)
- npm

### התקנה

1. התקנת תלויות לפרונטנד ולבקאנד:

   ```bash
   cd project
   npm install
   cd ../backend
   npm install
   cd ..
   ```

2. יצירת קבצי סביבה (אם צריך):
   - `project/.env` - משתני סביבה לפרונטנד (למשל VITE_API_URL)
   - `backend/.env` - משתני סביבה לבקאנד (למשל DB_CONNECTION_STRING, API_KEY)

### הרצה בפיתוח (Development)

1. חזור לשורש הפרויקט:

   ```bash
   cd project-tax-return
   ```

2. הרץ את שני השרתים במקביל:

   ```bash
   cd project
   npm run start:all
   ```

   או ידנית:

   ```bash
   # טרמינל 1
   cd project
   npm run dev

   # טרמינל 2
   cd backend
   npm start
   ```

3. היישום יהיה זמין בכתובת:
   ```
   http://localhost:5173
   ```

### בניית פרונטנד לפרודקשן

```bash
cd project
npm run build
```

---

## קבצים רגישים

- קבצי ‎.env‎, ‎node_modules‎, ‎uploads‎, ‎temp‎, ‎pdfs‎, ‎dist‎, קבצי לוגים, ותיקיות מערכת - מוחרגים אוטומטית ולא עולים ל-GitHub.
- אין להעלות מפתחות API, סיסמאות, או מידע רגיש אחר.

---

## דוגמה לשימוש

- מלא את הטופס עם נתוני ההכנסה והמשפחה.
- העלה מסמכים רלוונטיים (טופס 106, קבלות).
- קבל חישוב החזר מס, הורד דוח PDF, או שלח במייל.

---

## תרומות

נשמח לכל תרומה, פידבק, או Pull Request!
לשאלות, פנה אלינו דרך Issues ברפוזיטורי.
