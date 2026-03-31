const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { getPdfPath } = require("../utils/paths");
const { calculateFromUserInput } = require("../taxEngine/calculateFromUserInput");
const { generateTaxPDF } = require("../utils/pdfHelper");
const { generateTaxPDFMake } = require("../pdfGeneratorMake");
const { getSupabaseServiceClient } = require("../supabaseClient");
const { getBearerToken } = require("../utils/authHelpers");

router.get("/download/tax-return.pdf", (req, res) => {
  const filePath = getPdfPath("tax-return.pdf");
  if (!fs.existsSync(filePath)) return res.status(404).send("הקובץ לא נמצא");
  res.sendFile(filePath);
});

router.post("/generate-pdf", async (req, res) => {
  try {
    console.log("=== PDF Generation Request ===");

    const taxData = req.body || {};
    if ((taxData.income == null || taxData.income === "") || (taxData.taxPaid == null || taxData.taxPaid === "")) {
      return res.status(400).json({ error: "חסרים נתונים לחישוב (הכנסה, מס ששולם)" });
    }
    let taxResult;
    try {
      taxResult = calculateFromUserInput(taxData);
    } catch (calcErr) {
      console.error("PDF: calculateTax failed:", calcErr.message);
      return res.status(400).json({ error: calcErr.message || "נתונים לא תקינים לחישוב" });
    }
    console.log("Tax calculation result:", taxResult);
    const tempPath = getPdfPath(`tax-return-${Date.now()}.pdf`);
    // taxData אחרון היה דורס מספרים מחושבים (למשל creditPoints כמחרוזת) → שגיאת toFixed ב-PDF
    await generateTaxPDF({ ...taxData, ...taxResult }, tempPath);

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
    const finalName = `${safeName}-${year}.pdf`;

    // Save to Supabase Storage if user is authenticated
    let reportId = null;
    const token = getBearerToken(req);
    console.log("Token found:", !!token);
    console.log("Save to storage:", req.body.saveToStorage);

    if (token && req.body.saveToStorage) {
      console.log("Attempting to save to Supabase...");
      try {
        const service = await getSupabaseServiceClient();
        const { data: userData, error: userError } = await service.auth.getUser(
          token
        );
        if (!userError && userData.user) {
          console.log("User authenticated:", userData.user.id);
          const userId = userData.user.id;
          const storagePath = `${userId}/${Date.now()}-${finalName.replace(
            /[^\x20-\x7E]/g,
            "_"
          )}`;
          console.log("Storage path:", storagePath);
          const fileBuffer = fs.readFileSync(tempPath);

          const { error: uploadError } = await service.storage
            .from("reports")
            .upload(storagePath, fileBuffer, {
              contentType: "application/pdf",
              upsert: false,
            });

          if (!uploadError) {
            console.log("PDF uploaded successfully to storage");
            // Save to database
            const { data: reportData, error: insertError } = await service
              .from("reports")
              .insert({
                user_id: userId,
                tax_data: taxData,
                calculation_result: taxResult,
                storage_path: storagePath,
                file_name: finalName,
                year: Number(year),
                created_at: new Date().toISOString(),
              })
              .select("id")
              .single();

            if (!insertError) {
              reportId = reportData.id;
              console.log("Report saved to database with ID:", reportId);
              res.setHeader("X-Report-ID", reportId);
            } else {
              console.error("Database insert error:", insertError);
            }
          }
        }
      } catch (e) {
        console.log("Error saving to storage:", e.message);
      }
    }

    res.setHeader("Content-Type", "application/pdf");
    const asciiFallback = finalName.replace(/[^\u0000-\u007F]/g, "_");
    const encoded = encodeURIComponent(finalName);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`
    );
    const stream = fs.createReadStream(tempPath);
    stream.pipe(res);
    stream.on("close", () => fs.unlink(tempPath, () => {}));
  } catch (err) {
    console.error("PDF generation error:", err.message);
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(500).json({ error: err.message || "שגיאה ביצירת PDF" });
    }
    res.status(500).send("שגיאה ביצירת PDF");
  }
});

router.post("/generate-tax-return-pdfmake", async (req, res) => {
  try {
    const taxData = req.body || {};
    const taxResult = calculateFromUserInput(taxData);
    const tempPath = getPdfPath(`tax-return-make-${Date.now()}.pdf`);
    await generateTaxPDFMake({ ...taxData, ...taxResult }, tempPath);
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
