## פיצ'ר: היסטוריית דוחות למשתמשים (Backend + Client)

### מטרת הפיצ'ר

- לאפשר לכל משתמש לראות את כל הדוחות שהופקו עבורו עד היום, להוריד אותם, לסנן לפי שנה, ולמחוק במידת הצורך.

---

## צד שרת (Backend)

### מודל נתונים חדש: `reports`

- עמודות מוצעות:
  - `id` (UUID, PK)
  - `user_id` (UUID, FK ל־`auth.users`)
  - `tax_data` (JSONB) — נתוני המקור מהטופס/קלט (למשל מפענוח 106)
  - `calculation_result` (JSONB) — תוצאות החישוב שנכנסו ל־PDF
  - `storage_path` (TEXT) — הנתיב ב־Supabase Storage (bucket: `reports`)
  - `file_name` (TEXT) — שם קובץ ידידותי למשתמש (למשל "Dana_Levi-2024.pdf")
  - `year` (INTEGER) — שנת המס
  - `created_at` (TIMESTAMPTZ)

### RLS Policies

- הפעלה של RLS על הטבלה `reports`.
- מתן גישה (SELECT/INSERT/DELETE) רק ל־`auth.uid() = user_id`.
- אופציונלי: למנוע DELETE אם צריך שמירה לטווח ארוך.

### Supabase Storage

- יצירת bucket פרטי בשם `reports`.
- העלאת קובצי PDF ל־Storage ומחיקה של קובץ זמני מקומי לאחר העלאה.
- הורדה באמצעות Signed URLs קצרי תוקף.

### ראוטים חדשים

- `POST /api/reports`

  - קלט: `{ taxData, calculationResult?, fileName?, year? }`.
  - פעולה: אם אין `calculationResult` — מחשבים; יוצרים PDF; מעלים ל־Storage; מוסיפים שורת `reports`; מחזירים את הרשומה שנוצרה.
  - אימות: Bearer token חובה.

- `GET /api/reports`

  - מחזיר רשימת דוחות של המשתמש המחובר, ממוינים לפי `created_at DESC`.
  - פרמטרים אופציונליים: `year`, `q` (חיפוש בטקסט/שם קובץ), `page`, `pageSize`.

- `GET /api/reports/:id/download`

  - יוצר Signed URL לקובץ ב־Storage ומחזיר אותו ללקוח להורדה/צפייה.

- אופציונלי: `DELETE /api/reports/:id`
  - מוחק רשומה מה־DB ואת הקובץ מה־Storage.

### עדכוני ראוטים קיימים (אופציונלי)

- `POST /api/generate-tax-return-pdf`
  - תמיכה בפרמטר `save=true` לשמירה אוטומטית של הדוח גם ב־`reports`.
  - לחלופין, להשאיר כ"מחולל" בלבד ולהשתמש רק ב־`POST /api/reports` לשמירה רשמית.

### אבטחה

- אימות Bearer token בכל הראוטים החדשים.
- RLS בטבלת `reports` + bucket פרטי ב־Storage.

### מיגרציה (DDL) מוצעת

```sql
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  tax_data JSONB NOT NULL,
  calculation_result JSONB NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- אופציונלי (אם מאפשרים מחיקה ע"י המשתמש):
CREATE POLICY "Users can delete own reports" ON reports
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX reports_user_id_created_idx ON reports(user_id, created_at DESC);
CREATE INDEX reports_user_id_year_idx ON reports(user_id, year);
```

---

## צד לקוח (Client)

### UI/UX (Tailwind + shadcn/ui)

- דף/טאב "היסטוריה":
  - Header + פילטרים: שנה, חיפוש טקסט חופשי.
  - טבלה/רשימה:
    - עמודות: שם קובץ, שנה, תאריך יצירה, פעולות.
    - פעולות בשורה: "הורדה/צפייה", "מחיקה" (אם מאושר), "פרטים".
  - Empty state כשאין דוחות.
  - Pagination או Infinite Scroll.

### זרימת שמירה

- לאחר חישוב/יצירת דוח במסכים קיימים, יוצג כפתור "שמור להיסטוריה" שקורא ל־`POST /api/reports`.
- Toasts להצלחה/כשלון.

### לקוח API

- פונקציות:
  - `getReports({ year?, q?, page?, pageSize? })`
  - `createReport({ taxData, calculationResult?, fileName?, year? })`
  - `getReportDownloadUrl(id)`
  - `deleteReport(id)` (אם מאפשרים מחיקה)
- שימוש ב־Bearer token קיים.

---

## תאימות לאחור

- הראוטים הקיימים (`process-106`, `generate-tax-return-pdf`, `send-tax-return-email`) ימשיכו לפעול ללא שינוי.
- ניתן להוסיף דגל `save=true` למחולל ה־PDF או לקרוא ל־`/api/reports` לאחר אישור המשתמש.

## ביצועים וניקיון

- מחיקת קובץ PDF זמני לאחר העלאה ל־Storage.
- שימוש ב־stream ליצירת PDF.
- Pagination בצד שרת (ברירת מחדל עמוד 1).

## בדיקות וקצה

- בדיקות הרשאות (משתמש לא ניגש לדוחות של אחרים).
- בדיקת Signed URL שפג תוקפו.
- בדיקת קבצים חסרים ב־Storage וסנכרון עם DB בעת מחיקה.
