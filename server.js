/**
 * Vercel – נקודת כניסה ל-Express
 * Vercel מזהה אוטומטית server.js ומריץ אותו
 */
process.env.VERCEL = "1";

const path = require("path");
const express = require("express");
const { createApp } = require("./backend/app");

const app = createApp();

// SPA – קבצים סטטיים (public מועתק מ-build) + fallback
const staticDir = path.join(__dirname, "public");
const distDir = path.join(__dirname, "project", "dist");
const dir = require("fs").existsSync(staticDir) ? staticDir : distDir;
app.use(express.static(dir));
app.get("*", (req, res) => {
  res.sendFile(path.join(dir, "index.html"));
});

module.exports = app;
