const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const { calculateTax } = require("../taxCalculator");
const { generateTaxPDFHtml } = require("../pdfGeneratorHtml");

router.post("/send-tax-return-email", async (req, res) => {
  try {
    console.log("=== Email Request ===");
    console.log("Body:", JSON.stringify(req.body, null, 2));

    const { taxData, email } = req.body;
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

    const taxResult = calculateTax(taxData);
    const tempPath = path.join(
      __dirname,
      "..",
      "pdfs",
      `tax-return-email-${Date.now()}.pdf`
    );
    await generateTaxPDFHtml(taxResult, tempPath);

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

    await transporter.sendMail({
      from: process.env.SMTP_FROM || "tax-return@example.com",
      to: `${email}, ${process.env.SMTP_USER}`, // שליחה גם לכתובת שהזנת וגם לכתובת שלך
      subject: "דוח החזר מס שנתי",
      text: "מצורף דוח החזר מס שנתי. נא לעיין במסמך.",
      attachments: [{ filename: "tax-return.pdf", path: tempPath }],
    });
    fs.unlink(tempPath, () => {});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: "שגיאה בשליחת המייל" });
  }
});

module.exports = router;
