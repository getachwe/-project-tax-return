/**
 * Generate PDF - tries Puppeteer (Html) first, falls back to pdfMake when Chromium unavailable (e.g. Render free tier).
 */
const { generateTaxPDFMake } = require("../pdfGeneratorMake");

async function generateTaxPDF(data, outputPath) {
  try {
    const { generateTaxPDFHtml } = require("../pdfGeneratorHtml");
    await generateTaxPDFHtml(data, outputPath);
    return;
  } catch (err) {
    const msg = (err.message || "").toLowerCase();
    if (
      msg.includes("chrome") ||
      msg.includes("chromium") ||
      msg.includes("executable")
    ) {
      console.log("[PDF] Puppeteer unavailable, using pdfMake fallback");
      await generateTaxPDFMake(data, outputPath);
      return;
    }
    throw err;
  }
}

module.exports = { generateTaxPDF };
