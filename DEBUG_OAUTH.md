# Debugging Google OAuth Issues

## הבעיה: `Unable to exchange external code`

השגיאה הזו מתרחשת כאשר ה-`redirectTo` URL לא תואם בדיוק ל-URL שהוגדר ב-Supabase Dashboard.

## איך לבדוק מה ה-`redirectTo` בפועל?

1. פתח את ה-Console של הדפדפן (F12)
2. לחץ על "התחבר עם Google"
3. בדוק את ה-logs בטרמינל של ה-backend - אתה אמור לראות:
   ```
   Google OAuth redirectTo: http://localhost:5173/auth/callback
   Request origin: http://localhost:5173
   Request referer: http://localhost:5173/auth
   FRONTEND_URL env: undefined
   ```

4. העתק את ה-`redirectTo` המוצג ב-logs
5. ודא שה-URL הזה מוגדר בדיוק כזה ב-Supabase Dashboard

## איך להגדיר את ה-Redirect URLs ב-Supabase?

1. פתח [Supabase Dashboard](https://app.supabase.com/)
2. בחר את הפרויקט שלך
3. עבור ל-**Authentication** → **URL Configuration**
4. הוסף ל-**Redirect URLs** את ה-URL הבא (בדיוק כזה!):
   - `http://localhost:5173/auth/callback` (לפיתוח מקומי)
   - `https://project-tax-return.vercel.app/auth/callback` (לפרודקשן)

**חשוב:**
- ה-URL חייב להיות בדיוק כמו שהוא מוצג ב-logs
- ללא סלאש בסוף (`/auth/callback` ולא `/auth/callback/`)
- עם פרוטוקול נכון (`http://` או `https://`)
- ללא רווחים או תווים מיותרים

5. לחץ **Save**

## בדיקה נוספת

אחרי שהגדרת את ה-Redirect URLs:

1. נסה להתחבר עם Google שוב
2. אם עדיין יש שגיאה, בדוק את ה-logs ב-Supabase Dashboard:
   - עבור ל-**Logs** → **Auth**
   - חפש הודעות שגיאה הקשורות ל-OAuth

## טיפים

- ודא שה-`FRONTEND_URL` לא מוגדר כשמריץ מקומית (או שמוגדר ל-`http://localhost:5173`)
- ודא שה-`FRONTEND_URL` מוגדר נכון ב-Vercel ל-`https://project-tax-return.vercel.app`
- אם אתה משתמש ב-`.env` מקומי, ודא שהוא לא מכיל `FRONTEND_URL` שגוי



