# בדיקה – מה לא עובד?

## 1. בדיקה מהירה – /health

פתחי בדפדפן: `https://project-tax-return.onrender.com/health`

- **אם רואים** `{"status":"ok"}` → הבקאנד עובד, הבעיה ב-frontend או בהתחברות
- **אם רואים** דף "APPLICATION LOADING" ותקוע → הבקאנד לא עולה (ראה סעיף 3)
- **אם יש שגיאה אחרת** → רשמי מה מופיע

---

## 2. אם /health עובד – בדיקת התחברות

1. פתחי `https://project-tax-return.vercel.app` (או הכתובת המדויקת שלך)
2. F12 → כרטיסיית **Network**
3. נסי להתחבר (אימייל או Google)
4. בדקי:
   - האם יש בקשות **אדומות** (failed)?
   - מה ה-**Status** שלהן? (200, 404, 500, CORS?)
   - מה ה-**Request URL**? (צריך להיות `project-tax-return.onrender.com`)

---

## 3. אם /health לא עובד – Render

### בדיקה א': משתני סביבה

ב-Render → **Environment** – וודאי שקיימים:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`

חוסר במשתנה יכול לגרום לקריסה בהפעלה.

### בדיקה ב': Logs

ב-Render → **Logs** – חפשי:
- `Error`
- `Missing`
- `Cannot find`
- `crash`

העתיקי שורות עם שגיאות (אם יש) ושלחי.

---

## 4. שינוי שעשיתי – CORS

הרחבתי את CORS כדי לאפשר **כל** כתובת `*.vercel.app` (כולל `-project-tax-return.vercel.app`).

**חשוב:** אחרי השינוי – צריך **commit + push** ל-Git, ואז Render יריץ Deploy אוטומטי.

```bash
git add backend/app.js
git commit -m "Fix CORS for all Vercel subdomains"
git push
```

---

## 5. מה הכתובת האמיתית של Vercel?

בדקי ב-Vercel Dashboard מה ה-URL המדויק של הפרויקט. הוא יכול להיות:
- `project-tax-return.vercel.app`
- `-project-tax-return.vercel.app`
- או אחר

וודאי ש-`VITE_API_URL` ב-Vercel מוגדר ל: `https://project-tax-return.onrender.com`
