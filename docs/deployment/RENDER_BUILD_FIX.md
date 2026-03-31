# תיקון Build תקוע ב-Render (Puppeteer)

## הבעיה
`npm install` תקוע כי Puppeteer מוריד Chromium (~300MB) – יכול לקחת 15+ דקות או להיכשל.

## הפתרון
1. **ב-Render Dashboard** → השירות → **Settings** → **Build & Deploy**
2. שנה את **Build Command** מ-`npm install` ל:
   ```
   npm run render-build
   ```
3. שמור ו-**Cancel** את ה-deploy התקוע (כפתור אדום)
4. הפעל **Manual Deploy** → Deploy latest commit

## מה קורה עכשיו
- `render-build` מדלג על הורדת Chromium → Build מסתיים ב-2–3 דקות
- יצירת PDF: מנסה Puppeteer, ואם אין Chromium → עובר ל-pdfMake (עובד תמיד)
