const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { calculateTax } = require("../taxCalculator");
const { generateTaxPDFHtml } = require("../pdfGeneratorHtml");
const { generateTaxPDFMake } = require("../pdfGeneratorMake");

router.get("/download/tax-return.pdf", (req, res) => {
  const filePath = path.join(__dirname, "..", "pdfs", "tax-return.pdf");
  res.sendFile(filePath, (err) => {
    if (err) res.status(404).send("הקובץ לא נמצא");
  });
});

router.post("/generate-tax-return-pdf", async (req, res) => {
  try {
    const taxData = req.body;
    const taxResult = calculateTax(taxData);
    const tempPath = path.join(
      __dirname,
      "..",
      "pdfs",
      `tax-return-${Date.now()}.pdf`
    );
    await generateTaxPDFHtml({ ...taxResult, ...taxData }, tempPath);
    const fullName =
      [taxData.firstName, taxData.lastName].filter(Boolean).join(" ") ||
      taxData.employeeName ||
      taxData.name ||
      "דוח";
    const safeName = fullName
      .replace(/[^\u0590-\u05FF\w\s-]/g, "")
      .replace(/\s+/g, "_");
    const year =
      String(taxResult.taxYear || "").trim() ||
      String(new Date().getFullYear() - 1);
    res.setHeader("Content-Type", "application/pdf");
    const finalName = `${safeName}-${year}.pdf`;
    const asciiFallback = finalName.replace(/[^\u0000-\u007F]/g, "_");
    const encoded = encodeURIComponent(finalName);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`
    );
    const stream = fs.createReadStream(tempPath);
    stream.pipe(res);
    stream.on("close", () => fs.unlink(tempPath, () => {}));
  } catch (err) {
    res.status(500).send("שגיאה ביצירת PDF");
  }
});

router.post("/generate-tax-return-pdfmake", async (req, res) => {
  try {
    const taxData = req.body;
    const taxResult = calculateTax(taxData);
    const tempPath = path.join(
      __dirname,
      "..",
      "pdfs",
      `tax-return-make-${Date.now()}.pdf`
    );
    await generateTaxPDFMake({ ...taxResult, ...taxData }, tempPath);
    const fullName =
      [taxData.firstName, taxData.lastName].filter(Boolean).join(" ") ||
      taxData.employeeName ||
      taxData.name ||
      "דוח";
    const safeName = fullName
      .replace(/[^\u0590-\u05FF\w\s-]/g, "")
      .replace(/\s+/g, "_");
    const year =
      String(taxResult.taxYear || "").trim() ||
      String(new Date().getFullYear() - 1);
    res.setHeader("Content-Type", "application/pdf");
    const finalName = `${safeName}-${year}.pdf`;
    const asciiFallback = finalName.replace(/[^\u0000-\u007F]/g, "_");
    const encoded = encodeURIComponent(finalName);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`
    );
    const stream = fs.createReadStream(tempPath);
    stream.pipe(res);
    stream.on("close", () => fs.unlink(tempPath, () => {}));
  } catch (err) {
    res.status(500).send("שגיאה ביצירת PDF");
  }
});

module.exports = router;
