# רשימת הצעדים – Vercel (פרונט) + Render (בקאנד)

## 1. Vercel – משתני סביבה (Environment Variables)

ב-[Vercel Dashboard](https://vercel.com/dashboard) → בחרי את הפרויקט → **Settings** → **Environment Variables**

הוסיפי:

| משתנה | ערך | הערה |
|-------|-----|------|
| `VITE_API_URL` | `https://YOUR-SERVICE.onrender.com` | **חובה** – כתובת ה־Render (ללא סלאש בסוף) |
| `FRONTEND_URL` | `https://project-tax-return.vercel.app` | אופציונלי – אם הדומיין שלך שונה, עדכני |

**החלפי** `YOUR-SERVICE` בשם השירות המדויק שלך ב־Render (ניתן לראות ב־URL של הדשבורד).

אחרי עדכון משתנים – **Redeploy** את הפרויקט (Deployments → ⋮ → Redeploy).

---

## 2. Render – משתני סביבה (Environment Variables)

ב-[Render Dashboard](https://dashboard.render.com) → בחרי את ה־Web Service → **Environment** → **Environment Variables**

הוסיפי את **כל** המשתנים מה־`.env` המקומי:

| משתנה | חובה? |
|-------|-------|
| `SUPABASE_URL` | ✅ |
| `SUPABASE_ANON_KEY` | ✅ |
| `SUPABASE_SERVICE_KEY` | ✅ |
| `FRONTEND_URL` | ✅ (להגדיר `https://project-tax-return.vercel.app`) |
| `SMTP_HOST` | אופציונלי |
| `SMTP_PORT` | אופציונלי |
| `SMTP_USER` | אופציונלי |
| `SMTP_PASS` | אופציונלי |
| `SMTP_FROM` | אופציונלי |
| `GOOGLE_CLIENT_ID` | אם משתמשת ב־Google OAuth |
| `GOOGLE_CLIENT_SECRET` | אם משתמשת ב־Google OAuth |
| `OPENAI_API_KEY` | אם משתמשת ב־LLM |
| `LLM_ENABLED` | אופציונלי |

**Render** קובע את `PORT` אוטומטית – אין צורך להגדיר.

אחרי עדכון – Render יבצע Redeploy אוטומטי.

---

## 3. Supabase – Redirect URLs (להתחברות עם Google)

ב-[Supabase Dashboard](https://app.supabase.com) → **Authentication** → **URL Configuration**

ב-**Redirect URLs** הוסיפי:

- `https://project-tax-return.vercel.app/auth/callback`
- `https://project-tax-return.vercel.app/**` (אופציונלי)

ב-**Site URL** הגדירי: `https://project-tax-return.vercel.app`

---

## 4. CORS בבקאנד

ב־`backend/app.js` כבר מוגדר `https://project-tax-return.vercel.app` כ־origin מותר.

אם הכתובת ב־Vercel שונה (למשל `your-app-xxx.vercel.app`), הוסיפי אותה לרשימת `allowedOrigins` ב־`app.js` ו־**עשי commit + push** כדי ש־Render יעשה deploy חדש.

---

## 5. סדר ביצוע

1. הוסיפי את המשתנים ב־Vercel (כולל `VITE_API_URL`)
2. הוסיפי את המשתנים ב־Render (כולל `FRONTEND_URL`)
3. עדכני את Supabase Redirect URLs
4. Redeploy ב־Vercel
5. בדקי שה־backend ב־Render פעיל (Health check)
6. נסי להתחבר באתר ב־Vercel

---

## 6. בדיקות

- **Health check לבקאנד:** `https://YOUR-SERVICE.onrender.com/health` – צריך להחזיר `{"status":"ok"}`
- **בדיקת פרונט:** פתחי את `https://project-tax-return.vercel.app` ונסי התחברות

---

## הערה – Cold Start ב־Render

ברמת Free, Render מכניס את השירות ל־sleep כשאין תנועה. הבקשה הראשונה עלולה לקחת 30–60 שניות. זו התנהגות צפויה.
