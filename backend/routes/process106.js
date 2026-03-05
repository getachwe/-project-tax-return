const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const { extract106 } = require("../extract106");
const { calculateTax } = require("../taxCalculator");

const REQUIRED_FIELDS_MIN = ["income", "taxPaid", "taxYear", "maritalStatus"];
function getMissingFieldsByName(data) {
  const source = data || {};
  return REQUIRED_FIELDS_MIN.filter(
    (key) =>
      source[key] === undefined || source[key] === null || source[key] === ""
  );
}

router.post("/", upload.single("file"), async (req, res) => {
  try {
    let codeMap, missingFields;
    if (req.file) {
      const result = await extract106(req.file.path, req.file.mimetype);
      if (!result.success)
        return res.status(400).json({ success: false, error: result.error });
      codeMap = result.data;
      missingFields = Array.isArray(result.missingFields)
        ? result.missingFields
        : getMissingFieldsByName(codeMap);
    } else {
      codeMap = req.body || {};
      missingFields = getMissingFieldsByName(codeMap);
    }
    if (missingFields.length > 0)
      return res.json({ success: true, data: codeMap, missingFields }); // data = JSON מלא להצגה בטופס
    const taxResult = calculateTax(codeMap);
    res.json({ success: true, data: taxResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
