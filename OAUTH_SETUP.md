# Google OAuth Setup Guide

## הבעיה: `Unable to exchange external code`

השגיאה הזו מתרחשת כאשר ה-`redirectTo` URL לא תואם ל-URL שהוגדר ב-Supabase Dashboard.

## פתרון: הגדרת Redirect URLs ב-Supabase

### שלב 1: הגדרת Redirect URLs ב-Supabase Dashboard (חשוב מאוד!)

**השגיאה "Unable to exchange external code" מתרחשת כאשר ה-`redirectTo` URL לא תואם בדיוק ל-URL שהוגדר ב-Supabase Dashboard.**

1. פתח את [Supabase Dashboard](https://app.supabase.com/)
2. בחר את הפרויקט שלך
3. עבור ל-**Authentication** → **URL Configuration**
4. הוסף את ה-URLs הבאים ל-**Redirect URLs** (חשוב: ללא סלאש בסוף):
   - `http://localhost:5173/auth/callback` (לפיתוח מקומי - **חייב** להיות בדיוק כזה)
   - `https://project-tax-return.vercel.app/auth/callback` (לפרודקשן - **חייב** להיות בדיוק כזה)
   
   **אפשרויות נוספות** (אם אתה רוצה לטפל בכל ה-URLs):
   - `http://localhost:5173/**` (כל ה-URLs מקומיים)
   - `https://project-tax-return.vercel.app/**` (כל ה-URLs בפרודקשן)

5. הגדר את ה-**Site URL**:
   - לפיתוח: `http://localhost:5173`
   - לפרודקשן: `https://project-tax-return.vercel.app`
   
   **הערה**: ה-Site URL יכול להיות אחד מהערכים האלה, אבל ה-Redirect URLs חייבים לכלול את ה-URL המדויק עם `/auth/callback`.

6. לחץ על **Save** כדי לשמור את השינויים

### שלב 2: הגדרת משתני סביבה

#### עבור פיתוח מקומי (`.env` בפרויקט):

בתיקייה `api/` או `backend/`, צור קובץ `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
# אל תגדיר FRONTEND_URL בפיתוח מקומי - הקוד יגדיר את זה אוטומטית
```

#### עבור Vercel (Production):

1. פתח את [Vercel Dashboard](https://vercel.com/dashboard)
2. בחר את הפרויקט
3. עבור ל-**Settings** → **Environment Variables**
4. הוסף את המשתנים הבאים:
   - `FRONTEND_URL` = `https://project-tax-return.vercel.app`
   - `SUPABASE_URL` = `https://your-project.supabase.co`
   - `SUPABASE_ANON_KEY` = `your-anon-key`
   - `SUPABASE_SERVICE_KEY` = `your-service-key`

### שלב 3: בדיקה

#### בדיקה מקומית:

1. הפעל את ה-backend:
   ```bash
   cd api
   npm install
   node index.js
   ```
   או אם יש לך `backend/`:
   ```bash
   cd backend
   npm install
   npm start
   ```

2. הפעל את ה-frontend:
   ```bash
   cd project
   npm install
   npm run dev
   ```

3. נסה להתחבר עם Google - זה אמור לעבוד עכשיו!

#### בדיקה בפרודקשן:

1. ודא שה-redeploy ב-Vercel הצליח
2. בדוק את ה-logs ב-Vercel Dashboard
3. נסה להתחבר עם Google - זה אמור לעבוד עכשיו!

## בעיות נפוצות

### 1. השגיאה עדיין מופיעה

- ודא שה-Redirect URLs מוגדרים **בדיוק** ב-Supabase Dashboard
- ודא שה-`FRONTEND_URL` לא מוגדר כשמריץ מקומית
- ודא שה-`FRONTEND_URL` מוגדר נכון ב-Vercel

### 2. השגיאה מופיעה רק בפרודקשן

- ודא שה-`FRONTEND_URL` מוגדר ב-Vercel
- ודא שה-Redirect URL של הפרודקשן מוגדר ב-Supabase Dashboard

### 3. השגיאה מופיעה רק מקומית

- ודא שה-Redirect URL של `http://localhost:5173/auth/callback` מוגדר ב-Supabase Dashboard
- ודא שה-`FRONTEND_URL` לא מוגדר בקובץ `.env` המקומי

## מידע נוסף

- [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)

