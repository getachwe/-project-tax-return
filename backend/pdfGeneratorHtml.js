const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

// Helper: format numbers with commas
function formatNumber(num) {
  return Number(num).toLocaleString("he-IL");
}

async function generateTaxPDFHtml(data, outputPath) {
  // HTML template with inline CSS (Heebo font, RTL, modern look)
  const html = `
  <!DOCTYPE html>
  <html lang="he" dir="rtl">
  <head>
    <meta charset="utf-8">
    <title>דוח חישוב מס</title>
    <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Heebo', Arial, sans-serif;
        background: #fff;
        color: #222;
        margin: 0;
        padding: 0;
        direction: rtl;
      }
      .main-content {
        max-width: 700px;
        margin: 40px auto 0 auto;
        padding: 32px 32px 24px 32px;
      }
      h1 {
        color: #222;
        font-size: 2.2rem;
        font-weight: 700;
        margin-bottom: 0.5em;
        text-align: right;
      }
      .subtitle {
        color: #555;
        font-size: 1.1rem;
        margin-bottom: 1.5em;
        text-align: right;
      }
      .refund {
        font-size: 1.4rem;
        font-weight: 700;
        color: ${data.refund > 0 ? "#1db954" : "#e53935"};
        margin-bottom: 0.2em;
        text-align: right;
      }
      .refund-note {
        font-size: 1rem;
        color: #555;
        margin-bottom: 2em;
        text-align: right;
      }
      .section-title {
        font-size: 1.2rem;
        color: #1976d2;
        font-weight: 700;
        margin: 2em 0 0.5em 0;
        text-align: right;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 2em;
        background: #fafbfc;
      }
      th, td {
        border: 1px solid #b0bec5;
        padding: 10px 12px;
        text-align: right;
        font-size: 1rem;
      }
      th {
        background: #e3f2fd;
        color: #1976d2;
        font-weight: 700;
      }
      tr:nth-child(even) td {
        background: #f5f5f5;
      }
      .explanation {
        color: #1976d2;
        font-size: 1.1rem;
        font-weight: 700;
        margin-bottom: 0.2em;
        text-align: right;
      }
      .explanation-text {
        color: #333;
        font-size: 1rem;
        margin-bottom: 2em;
        text-align: right;
      }
      .steps-title {
        color: #1976d2;
        font-size: 1.1rem;
        font-weight: 700;
        margin-bottom: 0.2em;
        text-align: right;
      }
      .steps {
        color: #333;
        font-size: 1rem;
        margin-bottom: 2em;
        text-align: right;
        padding-right: 1em;
      }
      .steps li {
        margin-bottom: 0.2em;
      }
      .footer {
        color: #888;
        font-size: 0.95rem;
        text-align: center;
        margin-top: 2.5em;
      }
    </style>
  </head>
  <body>
    <div class="main-content">
      <h1>תוצאות החישוב</h1>
      <div class="subtitle">להלן תוצאות חישוב החזר המס הפוטנציאלי שלך בהתבסס על הנתונים שהוזנו.</div>
      <div class="refund">
        ${
          data.refund > 0
            ? `₪${formatNumber(data.refund)} של מס החזר לך מגיע`
            : "לא נמצאה זכאות להחזר מס"
        }
      </div>
      <div class="refund-note">
        ${
          data.refund > 0
            ? "ניתן להגיש בקשה להחזר עבור עד 6 שנים אחורה!"
            : "לא שילמת מס עודף על פי הנתונים שהוזנו"
        }
      </div>
      <div class="section-title">פירוט החישוב</div>
      <table>
        <thead>
          <tr>
            <th>שדה</th>
            <th>ערך</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>הכנסה שנתית</td><td>${formatNumber(data.income)} ₪</td></tr>
          <tr><td>מס ששולם</td><td>${formatNumber(data.taxPaid)} ₪</td></tr>
          <tr><td>נקודות זיכוי</td><td>${data.creditPoints.toFixed(2)}</td></tr>
          <tr><td>שווי נקודת זיכוי</td><td>${formatNumber(
            data.creditValue / data.creditPoints
          )} ₪</td></tr>
          <tr><td>סך הכל זיכוי ממס</td><td>${formatNumber(
            data.creditValue
          )} ₪</td></tr>
          <tr><td>מס צפוי לפי חישוב</td><td>${formatNumber(
            data.netTax
          )} ₪</td></tr>
          <tr><td>החזר מס פוטנציאלי</td><td>${formatNumber(
            data.refund
          )} ₪</td></tr>
          <tr><td>מצב משפחתי</td><td>${
            data.maritalStatus ? data.maritalStatus : "-"
          }</td></tr>
        </tbody>
      </table>
      <div class="explanation">הסבר:</div>
      <div class="explanation-text">${data.explanation || ""}</div>
      <div class="steps-title">מה עושים עכשיו?</div>
      <ol class="steps">
        <li>הכן/י את המסמכים הדרושים (טפסי 106, אישורים רלוונטיים)</li>
        <li>מלא/י טופס 135 להחזר מס</li>
        <li>הגש/י את הבקשה לפקיד השומה באזור מגוריך</li>
        <li>המתן/י לתשובה תוך 90 יום בממוצע</li>
      </ol>
      <div class="footer">
        הדוח נוצר באופן אוטומטי על ידי מערכת חישוב מס<br>
        תאריך: ${new Date().toLocaleDateString("he-IL")}
      </div>
    </div>
  </body>
  </html>
  `;

  // Launch Puppeteer and generate PDF
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    displayHeaderFooter: false,
  });
  await browser.close();
}

module.exports = { generateTaxPDFHtml };
