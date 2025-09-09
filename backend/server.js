require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Modular routers
app.use("/api/auth", require("./routes/auth"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/calculations", require("./routes/calculations"));
app.use("/api/process-106", require("./routes/process106"));
app.use("/api", require("./routes/pdf"));
app.use("/api", require("./routes/email"));

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
