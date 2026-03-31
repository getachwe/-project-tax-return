# אבחון בעיית ההתחברות

## הבעיה
המשתמש מקבל 400 Bad Request כאשר מנסה להתחבר ל-`http://localhost:4000/api/auth/signin`

## נקודות בדיקה

### 1. האם ה-backend רץ?
```powershell
# בדוק אם יש process על פורט 4000
netstat -ano | findstr :4000
```

### 2. האם יש .env file ב-backend?
הקובץ צריך להיות ב-`backend/.env` ולהכיל:
```
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_KEY=your_service_key (אופציונלי)
```

### 3. איך להריץ את ה-backend:
```powershell
cd backend
npm install
node server.js
```

### 4. בדוק את ה-response המלא:
פתח את DevTools (F12) → Network → לחץ על הבקשה → Response

## מה יכול להיות הבעיה:

1. **ה-backend לא רץ** - צריך להריץ `node backend/server.js`
2. **חסרים environment variables** - צריך .env file ב-backend/
3. **בעיה ב-Supabase credentials** - צריך לבדוק שה-keys נכונים
4. **בעיה ב-body parsing** - אולי ה-email/password לא מגיעים נכון
