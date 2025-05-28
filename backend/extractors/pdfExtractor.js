const fs = require("fs");
const pdfParse = require("pdf-parse");

async function extractTextFromPdf(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`File not found: ${filePath}`);
    }
    throw error;
  }
}

module.exports = { extractTextFromPdf };
