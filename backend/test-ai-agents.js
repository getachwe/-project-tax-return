/**
 * בדיקה מקומית ל־AI Agents ו־Pipeline.
 * הרצה: מהתיקייה backend:
 *   node test-ai-agents.js
 * וודא ש־.env מכיל AI_AGENTS_ENABLED=true (אופציונלי – הסקריפט מריץ את הצינור ישירות).
 */

require("dotenv").config();

const { runPipeline } = require("./ai-agents/pipeline");

const sampleData = {
  income: 120000,
  taxPaid: 15000,
  taxYear: 2024,
  children: 2,
  gender: "female",
};

async function main() {
  console.log("=== בדיקת AI Agents Pipeline ===\n");
  console.log("נתוני דוגמה:", JSON.stringify(sampleData, null, 2));
  console.log("");

  try {
    const result = await runPipeline(sampleData);
    console.log("confidenceScore:", result.confidenceScore);
    console.log("riskLevel:", result.riskLevel);
    console.log("recommendations:", result.recommendations);
    console.log("validation:", JSON.stringify(result.validation, null, 2));
    console.log("\nהצינור עבד בהצלחה.");
  } catch (err) {
    console.error("שגיאה:", err.message);
    process.exit(1);
  }
}

main();
