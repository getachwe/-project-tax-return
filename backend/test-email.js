require("dotenv").config();
const nodemailer = require("nodemailer");

async function testEmail() {
  console.log("Testing email configuration...");

  const hasGenericSmtp =
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;

  if (!hasGenericSmtp) {
    console.error("❌ SMTP configuration missing!");
    console.log("Please set SMTP_USER and SMTP_PASS in .env file");
    return;
  }

  console.log("✅ SMTP configuration found");

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure:
        String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.verify();
    console.log("✅ SMTP connection verified!");

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject: "Test Email - Tax Return App",
      text: "Test email from Tax Return app",
    });

    console.log("✅ Test email sent successfully!");
    console.log(`Message ID: ${info.messageId}`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.code === "EAUTH") {
      console.log("💡 Check your Gmail App Password");
    }
  }
}

testEmail()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
