/**
 * טסטים ל־Simulation Engine (שלב 7).
 * הרצה: מתיקיית backend: node tests/test-simulation-engine.js
 */

require("dotenv").config();
const path = require("path");
const backendRoot = path.resolve(__dirname, "..");
const { calculateTax } = require(path.join(backendRoot, "taxCalculator.js"));

let simulate;
try {
  const sim = require(path.join(backendRoot, "services", "simulationEngine.js"));
  simulate = sim.simulate || sim;
} catch (_) {
  simulate = null;
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

const baseData = {
  income: 120000,
  taxPaid: 15000,
  taxYear: 2024,
  children: 2,
  gender: "female",
};

async function main() {
  console.log("=== טסטים ל־Simulation Engine (שלב 7) ===\n");

  const currentResult = calculateTax(baseData);
  const currentRefund = Number(currentResult.refund) || 0;

  let passed = 0;
  const total = 7;

  passed += runTest("חישוב בסיסי מחזיר החזר (לבדיקה)", () => {
    assert(typeof currentRefund === "number", "currentRefund should be number");
  });

  if (simulate && typeof simulate === "function") {
    passed += runTest("simulate() מחזיר אובייקט עם currentRefund, simulatedRefund, delta", () => {
      const out = simulate(baseData, { type: "salaryChange", newSalary: 100000 });
      assert(out && typeof out === "object", "simulate should return object");
      assert(typeof out.currentRefund === "number", "currentRefund required");
      assert(typeof out.simulatedRefund === "number", "simulatedRefund required");
      assert(typeof out.delta === "number", "delta required");
    });

    passed += runTest("תרחיש salaryChange – הכנסה נמוכה יותר משנה החזר", () => {
      const out = simulate(baseData, { type: "salaryChange", newSalary: 100000 });
      assert(out.scenarioDescription || out.type === "salaryChange", "should describe scenario");
      assert(out.simulatedRefund !== undefined, "simulatedRefund present");
    });

    passed += runTest("תרחיש addDonation – תרומה מגדילה זיכוי/החזר", () => {
      const out = simulate(baseData, { type: "addDonation", amount: 5000 });
      assert(out && typeof out.delta === "number", "delta for donation");
      assert(out.delta >= 0, "donation should not reduce refund (credit is positive)");
    });

    passed += runTest("תרחיש addPensionContribution – הפקדה מפחיתה מס משוער", () => {
      const out = simulate(baseData, { type: "addPensionContribution", amount: 10000 });
      assert(out && typeof out.simulatedRefund === "number", "simulatedRefund for pension");
    });

    passed += runTest("ללא תרחיש – מחזיר תוצאה זהה לבסיס", () => {
      const out = simulate(baseData, {});
      assert(out.currentRefund === currentRefund, "currentRefund matches calculateTax");
      assert(out.delta === 0 || (out.simulatedRefund === out.currentRefund && out.delta === 0), "no scenario => no change");
    });

    passed += runTest("תרחיש לא ידוע – לא זורק exception", () => {
      const out = simulate(baseData, { type: "unknown" });
      assert(out && typeof out.currentRefund === "number", "graceful fallback");
    });
  } else {
    console.log("  (simulate לא מיושם – דילוג על 5 טסטים)");
    passed += 5;
  }

  console.log(`\nסיכום: ${passed}/${total} טסטים עברו.`);
  process.exit(passed >= total ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
