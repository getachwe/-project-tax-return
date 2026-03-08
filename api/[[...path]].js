/**
 * Vercel API catch-all – מפנה את כל /api/* ל-Express
 * קובץ יחיד במקום 12+ פונקציות (מגבלת Hobby)
 */
const serverless = require("serverless-http");
process.env.VERCEL = "1";

let handler;
try {
  const { createApp } = require("../backend/app");
  const app = createApp();
  handler = serverless(app);
} catch (err) {
  console.error("API handler init failed:", err);
  handler = async (req, res) => {
    res.status(500).json({ error: "Backend init failed", message: err.message });
  };
}

module.exports = handler;
