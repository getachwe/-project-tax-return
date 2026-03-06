# הכל על Vercel – פרונט ובקאנד יחד

## מה שונה עכשיו

- **פרונט** נבנה מ-`project/`
- **בקאנד** רץ כ-Serverless Function מ-`api/index.js` → טוען את `backend/`
- **כתובת אחת:** `https://project-tax-return.vercel.app`
  - האתר: `/`
  - API: `/api/*` (למשל `/api/auth/signin`, `/api/health`)

---

## צעדי Deploy

### 1. משתני סביבה ב-Vercel

Vercel Dashboard → Project → **Settings** → **Environment Variables**

| משתנה | ערך | הערה |
|-------|-----|------|
| `SUPABASE_URL` | כתובת ה-Supabase | חובה |
| `SUPABASE_ANON_KEY` | מפתח Anon | חובה |
| `SUPABASE_SERVICE_KEY` | מפתח Service Role | חובה |
| `FRONTEND_URL` | `https://project-tax-return.vercel.app` | ל-OAuth |
| `SMTP_*` | פרטי המייל | אופציונלי |

**חשוב:** **אל תגדירי** `VITE_API_URL` – הפרונט ישתמש אוטומטית ב-`/api`.

### 2. מחיקת הגדרות Render (אם לא רצה שם)

אם הכל עובר ל-Vercel, אפשר לכבות או למחוק את השירות ב-Render.

### 3. העלאה ל-Git ו-Deploy

```bash
git add .
git commit -m "Full Vercel deployment: frontend + backend"
git push
```

Vercel ירוץ Deploy אוטומטי.

---

## מגבלות Vercel Serverless

- **Puppeteer:** לא נתמך (גדול מדי) – PDF נוצר עם pdfMake
- **גודל בקשת body:** עד 4.5MB
- **זמן הרצה:** ~10 שניות (Hobby), ~60 שניות (Pro)
- **קבצים זמניים:** בשימוש `/tmp` בלבד

---

## בדיקה מקומית

לפני deploy:

```bash
# טרמינל 1 – פרונט
cd project && npm run dev

# טרמינל 2 – בקאנד
cd backend && npm start
```
