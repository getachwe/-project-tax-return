# Deployment Checklist - בדיקה מקיפה

## בעיות ידועות:

### 1. בפרודקשן - 404 על `/api/auth/*`
**תסמינים:**
- `POST /api/auth/signin` → 404
- `GET /api/auth/google` → 404

**סיבות אפשריות:**
1. ❌ ה-`vercel.json` משתמש ב-`rewrites` במקום `routes` עם `builds` API
2. ❌ ה-serverless function לא נבנה
3. ❌ ה-`api/index.js` לא מוצא את הקבצים
4. ❌ ה-environment variables לא מוגדרים ב-Vercel

**פתרון:**
1. ✅ שינוי `vercel.json` מ-`rewrites` ל-`routes`
2. ✅ בדיקה שה-`api/index.js` עובד מקומית
3. ✅ בדיקה שה-routes מוגדרים נכון ב-`api/app.js`
4. ✅ בדיקה שה-environment variables מוגדרים ב-Vercel

### 2. מקומית - Google OAuth `Unable to exchange external code`
**תסמינים:**
- `Unable to exchange external code: 4/0Ab32j...`

**סיבות אפשריות:**
1. ❌ ה-`redirectTo` URL לא מוגדר ב-Supabase Dashboard
2. ❌ ה-`redirectTo` URL לא תואם בדיוק ל-URL שהוגדר ב-Supabase
3. ❌ ה-Google OAuth Provider לא מוגדר נכון ב-Supabase

**פתרון:**
1. ✅ הוספת `http://localhost:5173/auth/callback` ל-Redirect URLs ב-Supabase Dashboard
2. ✅ בדיקה שה-`redirectTo` בקוד תואם בדיוק ל-URL ב-Supabase
3. ✅ בדיקה שה-Google OAuth Provider מוגדר נכון

## בדיקות לביצוע:

### לפני deployment:
1. ✅ בדוק שה-`vercel.json` משתמש ב-`routes` ולא ב-`rewrites`
2. ✅ בדוק שה-`api/index.js` עובד מקומית
3. ✅ בדוק שה-routes מוגדרים נכון
4. ✅ בדוק שה-environment variables קיימים

### אחרי deployment:
1. ✅ בדוק את ה-logs ב-Vercel Dashboard → Functions → `api/index.js`
2. ✅ בדוק שה-health endpoint עובד: `https://project-tax-return.vercel.app/api/health`
3. ✅ בדוק שה-API routes עובדים
4. ✅ בדוק את ה-logs ב-Supabase Dashboard → Logs → Auth

### לבעיית Google OAuth:
1. ✅ בדוק שה-Redirect URLs מוגדרים ב-Supabase Dashboard
2. ✅ בדוק שה-Google OAuth Provider מוגדר נכון
3. ✅ בדוק את ה-logs ב-Supabase Dashboard → Logs → Auth



