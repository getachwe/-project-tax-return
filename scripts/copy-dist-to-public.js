#!/usr/bin/env node
/** Copies project/dist to public/ for Vercel deployment (cross-platform) */
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "project", "dist");
const dest = path.join(__dirname, "..", "public");

if (!fs.existsSync(src)) {
  console.error("Error: project/dist not found. Run build:frontend first.");
  process.exit(1);
}

if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

function copyRecursive(srcDir, destDir) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const ent of entries) {
    const s = path.join(srcDir, ent.name);
    const d = path.join(destDir, ent.name);
    if (ent.isDirectory()) {
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
      copyRecursive(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

copyRecursive(src, dest);
console.log("Copied project/dist to public/");
