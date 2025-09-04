const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { PDF_STYLES } = require("./taxCalculator");

const FIELD_LABELS = {
  income: "הכנסה שנתית",
  taxPaid: "מס ששולם",
  taxCredits: "נקודות זיכוי",
  children: "מספר ילדים מתחת לגיל 18",
  academicDegree: "תואר אקדמי",
  newImmigrant: "עולה חדש/ה",
  livingInPeriphery: "תושב/ת פריפריה",
  maritalStatus: "מצב משפחתי",
};

// RTL helper: reverse words for Hebrew, fix punctuation, parentheses, and question marks
function rtl(text) {
  if (!text) return "";
  // Split by space, reverse, join, and fix punctuation spacing
  let out = text
    .split(" ")
    .reverse()
    .join(" ")
    .replace(/([.,!?₪])/g, " $1 ") // add space before and after punctuation
    .replace(/([\u0590-\u05FF0-9])([^\u0590-\u05FF0-9\s])/g, "$1 $2") // space between hebrew/number and non-hebrew
    .replace(/\s{2,}/g, " "); // collapse multiple spaces
  // Swap parentheses direction
  out = out
    .replace(/\(/g, "TEMP_RIGHT_PAREN")
    .replace(/\)/g, "TEMP_LEFT_PAREN");
  out = out.replace(/TEMP_RIGHT_PAREN/g, ")").replace(/TEMP_LEFT_PAREN/g, "(");
  // Move question mark to end if at start
  out = out.replace(/^\?(.+)/, "$1?");
  return out.trim();
}

