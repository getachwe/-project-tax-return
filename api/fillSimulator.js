// const puppeteer = require('puppeteer');

async function fillSimulator(taxData) {
  // TODO: Use Puppeteer to fill the simulator at https://secapp.taxes.gov.il/shsimulatormas/DochSchirim24.aspx
  // and extract the result. For now, return a mock result.
  return {
    refundAmount: 4200,
    explanation: "החזר מס מחושב לפי הנתונים שהוזנו (דמו).",
    simulatorUrl:
      "https://secapp.taxes.gov.il/shsimulatormas/DochSchirim24.aspx",
  };
}

module.exports = { fillSimulator };
