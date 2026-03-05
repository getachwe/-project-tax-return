require("dotenv").config();
const express = require("express");
const cors = require("cors");

function createApp() {
  const app = express();

  // CORS – לאפשר קריאה מה-frontend בוורסל ומהמכונה המקומית
  const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://project-tax-return.vercel.app",
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true); // קריאות צד שרת / health
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(null, false);
      },
      credentials: true,
    })
  );
  app.options("*", cors());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
      console.log("Content-Type:", req.headers["content-type"]);
      console.log("Body:", JSON.stringify(req.body, null, 2));
    }
    next();
  });
  
  app.use(express.json()); // Health check

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  }); // API routes with /api prefix for Vercel compatibility

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