function generateTaxPDF(data, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        layout: "portrait",
        info: {
          Title: rtl("חישוב מס הכנסה"),
          Author: rtl("מערכת חישוב מס"),
          Subject: rtl("דוח חישוב מס הכנסה"),
        },
      });

      // Register Heebo font and set as default
      const fontPath = path.join(
        __dirname,
        "fonts",
        "Heebo-VariableFont_wght.ttf"
      );
      doc.registerFont("hebrew", fontPath);
      doc.font("hebrew");

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // כותרת ראשית
      doc
        .font("hebrew")
        .fontSize(26)
        .fillColor(PDF_STYLES.colors.primary)
        .text(rtl("תוצאות  החישוב"), { align: "right" })
        .moveDown(1);

      // שם ושנה (אם קיימים)
      const fullName = [data.firstName, data.lastName]
        .filter(Boolean)
        .join(" ");
      const personName =
        fullName ||
        data.employeeName ||
        data.name ||
        data.fullName ||
        data.employee_name;
      if (personName) {
        doc
          .font("hebrew")
          .fontSize(14)
          .fillColor(PDF_STYLES.colors.text)
          .text(
            rtl(
              `דוח זה הופק עבור ${personName}${
                data.taxYear ? ` — שנת המס ${data.taxYear}` : ""
              }`
            ),
            { align: "right" }
          )
          .moveDown(0.8);
      }

      // תיאור קצר
      doc
        .font("hebrew")
        .fontSize(13)
        .fillColor(PDF_STYLES.colors.text)
        .text(
          rtl(
            "להלן תוצאות חישוב החזר המס הפוטנציאלי שלך בהתבסס על הנתונים שהוזנו."
          ),
          { align: "right" }
        )
        .moveDown(1.5);

      // בלוק החזר/חוב
      doc
        .font("hebrew")
        .fontSize(18)
        .fillColor(
          data.refund > 0 ? PDF_STYLES.colors.success : PDF_STYLES.colors.danger
        )
        .text(
          data.refund > 0
            ? rtl(`מגיע לך החזר מס של ${data.refund.toLocaleString()} ₪`)
            : rtl("לא נמצאה זכאות להחזר מס"),
          { align: "right" }
        )
        .moveDown(0.2)
        .font("hebrew")
        .fontSize(12)
        .fillColor(PDF_STYLES.colors.text)
        .text(
          data.refund > 0
            ? rtl("ניתן להגיש בקשה להחזר עבור עד 6 שנים אחורה!")
            : rtl("לא שילמת מס עודף על פי הנתונים שהוזנו"),
          { align: "right" }
        )
        .moveDown(1.5);

      // פירוט החישוב - טבלה
      doc
        .font("hebrew")
        .fontSize(16)
        .fillColor(PDF_STYLES.colors.primary)
        .text(rtl("פירוט החישוב"), { align: "right" })
        .moveDown(0.5);

      // Table data
      const details = [
        personName ? [rtl("שם"), rtl(personName)] : null,
        [rtl("הכנסה שנתית"), `${data.income.toLocaleString()} ₪`],
        [rtl("מס ששולם"), `${data.taxPaid.toLocaleString()} ₪`],
        [rtl("נקודות זיכוי"), data.creditPoints.toFixed(2)],
        [
          rtl("שווי נקודת זיכוי"),
          `${(data.creditValue / data.creditPoints).toLocaleString()} ₪`,
        ],
        [rtl("סך הכל זיכוי ממס"), `${data.creditValue.toLocaleString()} ₪`],
        [rtl("מס צפוי לפי חישוב"), `${data.netTax.toLocaleString()} ₪`],
        [rtl("החזר מס פוטנציאלי"), `${data.refund.toLocaleString()} ₪`],
        [rtl("מצב משפחתי"), data.maritalStatus ? rtl(data.maritalStatus) : "-"],
      ].filter(Boolean);
      // Table layout (right-aligned)
      const tableWidth = 400;
      const rowHeight = 28;
      const col1Width = 200;
      const col2Width = 180;
      const tableLeft = doc.page.width - doc.page.margins.right - tableWidth; // align to right
      const tableTop = doc.y;
      // Header
      doc
        .rect(tableLeft, tableTop, tableWidth, rowHeight)
        .fillAndStroke(PDF_STYLES.colors.light, PDF_STYLES.colors.secondary)
        .fillColor(PDF_STYLES.colors.primary)
        .fontSize(13)
        .font("hebrew")
        .text(
          rtl("שדה"),
          tableLeft + tableWidth - col1Width + 10,
          tableTop + 7,
          {
            width: col1Width - 20,
            align: "right",
          }
        )
        .text(rtl("ערך"), tableLeft + 10, tableTop + 7, {
          width: col2Width - 20,
          align: "right",
        });
      // Rows
      doc.fontSize(12).fillColor(PDF_STYLES.colors.text);
      details.forEach(([label, value], i) => {
        const y = tableTop + rowHeight * (i + 1);
        // Row background
        if (i % 2 === 0) {
          doc
            .rect(tableLeft, y, tableWidth, rowHeight)
            .fill(PDF_STYLES.colors.light);
        }
        // Row border
        doc
          .rect(tableLeft, y, tableWidth, rowHeight)
          .stroke(PDF_STYLES.colors.secondary);
        // Text
        doc
          .font("hebrew")
          .fillColor(PDF_STYLES.colors.text)
          .text(label, tableLeft + tableWidth - col1Width + 10, y + 7, {
            width: col1Width - 20,
            align: "right",
          })
          .text(value, tableLeft + 10, y + 7, {
            width: col2Width - 20,
            align: "right",
          });
      });
      doc.y = tableTop + rowHeight * (details.length + 1) + 10;
      doc.moveDown(1);

      // בלוק הסבר
      doc
        .font("hebrew")
        .fontSize(14)
        .fillColor(PDF_STYLES.colors.accent)
        .text(rtl("הסבר:"), { align: "right" })
        .moveDown(0.2)
        .font("hebrew")
        .fontSize(12)
        .fillColor(PDF_STYLES.colors.text)
        .text(rtl(data.explanation), { align: "right" })
        .moveDown(1.5);

      // מה עושים עכשיו?
      doc
        .font("hebrew")
        .fontSize(16)
        .fillColor(PDF_STYLES.colors.primary)
        .text(rtl("?מה עושים עכשיו"), { align: "right" })
        .moveDown(0.5)
        .font("hebrew")
        .fontSize(12)
        .fillColor(PDF_STYLES.colors.text)
        .text(
          rtl("1. הכן/י את המסמכים הדרושים (טפסי 106, אישורים רלוונטיים)"),
          {
            align: "right",
          }
        )
        .moveDown(0.1)
        .text(rtl("2. מלא/י טופס 135 להחזר מס"), { align: "right" })
        .moveDown(0.1)
        .text(rtl("3. הגש/י את הבקשה לפקיד השומה באזור מגוריך"), {
          align: "right",
        })
        .moveDown(0.1)
        .text(rtl("4. המתן/י לתשובה תוך 90 יום בממוצע"), { align: "right" })
        .moveDown(1)
        .font("hebrew")
        .fontSize(10)
        .fillColor(PDF_STYLES.colors.text)
        .text(
          rtl(
            "שים/י לב: ניתן לדרוש החזרי מס עד 6 שנים אחורה, אך כדאי לפעול בהקדם!"
          ),
          { align: "right" }
        );

      // כותרת תחתונה
      doc
        .moveDown(2)
        .font("hebrew")
        .fontSize(10)
        .fillColor(PDF_STYLES.colors.text)
        .text(rtl("הדוח נוצר באופן אוטומטי על ידי מערכת חישוב מס"), {
          align: "center",
        })
        .text(rtl(`תאריך: ${new Date().toLocaleDateString("he-IL")}`), {
          align: "center",
        });

      doc.end();
      stream.on("finish", () => {
        resolve(outputPath);
      });
      stream.on("error", (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateTaxPDF };
