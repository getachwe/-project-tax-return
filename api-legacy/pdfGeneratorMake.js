const fs = require("fs");
const path = require("path");
const PdfPrinter = require("pdfmake");

// Load font files (Noto Sans Hebrew recommended, fallback to Heebo if needed)
const fonts = {
  NotoSansHebrew: {
    normal: path.join(__dirname, "fonts", "NotoSansHebrew-Regular.ttf"),
    bold: path.join(__dirname, "fonts", "NotoSansHebrew-Bold.ttf"),
  },
  Heebo: {
    normal: path.join(__dirname, "fonts", "Heebo-VariableFont_wght.ttf"),
    bold: path.join(__dirname, "fonts", "Heebo-VariableFont_wght.ttf"),
  },
};

// Helper: format numbers with commas
function formatNumber(num) {
  return Number(num).toLocaleString("he-IL");
}

async function generateTaxPDFMake(data, outputPath) {
  // Prefer Noto Sans Hebrew, fallback to Heebo
  const fontFamily = fs.existsSync(fonts.NotoSansHebrew.normal)
    ? "NotoSansHebrew"
    : "Heebo";
  const printer = new PdfPrinter(fonts);

  const docDefinition = {
    content: [
      // Wrap all content in a stack to avoid page break
      {
        stack: [
          { text: "תוצאות החישוב", style: "header", alignment: "right" },
          {
            text: "להלן תוצאות חישוב החזר המס הפוטנציאלי שלך בהתבסס על הנתונים שהוזנו.",
            style: "subheader",
            alignment: "right",
            margin: [0, 0, 0, 16],
          },
          {
            text:
              data.refund > 0
                ? `מגיע לך החזר מס של ${formatNumber(data.refund)} ₪`
                : "לא נמצאה זכאות להחזר מס",
            style: data.refund > 0 ? "refund" : "noRefund",
            alignment: "right",
            margin: [0, 0, 0, 4],
          },
          {
            text:
              data.refund > 0
                ? "ניתן להגיש בקשה להחזר עבור עד 6 שנים אחורה!"
                : "לא שילמת מס עודף על פי הנתונים שהוזנו",
            style: "refundNote",
            alignment: "right",
            margin: [0, 0, 0, 18],
          },
          {
            text: "פירוט החישוב",
            style: "sectionTitle",
            alignment: "right",
            margin: [0, 0, 0, 8],
          },
          {
            table: {
              headerRows: 1,
              widths: ["*", "*"],
              body: [
                [
                  { text: "שדה", style: "tableHeader", alignment: "right" },
                  { text: "ערך", style: "tableHeader", alignment: "right" },
                ],
                ["הכנסה שנתית", `${formatNumber(data.income)} ₪`],
                ["מס ששולם", `${formatNumber(data.taxPaid)} ₪`],
                ["נקודות זיכוי", data.creditPoints.toFixed(2)],
                [
                  "שווי נקודת זיכוי",
                  `${formatNumber(data.creditValue / data.creditPoints)} ₪`,
                ],
                ["סך הכל זיכוי ממס", `${formatNumber(data.creditValue)} ₪`],
                ["מס צפוי לפי חישוב", `${formatNumber(data.netTax)} ₪`],
                ["החזר מס פוטנציאלי", `${formatNumber(data.refund)} ₪`],
                ["מצב משפחתי", data.maritalStatus ? data.maritalStatus : "-"],
              ],
            },
            layout: {
              fillColor: function (rowIndex) {
                return rowIndex === 0 ? "#e3f2fd" : null;
              },
              hLineColor: function () {
                return "#b0bec5";
              },
              vLineColor: function () {
                return "#b0bec5";
              },
            },
            margin: [0, 0, 0, 18],
          },
          {
            text: "הסבר:",
            style: "explanation",
            alignment: "right",
            margin: [0, 0, 0, 2],
          },
          {
            text: data.explanation || "",
            style: "explanationText",
            alignment: "right",
            margin: [0, 0, 0, 18],
          },
          {
            text: "מה עושים עכשיו?",
            style: "stepsTitle",
            alignment: "right",
            margin: [0, 0, 0, 2],
          },
          {
            ol: [
              "הכן/י את המסמכים הדרושים (טפסי 106, אישורים רלוונטיים)",
              "מלא/י טופס 135 להחזר מס",
              "הגש/י את הבקשה לפקיד השומה באזור מגוריך",
              "המתן/י לתשובה תוך 90 יום בממוצע",
            ],
            style: "steps",
            alignment: "right",
            margin: [0, 0, 0, 18],
          },
          {
            text: [
              {
                text: "הדוח נוצר באופן אוטומטי על ידי מערכת חישוב מס\n",
                style: "footer",
              },
              {
                text: `תאריך: ${new Date().toLocaleDateString("he-IL")}`,
                style: "footer",
              },
            ],
            alignment: "center",
            margin: [0, 24, 0, 0],
          },
        ],
        pageBreak: "avoid",
      },
    ],
    defaultStyle: {
      font: fontFamily,
      fontSize: 12,
      alignment: "right",
    },
    styles: {
      header: { fontSize: 22, bold: true, color: "#222", margin: [0, 0, 0, 8] },
      subheader: { fontSize: 14, color: "#555", margin: [0, 0, 0, 8] },
      refund: { fontSize: 16, bold: true, color: "#1db954" },
      noRefund: { fontSize: 16, bold: true, color: "#e53935" },
      refundNote: { fontSize: 12, color: "#555" },
      sectionTitle: { fontSize: 15, bold: true, color: "#1976d2" },
      tableHeader: { fontSize: 13, bold: true, color: "#1976d2" },
      explanation: { fontSize: 13, bold: true, color: "#1976d2" },
      explanationText: { fontSize: 12, color: "#333" },
      stepsTitle: { fontSize: 13, bold: true, color: "#1976d2" },
      steps: { fontSize: 12, color: "#333" },
      footer: { fontSize: 10, color: "#888" },
    },
    pageMargins: [40, 40, 40, 40],
    pageSize: "A4",
    pageOrientation: "portrait",
    rtl: true,
  };

  return new Promise((resolve, reject) => {
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const stream = fs.createWriteStream(outputPath);
    pdfDoc.pipe(stream);
    pdfDoc.end();
    stream.on("finish", () => resolve(outputPath));
    stream.on("error", reject);
  });
}

module.exports = { generateTaxPDFMake };
