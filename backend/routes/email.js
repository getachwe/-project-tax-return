const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { getPdfPath } = require("../utils/paths");
const nodemailer = require("nodemailer");
const { calculateTax } = require("../taxCalculator");
const { generateTaxPDF } = require("../utils/pdfHelper");
const { getSupabaseServiceClient } = require("../supabaseClient");
const { getBearerToken } = require("../utils/authHelpers");

router.post("/send-tax-return-email", async (req, res) => {
  try {
    console.log("=== Email Request ===");
    console.log("Body:", JSON.stringify(req.body, null, 2));

    const { taxData, email, reportId } = req.body;
    if (!email || !taxData) {
      console.log("Missing email or taxData");
      return res
        .status(400)
        .json({ success: false, error: "חסר מייל או נתונים" });
    }

    const hasGenericSmtp =
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS;
    const hasMailtrap = process.env.MAILTRAP_USER && process.env.MAILTRAP_PASS;
    if (!hasGenericSmtp && !hasMailtrap)
      return res.status(500).json({ success: false, error: "SMTP לא מוגדר" });

    let tempPath;
    let pdfFileName = "tax-return.pdf";

    // Try to use existing PDF from Supabase Storage if reportId is provided
    if (reportId) {
      try {
        const service = await getSupabaseServiceClient();
        const token = getBearerToken(req);

        if (token) {
          const { data: userData, error: userError } =
            await service.auth.getUser(token);
          if (!userError && userData.user) {
            const { data: report, error: fetchError } = await service
              .from("reports")
              .select("storage_path, file_name")
              .eq("id", reportId)
              .eq("user_id", userData.user.id)
              .single();

            if (!fetchError && report) {
              console.log(
                "Using existing PDF from storage:",
                report.storage_path
              );
              const { data: pdfData, error: downloadError } =
                await service.storage
                  .from("reports")
                  .download(report.storage_path);

              if (!downloadError && pdfData) {
                tempPath = getPdfPath(`existing-${Date.now()}.pdf`);
                fs.writeFileSync(
                  tempPath,
                  Buffer.from(await pdfData.arrayBuffer())
                );
                pdfFileName = report.file_name || "tax-return.pdf";
                console.log("Successfully downloaded existing PDF");
              }
            }
          }
        }
      } catch (e) {
        console.log(
          "Error using existing PDF, will generate new one:",
          e.message
        );
      }
    }

    // Generate new PDF if we couldn't use existing one
    if (!tempPath) {
      console.log("Generating new PDF");
      const taxResult = calculateTax(taxData);
      tempPath = getPdfPath(`tax-return-email-${Date.now()}.pdf`);
      await generateTaxPDF({ ...taxData, ...taxResult }, tempPath);
    }

    let transporter;
    if (hasGenericSmtp) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure:
          String(process.env.SMTP_SECURE || "true").toLowerCase() === "true",
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
    } else {
      transporter = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: process.env.MAILTRAP_USER,
          pass: process.env.MAILTRAP_PASS,
        },
      });
    }

    // שליחת המייל ברקע – נענה ללקוח מיד כדי לחסוך המתנה
    setImmediate(async () => {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || "tax-return@example.com",
          to: `${email}, ${process.env.SMTP_USER}`, // שליחה גם לכתובת שהזנת וגם לכתובת שלך
          subject: "דוח החזר מס שנתי",
          text: "מצורף דוח החזר מס שנתי. נא לעיין במסמך.",
          attachments: [{ filename: pdfFileName, path: tempPath }],
        });
      } catch (e) {
        console.error("Async email send failed:", e.message);
      } finally {
        fs.unlink(tempPath, () => {});
      }
    });

    // מחזירים הצלחה מיידית לממשק – המייל יישלח ברקע
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: "שגיאה בשליחת המייל" });
  }
});

module.exports = router;
