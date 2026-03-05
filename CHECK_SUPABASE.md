# בדיקת Supabase - פתרון בעיית ההתחברות

## 🔴 הבעיה שנמצאה:
```
Error: getaddrinfo ENOTFOUND txnrzvpekxgeyglctvdn.supabase.co
```

זה אומר שה-URL של Supabase לא תקין או שהפרויקט לא קיים.

## ✅ מה לעשות:

### 1. בדוק את ה-SUPABASE_URL ב-backend/.env

פתח את `backend/.env` וודא שה-URL נראה כך:
```
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
```

**⚠️ חשוב:**
- צריך להתחיל ב-`https://`
- צריך להסתיים ב-`.supabase.co`
- לא צריך `/` בסוף

### 2. בדוק ב-Supabase Dashboard

1. פתח: https://app.supabase.com
2. התחבר לחשבון שלך
3. בדוק אם יש לך פרויקט בשם הזה
4. אם הפרויקט לא קיים או הושעה:
   - צור פרויקט חדש ב-Supabase
   - או הפעל את הפרויקט הקיים

### 3. העתק את ה-URL הנכון

1. ב-Supabase Dashboard → Settings → API
2. העתק את **Project URL** (לא API URL!)
3. זה צריך להיראות כמו: `https://abcdefghijklmnop.supabase.co`
4. עדכן את `backend/.env`:
   ```
   SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   ```

### 4. העתק את ה-Keys

ב-Supabase Dashboard → Settings → API:
- **anon/public key** → `SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_KEY`

### 5. בדוק שוב

הרץ:
```powershell
cd backend
node test-connection.js
```

אמור לראות:
```
✅ Supabase connection works!
```

## 🔍 אם זה עדיין לא עובד:

1. **נסה לפתוח את ה-URL בדפדפן:**
   - פתח את `https://txnrzvpekxgeyglctvdn.supabase.co`
   - אם זה לא נפתח → הפרויקט לא קיים/הושעה

2. **בדוק את ה-DNS:**
   ```powershell
   nslookup txnrzvpekxgeyglctvdn.supabase.co
   ```

3. **צור פרויקט חדש ב-Supabase** אם צריך
