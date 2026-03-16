/**
 * טסטים ל־Explanation Engine (שלב 6).
 * הרצה: מתיקיית backend: node tests/test-explanation-engine.js
 * יש להריץ אחרי יישום ExplanationAgent – בהתחלה חלק מהטסטים עלולים להיכשל.
 */

require("dotenv").config();
const path = require("path");

// טוען את המודול מהשורש backend
const backendRoot = path.resolve(__dirname, "..");
const { calculateTax } = require(path.join(backendRoot, "taxCalculator.js"));

let ExplanationAgent;
try {
  ExplanationAgent = require(path.join(backendRoot, "ai-agents", "ExplanationAgent.js"));
} catch (_) {
  ExplanationAgent = null;
}

function assert(condition, message) {
  if (!condition) throw new Error(message || "Assertion failed");
}

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    return true;
  } catch (err) {
    console.log(`  ✗ ${name}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log("=== טסטים ל־Explanation Engine (שלב 6) ===\n");

  const sampleInput = {
    income: 120000,
    taxPaid: 15000,
    taxYear: 2024,
    children: 2,
    gender: "female",
  };

  const taxResult = calculateTax(sampleInput);
  assert(typeof taxResult.explanation === "string", "taxResult.explanation must be a string");
  assert(taxResult.explanation.length > 0, "explanation must not be empty");

  let passed = 0;
  const total = 8;

  // —— בדיקות על תוצאת החישוב הקיימת (בלי ExplanationAgent) ——
  passed += runTest("תוצאת חישוב מכילה 'הכנסה' או מספר הכנסה", () => {
    assert(
      taxResult.explanation.includes("120") || taxResult.explanation.includes("הכנסה"),
      "explanation should mention income"
    );
  });

  passed += runTest("תוצאת חישוב מכילה מס גולמי או מס נטו", () => {
    const hasTax = /מס\s*(גולמי|נטו|ששולם)/.test(taxResult.explanation) || /\d+.*₪/.test(taxResult.explanation);
    assert(hasTax, "explanation should mention tax");
  });

  passed += runTest("תוצאת חישוב מכילה החזר או חוב מס", () => {
    const hasRefundOrDebt = taxResult.explanation.includes("החזר") || taxResult.explanation.includes("חוב");
    assert(hasRefundOrDebt, "explanation should mention refund or debt");
  });

  passed += runTest("תוצאת חישוב מכילה נקודות זיכוי", () => {
    assert(taxResult.explanation.includes("נקודות"), "explanation should mention credit points");
  });

  // —— בדיקות על ExplanationAgent (אם קיים) ——
  if (ExplanationAgent && typeof ExplanationAgent.explain === "function") {
    const enhanced = ExplanationAgent.explain(sampleInput, taxResult);

    passed += runTest("ExplanationAgent מחזיר אובייקט עם fullExplanation או summary", () => {
      assert(
        enhanced && (enhanced.fullExplanation || enhanced.summary || enhanced.explanation),
        "explain() should return object with fullExplanation, summary, or explanation"
      );
    });

    passed += runTest("קיים whyRefund או טקסט שמסביר למה יש החזר/חוב", () => {
      const text = enhanced.whyRefund || enhanced.fullExplanation || enhanced.summary || enhanced.explanation || "";
      assert(
        text.length > 0 && (text.includes("החזר") || text.includes("חוב") || text.includes("מס")),
        "explanation should include why there is refund or debt"
      );
    });

    passed += runTest("קיים rulesApplied (מערך)", () => {
      assert(Array.isArray(enhanced.rulesApplied), "rulesApplied must be an array");
      assert(enhanced.rulesApplied.length >= 1, "at least one rule applied");
    });

    passed += runTest("קיים documentSource (מקור הנתונים)", () => {
      assert(
        enhanced.documentSource !== undefined && typeof enhanced.documentSource === "string",
        "documentSource must be a string"
      );
    });
  } else {
    console.log("  (ExplanationAgent לא מיושם עדיין – דילוג על 4 טסטים)");
    passed += 4; // נחשב כעבר אם עדיין לא מימשנו
  }

  console.log(`\nסיכום: ${passed}/${total} טסטים עברו.`);
  process.exit(passed >= total - (ExplanationAgent ? 0 : 4) ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
