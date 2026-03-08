// Vercel serverless – משתמש בבקאנד המשותף
const serverless = require("serverless-http");

// על Vercel – API על אותו דומיין כמו הפרונט
process.env.VERCEL = "1";

let handler;
try {
  const { createApp } = require("../backend/app");
  const app = createApp();
  handler = serverless(app);
} catch (err) {
  console.error("Failed to load backend:", err);
  handler = async (req, res) => {
    res.status(500).json({ error: "Backend init failed", message: err.message });
  };
}

module.exports = handler;
