const fs = require("fs");
const path = require("path");

/**
 * מקומי: puppeteer עם כרומיום מ Bundled.
 * Vercel: puppeteer-core + @sparticuz/chromium (אותו HTML כמו במקומי).
 */
async function launchBrowser() {
  const onVercelRuntime =
    typeof process.env.VERCEL_ENV === "string" &&
    process.env.VERCEL_ENV.length > 0;
  if (onVercelRuntime) {
    const chromium = require("@sparticuz/chromium");
    const puppeteerCore = require("puppeteer-core");
    const executablePath = await chromium.executablePath();
    return puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });
  }
  const puppeteer = require("puppeteer");
  return puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

// Helper: format numbers with commas
function formatNumber(num) {
  const n = Number(num);
  return Number.isFinite(n) ? n.toLocaleString("he-IL") : "0";
}

function creditPointsDisplay(data) {
  const n = Number(data.creditPoints);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

function creditPerPointValue(data) {
  const cp = Number(data.creditPoints);
  const cv = Number(data.creditValue);
  if (!Number.isFinite(cp) || cp <= 0 || !Number.isFinite(cv)) return 0;
  return cv / cp;
}

async function generateTaxPDFHtml(data, outputPath) {
  const perPoint = creditPerPointValue(data);
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
      <h1>תוצאות החישוב לשנת ${data.taxYear || ""}</h1>
      <div class="subtitle" style="font-weight:700;">
        ${(() => {
          const full = [data.firstName, data.lastName]
            .filter(Boolean)
            .join(" ");
          const fallback = data.employeeName || data.name || "";
          const display = full || fallback;
          return display
            ? `שלום רב, ${display}, נשמח לשתף את תוצאות החישוב לשנת ${
                data.taxYear || ""
              }`
            : "";
        })()}
      </div>
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
          ${(() => {
            const full = [data.firstName, data.lastName]
              .filter(Boolean)
              .join(" ");
            const fallback = data.employeeName || data.name || "";
            const display = full || fallback;
            return display ? `<tr><td>שם</td><td>${display}</td></tr>` : "";
          })()}
          <tr><td>הכנסה שנתית (מגיש/ה)</td><td>${formatNumber(data.income)} ₪</td></tr>
          ${
            data.filingStatus === "joint" &&
            data.combinedIncome != null &&
            Number(data.spouseIncome) > 0
              ? `<tr><td>הכנסת בן/בת זוג</td><td>${formatNumber(
                  data.spouseIncome
                )} ₪</td></tr>
              <tr><td>סה״כ הכנסה לחישוב (גילוי משותף)</td><td>${formatNumber(
                data.combinedIncome
              )} ₪</td></tr>`
              : ""
          }
          <tr><td>מס שנוכה (שדה 042)</td><td>${formatNumber(data.taxPaid)} ₪</td></tr>
          ${
            (Number(data.taxWithheld040) || 0) > 0
              ? `<tr><td>ניכוי מס (040)</td><td>${formatNumber(data.taxWithheld040)} ₪</td></tr>`
              : ""
          }
          ${
            (Number(data.taxWithheld043) || 0) > 0
              ? `<tr><td>ניכוי מס (043)</td><td>${formatNumber(data.taxWithheld043)} ₪</td></tr>`
              : ""
          }
          <tr><td>סה״כ מס שנוכה לחישוב</td><td>${formatNumber(
            data.taxPaidEffective != null ? data.taxPaidEffective : data.taxPaid
          )} ₪</td></tr>
          <tr><td>נקודות זיכוי</td><td>${creditPointsDisplay(data)}</td></tr>
          <tr><td>שווי נקודת זיכוי</td><td>${formatNumber(perPoint)} ₪</td></tr>
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

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 60_000 });
    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      displayHeaderFooter: false,
    });
  } finally {
    await browser.close();
  }
}

module.exports = { generateTaxPDFHtml };
