require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Lazy loader – טוען routes רק כשנשלחת בקשה, כדי ש-/health יעבוד גם אם Puppeteer/pdf2pic נכשלים
function lazyRoute(loader) {
  let router = null;
  return (req, res, next) => {
    try {
      if (!router) router = loader();
      router(req, res, next);
    } catch (err) {
      console.error("[lazyRoute] Load error:", err.message);
      res.status(500).json({ error: "Service temporarily unavailable" });
    }
  };
}

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
        if (/^https:\/\/[a-zA-Z0-9.-]+\.vercel\.app$/.test(origin)) return callback(null, true);
        callback(null, false);
      },
      credentials: true,
    })
  );
  app.options("*", cors());

  app.use(express.json());

  // Health – על Vercel רק /health (שורש משרת SPA)
  const healthPaths = process.env.VERCEL ? ["/health"] : ["/", "/health"];
  app.get(healthPaths, (req, res) => {
    res.json({ status: "ok" });
  });

  app.use((req, res, next) => {
    console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
      console.log("Content-Type:", req.headers["content-type"]);
    }
    next();
  });

  // API routes – lazy load
  app.use("/api/auth", lazyRoute(() => require("./routes/auth")));
  app.use("/api/profile", lazyRoute(() => require("./routes/profile")));
  app.use("/api/calculations", lazyRoute(() => require("./routes/calculations")));
  app.use("/api/process-106", lazyRoute(() => require("./routes/process106")));
  app.use("/api", lazyRoute(() => require("./routes/pdf")));
  app.use("/api", lazyRoute(() => require("./routes/email")));
  app.use("/api", lazyRoute(() => require("./routes/reports")));
  app.use("/api", lazyRoute(() => require("./routes/calculate")));

  return app;
}

module.exports = { createApp };
