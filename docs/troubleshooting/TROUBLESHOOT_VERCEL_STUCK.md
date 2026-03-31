# פתרון: האתר תקוע ולא מתחבר

## 1. בדיקה: האם `VITE_API_URL` מוגדר ב-Vercel?

בלי משתנה זה, הפרונט **לא יודע** לשלוח בקשות ל־Render.

**בדיקה:**
1. Vercel Dashboard → הפרויקט → Settings → Environment Variables
2. ודאי ש־`VITE_API_URL` קיים וערכו: `https://project-tax-return.onrender.com`
3. אם לא קיים – הוסיפי אותו ועשי **Redeploy** (חובה אחרי הוספת משתנה)

---

## 2. להעיר את Render לפני שניסיון התחברות

ב־Render (Free) השירות נכנס ל־sleep. הבקשה הראשונה עלולה לתפוס 30–60 שניות ולגרום ל־timeout.

**מה לעשות:**
1. פתחי לשונית חדשה
2. גלשי ל: `https://project-tax-return.onrender.com/health`
3. חכי עד שמופיע `{"status":"ok"}`
4. רק אחרי זה חזרי לאתר ב־Vercel ונסי להתחבר

---

## 3. בדיקה ב־Network (כרטיסיית רשת)

1. F12 → כרטיסיית **Network**
2. התחברי (אימייל/סיסמה או Google)
3. חפשי בקשות אדומות (failed)
4. בדקי:
   - **לאן** הבקשה נשלחת (כתובת מלאה)
   - האם מופיע CORS error
   - האם מופיע timeout

אם הבקשה נשלחת ל־`project-tax-return.vercel.app` במקום ל־`project-tax-return.onrender.com` – `VITE_API_URL` לא מוגדר או לא נכנס ל־build.

---

## 4. סיכום צעדים

1. הוסיפי/עדכני `VITE_API_URL` ב־Vercel
2. Redeploy ב־Vercel
3. העירי את Render דרך `/health`
4. נסי שוב להתחבר
