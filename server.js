/**
 * Vercel – נקודת כניסה ל-Express
 * Vercel מזהה אוטומטית server.js ומריץ אותו
 */
process.env.VERCEL = "1";

const path = require("path");
const express = require("express");
const { createApp } = require("./backend/app");

const app = createApp();

// SPA – קבצים סטטיים + fallback
const distDir = path.join(__dirname, "project", "dist");
app.use(express.static(distDir));
app.get("*", (req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

module.exports = app;
