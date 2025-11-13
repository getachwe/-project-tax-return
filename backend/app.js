require("dotenv").config();
const express = require("express");
const cors = require("cors");

function createApp() {
  const app = express(); // Middlewares

  app.use(cors());
  app.use(express.json()); // Health check

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  }); // Modular routers - Removed redundant '/api' prefix

  app.use("/auth", require("./routes/auth"));
  app.use("/profile", require("./routes/profile"));
  app.use("/calculations", require("./routes/calculations"));
  app.use("/process-106", require("./routes/process106"));
  app.use("/", require("./routes/pdf"));
  app.use("/", require("./routes/email"));
  app.use("/", require("./routes/reports"));
  app.use("/", require("./routes/calculate"));

  return app;
}

module.exports = { createApp };
