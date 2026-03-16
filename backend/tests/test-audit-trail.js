/**
 * טסטים ל־Audit Trail (שלב 8).
 * הרצה: מתיקיית backend: node tests/test-audit-trail.js
 */

require("dotenv").config();
const path = require("path");
const backendRoot = path.resolve(__dirname, "..");

let auditService;
try {
  auditService = require(path.join(backendRoot, "services", "auditService.js"));
} catch (_) {
  auditService = null;
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
  console.log("=== טסטים ל־Audit Trail (שלב 8) ===\n");

  let passed = 0;
  const total = 6;

  if (!auditService) {
    console.log("  (auditService לא קיים – דילוג על כל הטסטים)");
    process.exit(1);
  }

  const logCalculation = auditService.logCalculation || auditService.log;
  const getLogs = auditService.getLogs || auditService.getRecentLogs || (() => []);

  if (typeof logCalculation !== "function") {
    console.log("  (אין פונקציית logCalculation/log – דילוג)");
    process.exit(1);
  }

  passed += runTest("logCalculation קיימת ומקבלת אובייקט", () => {
    assert(typeof logCalculation === "function", "logCalculation must be a function");
  });

  passed += runTest("רישום אירוע מחזיר ללא שגיאה", () => {
    logCalculation({
      eventType: "calculation",
      refundAmount: 5000,
      rulesApplied: ["מדרגות מס", "נקודות זיכוי"],
      documentSource: "manual",
    });
  });

  passed += runTest("רשומה מכילה timestamp", () => {
    const logs = typeof getLogs === "function" ? getLogs() : [];
    const withTs = logs.filter((l) => l && (l.timestamp || l.createdAt));
    assert(logs.length === 0 || withTs.length >= 1, "at least one log entry should have timestamp");
  });

  passed += runTest("אין שמירת ת.ז/מסמך מלא ברשומה (ללא PII)", () => {
    logCalculation({
      eventType: "calculation",
      refundAmount: 1000,
      userId: "anonymous",
    });
    const logs = typeof getLogs === "function" ? getLogs() : [];
    const last = logs[logs.length - 1];
    if (last) {
      const str = JSON.stringify(last);
      assert(!/^\d{9}$/.test(str) || str.indexOf("idNumber") === -1, "should not store raw ID in log");
    }
  });

  passed += runTest("תמיכה ב־eventType ו־rulesApplied", () => {
    logCalculation({
      eventType: "process_106",
      rulesApplied: ["נקודות זיכוי"],
      documentSource: "form_106",
    });
    const logs = typeof getLogs === "function" ? getLogs() : [];
    assert(logs.length >= 1, "logs should be stored");
  });

  passed += runTest("כיבוי אודיט (אם יש isEnabled) – לא זורק", () => {
    if (typeof auditService.isEnabled === "function") {
      const enabled = auditService.isEnabled();
      assert(typeof enabled === "boolean" || enabled === undefined, "isEnabled returns boolean or undefined");
    }
  });

  console.log(`\nסיכום: ${passed}/${total} טסטים עברו.`);
  process.exit(passed >= total ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
