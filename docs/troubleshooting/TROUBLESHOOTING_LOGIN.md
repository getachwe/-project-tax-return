# פתרון בעיית ההתחברות - מדריך שלב אחר שלב

## 🔍 מה הבעיה?
אתה מקבל **400 Bad Request** כאשר מנסה להתחבר.

## ✅ שלבי בדיקה

### 1. בדוק שה-backend רץ

פתח טרמינל חדש והרץ:

```powershell
cd backend
node server.js
```

אמור לראות:
```
Backend server running on port 4000
```

**אם זה לא רץ:**
- ודא שיש `node_modules` בתיקיית `backend/`
- הרץ `npm install` בתיקיית `backend/`

### 2. בדוק שיש קובץ `.env` ב-`backend/`

צריך ליצור קובץ `backend/.env` עם התוכן הבא:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
PORT=4000
```

**איפה למצוא את ה-keys?**
1. פתח Supabase Dashboard: https://app.supabase.com
2. בחר את הפרויקט שלך
3. לך ל-Settings → API
4. העתק את:
   - Project URL → `SUPABASE_URL`
   - anon/public key → `SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_KEY`

### 3. בדוק את ה-logs בטרמינל

כשאתה מנסה להתחבר, אמור לראות בטרמינל של ה-backend:

```
=== Sign In Request ===
Request body: { ... }
Email: "your-email@example.com"
Password: ***PROVIDED***
✅ Attempting Supabase sign in...
```

**אם אתה רואה שגיאה:**
- `Missing SUPABASE_URL or SUPABASE_*_KEY env vars` → צריך להגדיר את ה-.env file
- `email and password are required` → ה-email/password לא מגיעים נכון
- `Invalid login credentials` → המייל/סיסמה לא נכונים

### 4. בדוק ב-DevTools (F12)

1. פתח את DevTools (F12)
2. לך ל-Network tab
3. נסה להתחבר שוב
4. לחץ על הבקשה `signin`
5. בדוק את:
   - **Status Code**: צריך להיות 200 (לא 400!)
   - **Response**: מה השגיאה המדויקת?

### 5. בדוק את ה-Request

ב-DevTools → Network → `signin` → Headers → Request Payload:

אמור להיות:
```json
{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

**אם ה-body ריק או לא נכון:**
- בעיה עם ה-API call
- צריך לבדוק את `project/src/utils/api.ts`

## 🐛 בעיות נפוצות

### בעיה #1: ה-backend לא רץ
**פתרון:** הרץ `node backend/server.js` בטרמינל

### בעיה #2: חסר .env file
**פתרון:** צור `backend/.env` עם ה-Supabase credentials

### בעיה #3: ה-email/password לא נכונים
**פתרון:** ודא שהמשתמש קיים ב-Supabase ואשר את המייל

### בעיה #4: ה-Supabase credentials שגויים
**פתרון:** בדוק שה-keys נכונים ב-`.env` file

### בעיה #5: השרת לא מקבל את ה-body
**פתרון:** בדוק שה-`Content-Type: application/json` נשלח בבקשה

## 📝 מה לעשות עכשיו?

1. **הרץ את ה-backend:**
   ```powershell
   cd backend
   node server.js
   ```

2. **בדוק את ה-logs** בטרמינל כשאתה מנסה להתחבר

3. **שלח לי את ה-logs** שמופיעים בטרמינל - זה יעזור לי לזהות את הבעיה המדויקת

## 🔗 קישורים שימושיים

- Supabase Dashboard: https://app.supabase.com
- Backend Logs: בטרמינל שבו הרצת `node server.js`
- Frontend Logs: ב-DevTools → Console
