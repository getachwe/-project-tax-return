const express = require("express");
const router = express.Router();
const { calculateTax } = require("../taxCalculator");

router.post("/calculate-tax", (req, res) => {
  try {
    const taxData = req.body || {};
    const result = calculateTax(taxData);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "failed to calculate tax" });
  }
});

module.exports = router;
