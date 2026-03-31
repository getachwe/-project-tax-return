/**
 * Simulation Engine – סימולציית תרחישים (שינוי שכר, תרומה, הפקדה לפנסיה).
 * לא משנה את taxCalculator – קורא ל-calculateTax עם נתונים מעודכנים או מחשב זיכוי נפרד.
 */

const { calculateFromUserInput } = require("../taxEngine/calculateFromUserInput");

/** זיכוי מס על תרומות לארגונים מוכרים (בערך 35% בישראל) */
const DONATION_CREDIT_RATE = 0.35;

/**
 * מריץ סימולציה לפי תרחיש.
 * @param {Record<string, unknown>} baseData - נתוני מס נוכחיים (income, taxPaid, taxYear, children, gender...)
 * @param {{ type: string, newSalary?: number, amount?: number }} scenario - תרחיש: salaryChange | addDonation | addPensionContribution
 * @returns {{ currentRefund: number, simulatedRefund: number, delta: number, scenarioDescription: string, type: string }}
 */
function simulate(baseData, scenario = {}) {
  const data = baseData || {};
  const type = (scenario && scenario.type) || "";
  let currentRefund = 0;
  let simulatedRefund = 0;
  let scenarioDescription = "";

  try {
    const currentResult = calculateFromUserInput(data);
    currentRefund = Number(currentResult.refund) || 0;
  } catch (_) {
    return {
      currentRefund: 0,
      simulatedRefund: 0,
      delta: 0,
      scenarioDescription: "שגיאה בחישוב הבסיס",
      type: type || "unknown",
    };
  }

  switch (type) {
    case "salaryChange": {
      const newSalary = Number(scenario.newSalary);
      if (isNaN(newSalary) || newSalary < 0) {
        simulatedRefund = currentRefund;
        scenarioDescription = "שינוי שכר – ערך לא תקין";
        break;
      }
      const simulatedResult = calculateTax({ ...data, income: newSalary });
      simulatedRefund = Number(simulatedResult.refund) || 0;
      scenarioDescription = `אם ההכנסה הייתה ${newSalary.toLocaleString()} ₪ (במקום ${Number(data.income || 0).toLocaleString()} ₪)`;
      break;
    }

    case "addDonation": {
      const amount = Number(scenario.amount) || 0;
      const credit = amount * DONATION_CREDIT_RATE;
      simulatedRefund = currentRefund + credit;
      scenarioDescription = `תרומה של ${amount.toLocaleString()} ₪ לארגון מוכר (זיכוי כ־35%)`;
      break;
    }

    case "addPensionContribution": {
      const amount = Number(scenario.amount) || 0;
      const income = Number(data.income) || 0;
      if (amount <= 0 || amount > income) {
        simulatedRefund = currentRefund;
        scenarioDescription = "הפקדה לפנסיה – ערך לא תקין";
        break;
      }
      const simulatedIncome = income - amount;
      const simulatedResult = calculateFromUserInput({
        ...data,
        income: simulatedIncome,
      });
      simulatedRefund = Number(simulatedResult.refund) || 0;
      scenarioDescription = `הפקדה של ${amount.toLocaleString()} ₪ לקופת גמל/פנסיה (הכנסה לחיוב מופחתת)`;
      break;
    }

    default:
      simulatedRefund = currentRefund;
      scenarioDescription = type ? `תרחיש לא נתמך: ${type}` : "ללא תרחיש";
  }

  const delta = simulatedRefund - currentRefund;

  return {
    currentRefund,
    simulatedRefund,
    delta,
    scenarioDescription,
    type: type || "none",
  };
}

module.exports = { simulate };
