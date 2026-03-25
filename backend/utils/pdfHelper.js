/**
 * Generate PDF — tries Puppeteer (HTML) first, falls back to pdfMake on any failure.
 * On Vercel: PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1 → launch fails; also timeouts from
 * networkidle0 / external fonts must not surface as 500.
 */
const { generateTaxPDFMake } = require("../pdfGeneratorMake");

async function generateTaxPDF(data, outputPath) {
  try {
    const { generateTaxPDFHtml } = require("../pdfGeneratorHtml");
    await generateTaxPDFHtml(data, outputPath);
    return;
  } catch (err) {
    console.warn("[PDF] HTML/Puppeteer path failed, using pdfMake:", err.message);
    await generateTaxPDFMake(data, outputPath);
  }
}

module.exports = { generateTaxPDF };
