const pdfParse = require("pdf-parse");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { extractTextFromImage } = require("./extractors/imageOcr");
const { extractTextFromPdf } = require("./extractors/pdfExtractor");
const { FIELD_PATTERNS } = require("./patterns/fieldPatterns");
const { TAX_CODES } = require("./patterns/taxCodes");
const { getMissingFields } = require("./utils/fieldUtils");
const { fromPath } = require("pdf2pic");
async function getPdfPageCount(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const info = await pdfParse(buffer);
    return info.numpages || info.numpdfPages || 0;
  } catch (_) {
    return 0;
  }
}

const {
  parseText,
  detectTemplate,
  extractTaxFields,
} = require("./parsers/dataParser");

function ensureDirExists(dirPath) {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
  } catch (_) {}
}

function removeDirSafe(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      for (const f of fs.readdirSync(dirPath)) {
        try {
          fs.unlinkSync(path.join(dirPath, f));
        } catch (_) {}
      }
      fs.rmdirSync(dirPath);
    }
  } catch (_) {}
}

// פונקציה חכמה לחילוץ טקסט - תומכת בתמונה וב-PDF טקסטואלי
async function extractTextSmart(filePath, mimetype) {
  if (mimetype && mimetype.startsWith("image/")) {
    // קובץ תמונה
    return await extractTextFromImage(filePath);
  }
  if (mimetype === "application/pdf") {
    // ננסה לחלץ טקסט מה-PDF
    const text = await extractTextFromPdf(filePath);
    if (text && text.replace(/\s/g, "").length > 30) {
      return text;
    }
    // PDF סרוק – ננסה OCR על דפי ה-PDF
    // קודם ננסה המרה לזיכרון כדי להימנע מבעיות כתיבה לדיסק
    const tryInMemory = async (density) => {
      try {
        const memConverter = fromPath(filePath, {
          density,
          format: "png",
          /** no savePath -> return as objects (may include base64) */
          quality: 70,
        });
        const memResults = await memConverter.bulk(-1);
        let ocrText = "";
        for (const r of memResults) {
          let imgTempPath = null;
          try {
            if (r.base64) {
              const base64 = r.base64.replace(/^data:image\/png;base64,/, "");
              const buf = Buffer.from(base64, "base64");
              imgTempPath = path.join(
                os.tmpdir(),
                `tax-ocr-${Date.now()}-${Math.random()
                  .toString(36)
                  .slice(2)}.png`
              );
              fs.writeFileSync(imgTempPath, buf);
              const pageText = await extractTextFromImage(imgTempPath);
              ocrText += "\n" + pageText;
            } else if (r.path) {
              const pageText = await extractTextFromImage(r.path);
              ocrText += "\n" + pageText;
            }
          } finally {
            if (imgTempPath) {
              try {
                fs.unlinkSync(imgTempPath);
              } catch (_) {}
            }
          }
        }
        if (ocrText && ocrText.replace(/\s/g, "").length > 30) return ocrText;
      } catch (e) {
        // fall back
      }
      return null;
    };

    const densities = [180, 150, 120];
    for (const d of densities) {
      const memText = await tryInMemory(d);
      if (memText) return memText;
    }

    // אם ההמרה בזיכרון נכשלה – ננסה לדיסק עם תקיה זמנית מוגנת, עמוד-עמוד
    const savePath = path.join(os.tmpdir(), `tax-ocr-${Date.now()}`);
    ensureDirExists(savePath);
    try {
      const converter = fromPath(filePath, {
        density: 180,
        saveFilename: `scan_${Date.now()}`,
        savePath,
        format: "png",
        quality: 70,
      });
      const totalPages = (await getPdfPageCount(filePath)) || 1;
      let ocrText = "";
      for (let page = 1; page <= totalPages; page++) {
        const result = await converter(page, true);
        const imgPath = result.path || result;
        try {
          const pageText = await extractTextFromImage(imgPath);
          ocrText += "\n" + pageText;
        } finally {
          try {
            fs.unlinkSync(imgPath);
          } catch (_) {}
        }
      }
      if (ocrText && ocrText.replace(/\s/g, "").length > 30) {
        removeDirSafe(savePath);
        return ocrText;
      }
    } catch (e) {
      // אם OCR נכשל, ניפול לשגיאה כללית מטה
      console.error("PDF OCR fallback failed:", e.message);
    } finally {
      removeDirSafe(savePath);
    }
    throw new Error(
      "לא ניתן היה לחלץ טקסט מה-PDF. נסה קובץ תמונה (JPG/PNG) או PDF טקסטואלי."
    );
  }
  throw new Error("סוג קובץ לא נתמך. נא להעלות קובץ תמונה (JPG/PNG) או PDF.");
}

// Required fields for the tax simulator
const REQUIRED_FIELDS = [
  "income",
  "taxPaid",
  "taxCredits",
  "employmentType",
  "children",
  "workPeriod",
  "creditPoints",
  "additionalIncome",
  "taxYear",
  "birthDate",
  "workStartDate",
  "workEndDate",
  "childAllowance",
  "disabilityAllowance",
  "oldAgeAllowance",
  "address",
  "maritalStatus",
  "residency",
  "employeeName",
  "employeeId",
  "employerName",
  "employerId",
  "department",
  "jobTitle",
  "deductions991",
  "deductions182",
  "deductions505",
  "deductions184",
  "deductions176",
  "pension201",
  "pension230",
  "pension2560",
  "pension31446",
  "pension59523",
  "pension11926",
  "formDate",
  "fileNumber",
  "positionNumber",
  "bankAccount",
  "formNumber",
  "managerName",
];

async function extract106(filePath, mimetype) {
  try {
    if (!filePath) {
      throw new Error("File path is required");
    }
    const text = await extractTextSmart(filePath, mimetype);
    const template = detectTemplate(text);
    const patterns = FIELD_PATTERNS[template] || FIELD_PATTERNS["default"];
    const data = parseText(text, patterns, TAX_CODES);
    const missingFields = getMissingFields(data, REQUIRED_FIELDS);
    const taxFields = extractTaxFields(text);
    return {
      success: true,
      data,
      missingFields,
      taxFields,
    };
  } catch (error) {
    console.error("Error extracting data:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = { extract106 };
