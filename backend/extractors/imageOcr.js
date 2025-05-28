const Tesseract = require("tesseract.js");

async function extractTextFromImage(filePath) {
  const {
    data: { text },
  } = await Tesseract.recognize(filePath, "heb+eng", {
    logger: (m) => console.log(m),
  });
  return text;
}

module.exports = { extractTextFromImage };
