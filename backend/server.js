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

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

const REQUIRED_CODES = ["158", "170"];

function getMissingCodes(codeMap) {
  return REQUIRED_CODES.filter(
    (code) =>
      codeMap[code] === undefined ||
      codeMap[code] === null ||
      codeMap[code] === ""
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
    let codeMap, missingCodes;
    if (req.file) {
      const result = await extract106(req.file.path, req.file.mimetype);
      codeMap = result.data;
      missingCodes = getMissingCodes(codeMap);
    } else {
      codeMap = req.body;
      missingCodes = getMissingCodes(codeMap);
    }
    if (missingCodes.length > 0) {
      return res.json({
        success: true,
        data: codeMap,
        missingFields: missingCodes,
      });
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
