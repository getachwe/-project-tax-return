require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const { extract106 } = require("./extract106");
const { calculateTax } = require("./taxCalculator");
const { generateTaxPDF } = require("./pdfGenerator");
const { generateTaxPDFHtml } = require("./pdfGeneratorHtml");
const { generateTaxPDFMake } = require("./pdfGeneratorMake");
const fs = require("fs");
const nodemailer = require("nodemailer");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

// Minimal required fields by name for progressing without full extraction
const REQUIRED_FIELDS_MIN = ["income", "taxPaid", "taxYear", "maritalStatus"];

function getMissingFieldsByName(data) {
  const source = data || {};
  return REQUIRED_FIELDS_MIN.filter(
    (key) =>
      source[key] === undefined || source[key] === null || source[key] === ""
  );
}

function normalizeDataTypes(data) {
  const normalized = { ...data };
  if (typeof normalized.income === "string")
    normalized.income = Number(normalized.income);
  if (typeof normalized.taxPaid === "string")
    normalized.taxPaid = Number(normalized.taxPaid);
  if (typeof normalized.taxCredits === "string")
    normalized.taxCredits = Number(normalized.taxCredits);
  if (typeof normalized.children === "string")
    normalized.children = Number(normalized.children);
  if (typeof normalized.academicDegree === "string")
    normalized.academicDegree = normalized.academicDegree === "true";
  if (typeof normalized.newImmigrant === "string")
    normalized.newImmigrant = normalized.newImmigrant === "true";
  if (typeof normalized.livingInPeriphery === "string")
    normalized.livingInPeriphery = normalized.livingInPeriphery === "true";
  return normalized;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Upload 106 form and process
app.post("/api/process-106", upload.single("file"), async (req, res) => {
  try {
    let codeMap, missingFields;
    if (req.file) {
      const result = await extract106(req.file.path, req.file.mimetype);
      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }
      codeMap = result.data;
      // Prefer extractor's missingFields if provided; fall back to minimal name-based check
      missingFields = Array.isArray(result.missingFields)
        ? result.missingFields
        : getMissingFieldsByName(codeMap);
    } else {
      codeMap = req.body || {};
      missingFields = getMissingFieldsByName(codeMap);
    }
    if (missingFields.length > 0) {
      return res.json({ success: true, data: codeMap, missingFields });
    }
    const taxResult = calculateTax(codeMap);
    res.json({ success: true, data: taxResult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// הגשת קובץ PDF אמיתי
app.get("/api/download/tax-return.pdf", (req, res) => {
  const filePath = path.join(__dirname, "pdfs", "tax-return.pdf");
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send("הקובץ לא נמצא");
    }
  });
});

// יצירת PDF דינמי מהנתונים (עכשיו עם Puppeteer)
app.post("/api/generate-tax-return-pdf", express.json(), async (req, res) => {
  try {
    // קבל את כל הנתונים מהקליינט (ולא רק שם/שנה/סכום)
    const taxData = req.body;
    const taxResult = calculateTax(taxData);
    const tempPath = path.join(
      __dirname,
      "pdfs",
      `tax-return-${Date.now()}.pdf`
    );
    await generateTaxPDFHtml(taxResult, tempPath);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=tax-return.pdf");
    const stream = fs.createReadStream(tempPath);
    stream.pipe(res);
    stream.on("close", () => {
      fs.unlink(tempPath, () => {});
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("שגיאה ביצירת PDF");
  }
});

// API endpoint for direct tax calculation
app.post("/api/calculate-tax", express.json(), (req, res) => {
  try {
    const normalized = normalizeDataTypes(req.body);
    const result = calculateTax(normalized);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// New endpoint for Puppeteer-based PDF
app.post("/generate-pdf-html", async (req, res) => {
  try {
    const data = req.body;
    const outputPath = path.join(
      __dirname,
      "pdfs",
      `tax_report_html_${Date.now()}.pdf`
    );
    await generateTaxPDFHtml(data, outputPath);
    res.download(outputPath, "tax_report.pdf", (err) => {
      if (err) {
        res.status(500).send("Error sending PDF");
      } else {
        setTimeout(() => fs.unlinkSync(outputPath), 10000);
      }
    });
  } catch (err) {
    res.status(500).send("Failed to generate PDF: " + err.message);
  }
});

// יצירת PDF מקצועי בעברית עם pdfmake
app.post(
  "/api/generate-tax-return-pdfmake",
  express.json(),
  async (req, res) => {
    try {
      const taxData = req.body;
      const taxResult = calculateTax(taxData);
      const tempPath = path.join(
        __dirname,
        "pdfs",
        `tax-return-make-${Date.now()}.pdf`
      );
      await generateTaxPDFMake(taxResult, tempPath);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=tax-return.pdf"
      );
      const stream = fs.createReadStream(tempPath);
      stream.pipe(res);
      stream.on("close", () => {
        fs.unlink(tempPath, () => {});
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("שגיאה ביצירת PDF");
    }
  }
);

// שליחת דוח במייל
app.post("/api/send-tax-return-email", express.json(), async (req, res) => {
  try {
    const { taxData, email } = req.body;
    if (!email || !taxData) {
      return res
        .status(400)
        .json({ success: false, error: "חסר מייל או נתונים" });
    }
    if (!process.env.MAILTRAP_USER || !process.env.MAILTRAP_PASS) {
      return res
        .status(500)
        .json({ success: false, error: "משתני סביבה ל-Mailtrap לא מוגדרים" });
    }
    const taxResult = calculateTax(taxData);
    const tempPath = path.join(
      __dirname,
      "pdfs",
      `tax-return-email-${Date.now()}.pdf`
    );
    await generateTaxPDFHtml(taxResult, tempPath);

    const transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
    });

    const mailOptions = {
      from: "tax-return@example.com",
      to: email,
      subject: "דוח החזר מס שנתי",
      text: "מצורף דוח החזר מס שנתי. נא לעיין במסמך.",
      attachments: [
        {
          filename: "tax-return.pdf",
          path: tempPath,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    fs.unlink(tempPath, () => {});
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, error: "שגיאה בשליחת המייל (Mailtrap)" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
