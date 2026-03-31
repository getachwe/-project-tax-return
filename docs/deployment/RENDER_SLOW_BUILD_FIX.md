# Build עדיין איטי? – פתרון סופי

## הבעיה
Build לוקח 10+ דקות גם אחרי השינוי.

## פתרון: הגדרת משתנה סביבה ב-Render

משתנה הסביבה צריך להיות **מוגדר ב-Render Dashboard**, לא רק בפקודת Build.

### צעדים:

1. **Render Dashboard** → השירות `project-tax-return` → **Environment** (בסיידבר)

2. **Add Environment Variable** (או **+ Add**):
   - **Key:** `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`
   - **Value:** `true`
   - **Environment:** Build & Deploy (או All)

3. **ב-Build Command** – להחזיר ל:
   ```
   npm install
   ```
   (ולא `npm run render-build` – המשתנה יגיע מה-Dashboard)

4. **Cancel** את ה-Deploy התקוע

5. **Manual Deploy** → Deploy latest commit

---

## למה זה עובד?

כש-`PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` מוגדר ב-Environment Variables של Render, הוא פעיל **בכל** שלב ה-Build. כך Puppeteer לא מוריד Chromium בזמן `npm install`.

---

## אם זה עדיין איטי

חבילות נוספות שיכולות להאט:
- **tesseract.js** (~15MB)
- **pdf2pic** (תלויות native)

במקרה כזה – בדקי ב-Logs באיזה שלב זה תקוע (שורת הלוג האחרונה).
