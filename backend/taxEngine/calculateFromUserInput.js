/**
 * נורמליזציה ואז calculateTax — אותו ציר כמו /api/calculate-tax ו-process106 (כשמחשבים מקלט משתמש).
 */

const { normalizeToEnginePayload } = require("./normalizeToEnginePayload");
const { calculateTax } = require("../taxCalculator");

/**
 * @param {Record<string, unknown>} raw
 * @returns {object}
 */
function calculateFromUserInput(raw) {
  return calculateTax(normalizeToEnginePayload(raw));
}

module.exports = { calculateFromUserInput };
