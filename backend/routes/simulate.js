const express = require("express");
const router = express.Router();
const { simulate } = require("../services/simulationEngine");

/**
 * POST /api/simulate-tax
 * Body: { ...baseTaxData, scenario: { type: 'salaryChange'|'addDonation'|'addPensionContribution', newSalary?, amount? } }
 */
router.post("/simulate-tax", (req, res) => {
  try {
    const body = req.body || {};
    const { scenario, ...baseData } = body;
    const result = simulate(baseData, scenario || {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || "Simulation failed" });
  }
});

module.exports = router;
