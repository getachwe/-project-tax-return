/**
 * תמיכה ב-Vercel serverless – שימוש ב-/tmp במקום תיקיות מקומיות
 */
const path = require("path");
const os = require("os");
const fs = require("fs");

const isVercel = process.env.VERCEL === "1";

const PDFS_BASE = isVercel ? os.tmpdir() : path.join(__dirname, "..", "pdfs");

function getPdfPath(filename) {
  if (!isVercel) {
    const pdfsDir = path.join(__dirname, "..", "pdfs");
    try {
      fs.mkdirSync(pdfsDir, { recursive: true });
    } catch (_) {}
  }
  return path.join(PDFS_BASE, filename);
}

module.exports = { getPdfPath, PDFS_BASE, isVercel };
