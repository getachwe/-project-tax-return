require("dotenv").config();
const express = require("express");
const cors = require("cors");

function createApp() {
  const app = express(); // Middlewares

  app.use(cors());
  app.use(express.json()); // Health check

  // Health check
  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API routes - With /api prefix because Vercel passes the full path
  // When Vercel routes /api/* to this function, it passes the full path including /api
  app.use("/api/auth", require("./routes/auth"));
  app.use("/api/profile", require("./routes/profile"));
  app.use("/api/calculations", require("./routes/calculations"));
  app.use("/api/process-106", require("./routes/process106"));
  app.use("/api", require("./routes/pdf"));
  app.use("/api", require("./routes/email"));
  app.use("/api", require("./routes/reports"));
  app.use("/api", require("./routes/calculate"));

  return app;
}

module.exports = { createApp };
