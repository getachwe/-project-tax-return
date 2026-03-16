const pdfParse = require("pdf-parse");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { extractTextFromImage } = require("./extractors/imageOcr");
const { extractTextFromPdf } = require("./extractors/pdfExtractor");
const { FIELD_PATTERNS } = require("./patterns/fieldPatterns");
const { TAX_CODES } = require("./patterns/taxCodes");
const { getMissingFields } = require("./utils/fieldUtils");
const { extractForm106ViaLlm, extractForm106ViaVision } = require("./services/llmForm106");
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
    // PDF סרוק – ננסה OCR על דפי ה-PDF (דורש GraphicsMagick + Ghostscript במערכת)
    let lastPdfError = null;

    const tryInMemory = async (density) => {
      try {
        const memConverter = fromPath(filePath, {
          density,
          format: "png",
          quality: 70,
        });
        const memResults = await memConverter.bulk(-1, { responseType: "base64" });
        if (!Array.isArray(memResults)) return null;
        let ocrText = "";
        for (const r of memResults) {
          let imgTempPath = null;
          try {
            const base64 = r && (r.base64 || r);
            if (typeof base64 === "string") {
              const clean = base64.replace(/^data:image\/\w+;base64,/, "");
              const buf = Buffer.from(clean, "base64");
              imgTempPath = path.join(
                os.tmpdir(),
                `tax-ocr-${Date.now()}-${Math.random().toString(36).slice(2)}.png`
              );
              fs.writeFileSync(imgTempPath, buf);
              const pageText = await extractTextFromImage(imgTempPath);
              ocrText += "\n" + pageText;
            } else if (r && r.path && typeof r.path === "string") {
              const pageText = await extractTextFromImage(r.path);
              ocrText += "\n" + pageText;
            }
          } finally {
            if (imgTempPath && fs.existsSync(imgTempPath)) {
              try { fs.unlinkSync(imgTempPath); } catch (_) {}
            }
          }
        }
        if (ocrText && ocrText.replace(/\s/g, "").length > 30) return ocrText;
      } catch (e) {
        lastPdfError = e;
      }
      return null;
    };

    const densities = [180, 150, 120];
    for (const d of densities) {
      const memText = await tryInMemory(d);
      if (memText) return memText;
    }

    // נסיון שני: המרה לדיסק עמוד-עמוד
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
        const result = await converter(page, { responseType: "image" });
        const imgPath = typeof result === "string" ? result : (result && result.path);
        if (!imgPath) continue;
        try {
          const pageText = await extractTextFromImage(imgPath);
          ocrText += "\n" + pageText;
        } finally {
          if (typeof imgPath === "string" && fs.existsSync(imgPath)) {
            try { fs.unlinkSync(imgPath); } catch (_) {}
          }
        }
      }
      if (ocrText && ocrText.replace(/\s/g, "").length > 30) {
        removeDirSafe(savePath);
        return ocrText;
      }
    } catch (e) {
      lastPdfError = e;
      console.error("PDF OCR fallback failed:", e.message);
    } finally {
      removeDirSafe(savePath);
    }

    const hint = (lastPdfError && (lastPdfError.message || "").toLowerCase().includes("gm")) ||
      (lastPdfError && (lastPdfError.message || "").includes("spawn"))
      ? " ייתכן שחסרים GraphicsMagick או Ghostscript במחשב – או העלה את דפי הטופס כתמונות (JPG/PNG)."
      : " נסה להעלות קובץ תמונה (JPG/PNG) של הטופס, או PDF טקסטואלי.";
    throw new Error(
      "לא ניתן היה לחלץ טקסט מה-PDF." + hint
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
    if (!filePath || typeof filePath !== "string") {
      return { success: false, error: "חסר נתיב קובץ" };
    }
    if (!fs.existsSync(filePath)) {
      return { success: false, error: "הקובץ לא נמצא בשרת" };
    }

    const llmEnabled = process.env.LLM_ENABLED === "true" || process.env.LLM_ENABLED === "1";
    const isImage = mimetype && mimetype.startsWith("image/");

    // תמונה + LLM: שליחה ישירה ל-Vision API (מהיר, בלי OCR)
    if (isImage && llmEnabled && process.env.OPENAI_API_KEY) {
      try {
        const visionData = await extractForm106ViaVision(filePath);
        if (visionData && typeof visionData === "object" && Object.keys(visionData).length > 0) {
          const missingFields = getMissingFields(visionData, REQUIRED_FIELDS);
          return {
            success: true,
            data: visionData,
            missingFields,
            taxFields: {},
          };
        }
      } catch (err) {
        console.error("Vision extraction failed, falling back to OCR:", err.message);
      }
    }

    const text = await extractTextSmart(filePath, mimetype);
    const template = detectTemplate(text);
    const patterns = FIELD_PATTERNS[template] || FIELD_PATTERNS["default"];
    let data = parseText(text, patterns, TAX_CODES);

    if (llmEnabled && process.env.OPENAI_API_KEY) {
      try {
        data = await extractForm106ViaLlm(text, data);
      } catch (err) {
        console.error("LLM extraction failed, using regex data only:", err.message);
      }
    }

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
