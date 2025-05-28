const pdfParse = require("pdf-parse");
const fs = require("fs");
const { extractTextFromImage } = require("./extractors/imageOcr");
const { extractTextFromPdf } = require("./extractors/pdfExtractor");
const { FIELD_PATTERNS } = require("./patterns/fieldPatterns");
const { TAX_CODES } = require("./patterns/taxCodes");
const { getMissingFields } = require("./utils/fieldUtils");
const { parseText } = require("./parsers/dataParser");

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
    const text = await extractTextFromPdf(filePath);
    const data = parseText(text, FIELD_PATTERNS, TAX_CODES);
    const missingFields = getMissingFields(data, REQUIRED_FIELDS);
    return {
      success: true,
      data,
      missingFields,
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
