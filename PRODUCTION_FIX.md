# פתרון בעיית הפרודקשן - 404 על /api/auth

## הבעיה
בפרודקשן, כל ה-API routes מחזירים 404:
- `POST /api/auth/signin` → 404
- `GET /api/auth/google` → 404

## פתרון

### שלב 1: ודא שכל הקבצים ב-`api/` קיימים

1. ודא שכל הקבצים הבאים קיימים:
   - `api/index.js`
   - `api/app.js`
   - `api/package.json`
   - `api/routes/auth.js`
   - `api/supabaseClient.js`
   - וכל הקבצים האחרים

### שלב 2: ודא שה-`vercel.json` מוגדר נכון

הקובץ `vercel.json` צריך להיות:
```json
{
  "builds": [
    {
      "src": "project/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.js" },
    { "src": "/assets/(.*)", "dest": "/project/dist/assets/$1" },
    { "src": "/(.*)", "dest": "/project/dist/index.html" }
  ]
}
```

### שלב 3: ודא שכל משתני הסביבה מוגדרים ב-Vercel

1. פתח [Vercel Dashboard](https://vercel.com/dashboard)
2. בחר את הפרויקט
3. עבור ל-**Settings** → **Environment Variables**
4. ודא שיש את המשתנים הבאים:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `FRONTEND_URL` = `https://project-tax-return.vercel.app`
   - וכל משתני הסביבה האחרים

### שלב 4: Redeploy

1. ב-Vercel Dashboard, לחץ על **Deployments**
2. לחץ על **Redeploy** על ה-deployment האחרון
3. או פשוט push ל-GitHub - זה יעשה redeploy אוטומטי

### שלב 5: בדוק את ה-logs

1. אחרי ה-redeploy, עבור ל-**Deployments** → בחר deployment → **Functions**
2. לחץ על `api/index.js`
3. בדוק את ה-logs - זה יעזור לזהות אם יש שגיאות

## אם זה עדיין לא עובד

### בדוק את ה-logs ב-Vercel

1. עבור ל-**Deployments** → בחר deployment
2. לחץ על **Functions** → `api/index.js`
3. בדוק את ה-logs - זה יעזור לזהות את הבעיה

### בדוק שה-`api/package.json` מכיל את כל ה-dependencies

ודא שה-`api/package.json` מכיל את כל ה-dependencies הנדרשים:
- `express`
- `serverless-http`
- `@supabase/supabase-js`
- וכל ה-dependencies האחרים

### נסה לבדוק את ה-health endpoint

אחרי ה-redeploy, נסה לגשת ל:
```
https://project-tax-return.vercel.app/api/health
```

אם זה מחזיר `{"status":"ok"}`, ה-API עובד והבעיה היא ב-routes.
אם זה מחזיר 404, ה-serverless function לא עובד.

