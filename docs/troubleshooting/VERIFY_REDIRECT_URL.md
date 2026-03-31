# איך לבדוק ולהגדיר את Redirect URL ב-Supabase

## שלב 1: בדוק מה ה-`redirectTo` בפועל

1. **הפעל את ה-backend:**
   ```bash
   cd api
   node index.js
   ```
   (או אם יש לך backend/ - `cd backend && npm start`)

2. **הפעל את ה-frontend בטרמינל אחר:**
   ```bash
   cd project
   npm run dev
   ```

3. **לחץ על "התחבר עם Google"**

4. **בדוק את ה-logs בטרמינל של ה-backend** - אתה אמור לראות משהו כמו:
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

## שלב 2: הגדר את ה-Redirect URLs ב-Supabase Dashboard

1. **פתח [Supabase Dashboard](https://app.supabase.com/)**
2. **בחר את הפרויקט שלך**
3. **עבור ל-Authentication** (בתפריט השמאלי)
4. **לחץ על "URL Configuration"** (בתפריט התחתון)
5. **מצא את המקטע "Redirect URLs"**
6. **לחץ על "Add URL"** (או כפתור "+" אם יש)
7. **הכנס את ה-URL בדיוק כפי שהעתקת מה-logs:**
   ```
   http://localhost:5173/auth/callback
   ```
   
   **חשוב מאוד - בדוק את הדברים הבאים:**
   - ✅ ללא סלאש בסוף (`/auth/callback` ולא `/auth/callback/`)
   - ✅ עם `http://` (לא `https://`)
   - ✅ עם פורט `5173`
   - ✅ בדיוק כמו שהופיע ב-logs
   - ✅ ללא רווחים לפני או אחרי

8. **לחץ "Save"** (או "Add" או כל כפתור שמירה)

## שלב 3: ודא שה-Google OAuth Provider מוגדר נכון

1. **עבור ל-Authentication → Providers**
2. **מצא את "Google"**
3. **לחץ על "Edit"** (או כפתור ההגדרות)
4. **ודא שה-"Enabled" מופעל** (אמור להיות כחול/ירוק)
5. **ודא שיש Client ID ו-Client Secret מוגדרים**
6. **אם צריך, הגדר אותם:**
   - Client ID: מ-Google Console
   - Client Secret: מ-Google Console
7. **לחץ "Save"**

## שלב 4: נסה שוב

1. **נסה להתחבר עם Google שוב**
2. **אם עדיין יש שגיאה, בדוק את ה-logs ב-Supabase:**
   - עבור ל-**Logs** → **Auth**
   - חפש הודעות שגיאה הקשורות ל-OAuth

## טיפים נוספים

### אם יש לך כמה URLs ב-Redirect URLs:
- ודא שה-URL המדויק `http://localhost:5173/auth/callback` קיים ברשימה
- אפשר להוסיף כמה URLs אם צריך (לדוגמה, גם localhost וגם production URL)

### אם השגיאה נמשכת:
1. **בדוק את ה-logs ב-Supabase Dashboard → Logs → Auth**
2. **ודא שה-Google OAuth Provider מוגדר נכון ב-Google Console:**
   - Authorized redirect URIs צריך לכלול:
     ```
     https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
     ```
   - (החלף `YOUR_PROJECT_ID` ב-project ID שלך מ-Supabase)

### אם אתה לא רואה את ה-logs מהבקאנד:
- ודא שה-backend רץ
- ודא שאתה מסתכל על הטרמינל הנכון
- נסה לסגור ולפתוח מחדש את הטרמינל



