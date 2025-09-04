const Tesseract = require("tesseract.js");
let Jimp;
try {
  Jimp = require("jimp");
} catch (_) {
  Jimp = null;
}

async function preprocessImage(inputPath) {
  if (!Jimp) return inputPath;
  try {
    const img = await Jimp.read(inputPath);
    const scale = 1.5;
    img
      .resize(Math.round(img.bitmap.width * scale), Jimp.AUTO)
      .greyscale()
      .blur(1)
      .normalize()
      .contrast(0.4)
      .posterize(3);
    await img.writeAsync(inputPath);
    return inputPath;
  } catch (_) {
    return inputPath;
  }
}

async function extractTextFromImage(filePath) {
  const preprocessedPath = await preprocessImage(filePath);
  const {
    data: { text },
  } = await Tesseract.recognize(preprocessedPath, "heb+eng", {
    logger: (m) => console.log(m),
  });
  return text;
}

module.exports = { extractTextFromImage };
