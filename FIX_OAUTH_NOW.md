# פתרון מהיר לבעיית Google OAuth

## הבעיה
השגיאה `Unable to exchange external code` מתרחשת כי ה-`redirectTo` URL לא מוגדר נכון ב-Supabase Dashboard.

## פתרון מהיר (5 דקות)

### שלב 1: בדוק מה ה-`redirectTo` בפועל

1. הפעל את ה-backend:
   ```bash
   cd api
   node index.js
   ```

2. פתח את ה-frontend במקום אחר:
   ```bash
   cd project
   npm run dev
   ```

3. לחץ על "התחבר עם Google"

4. בדוק את ה-logs בטרמינל של ה-backend - אתה אמור לראות:
   ```
   === Google OAuth Configuration ===
   redirectTo: http://localhost:5173/auth/callback
   FRONTEND_URL env: (not set - using localhost:5173)
   IMPORTANT: Make sure this URL is configured in Supabase Dashboard:
     → Authentication → URL Configuration → Redirect URLs
     → Add: http://localhost:5173/auth/callback
   ===================================
   ```

5. **העתק את ה-URL המוצג** (כנראה `http://localhost:5173/auth/callback`)

### שלב 2: הגדר את ה-Redirect URLs ב-Supabase Dashboard

1. פתח [Supabase Dashboard](https://app.supabase.com/)
2. בחר את הפרויקט שלך
3. עבור ל-**Authentication** → **URL Configuration**
4. במקטע **Redirect URLs**, לחץ על **Add URL**
5. הכנס את ה-URL הבא **בדיוק כזה** (מה-copy מה-logs):
   ```
   http://localhost:5173/auth/callback
   ```
   **חשוב מאוד:**
   - ללא סלאש בסוף (`/auth/callback` ולא `/auth/callback/`)
   - עם `http://` (לא `https://`)
   - עם פורט `5173`
   - בדיוק כפי שמוצג ב-logs

6. לחץ **Save**

### שלב 3: נסה שוב

1. נסה להתחבר עם Google שוב
2. זה אמור לעבוד עכשיו!

## אם זה עדיין לא עובד

### בדוק את ה-Google OAuth Provider ב-Supabase

1. עבור ל-**Authentication** → **Providers** → **Google**
2. ודא שה-**Enabled** מופעל
3. ודא שיש **Client ID** ו-**Client Secret** מוגדרים
4. ודא שה-**Authorized redirect URIs** ב-Google Console כולל:
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```
   (החלף `YOUR_PROJECT_ID` ב-project ID שלך)

### בדוק את ה-logs ב-Supabase

1. עבור ל-**Logs** → **Auth**
2. חפש הודעות שגיאה הקשורות ל-OAuth
3. זה יעזור לזהות מה הבעיה המדויקת

## הערות חשובות

- ה-`redirectTo` חייב להיות **בדיוק** כמו שהוגדר ב-Supabase Dashboard
- אם שינית את ה-`redirectTo` בקוד, אתה חייב לעדכן את זה גם ב-Supabase Dashboard
- אם יש לך כמה סביבות (local, staging, production), כל אחת צריכה Redirect URL משלה

