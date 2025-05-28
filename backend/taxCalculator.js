// backend/taxCalculator.js

const path = require("path");

// Constants
const TAX_BRACKETS = [
  { upTo: 83760, rate: 0.1 },
  { upTo: 120960, rate: 0.14 },
  { upTo: 194400, rate: 0.2 },
  { upTo: 268800, rate: 0.31 },
  { upTo: 558360, rate: 0.35 },
  { upTo: Infinity, rate: 0.47 },
];

// PDF Styling Constants
const PDF_STYLES = {
  colors: {
    primary: "#2C3E50", // כחול כהה
    secondary: "#34495E", // כחול אפור
    accent: "#3498DB", // כחול בהיר
    success: "#27AE60", // ירוק
    warning: "#F1C40F", // צהוב
    danger: "#E74C3C", // אדום
    light: "#ECF0F1", // אפור בהיר
    dark: "#2C3E50", // כהה
    text: "#2C3E50", // צבע טקסט
    background: "#FFFFFF", // רקע לבן
  },
  fonts: {
    regular: path.join(__dirname, "fonts", "Alef-Regular.ttf"),
  },
  spacing: {
    small: 5,
    medium: 10,
    large: 20,
  },
  borders: {
    thin: 0.5,
    medium: 1,
    thick: 2,
  },
};

const CREDIT_POINT_VALUE = 2352; // Annual value per credit point (2024)
const MIN_INCOME = 0;
const MAX_INCOME = 10000000; // Reasonable upper limit
const MIN_CHILDREN = 0;
const MAX_CHILDREN = 20;

// Input validation
function validateInput(data) {
  if (!data) {
    throw new Error("Input data is required");
  }

  // Validate income
  const income = Number(data.income);
  if (isNaN(income) || income < MIN_INCOME || income > MAX_INCOME) {
    throw new Error(`Income must be between ${MIN_INCOME} and ${MAX_INCOME}`);
  }

  // Validate tax paid
  const taxPaid = Number(data.taxPaid);
  if (isNaN(taxPaid) || taxPaid < 0) {
    throw new Error("Tax paid must be a non-negative number");
  }

  // Validate gender
  let gender = (data.gender || "male").toLowerCase();
  if (!["male", "female"].includes(gender)) {
    throw new Error('Gender must be either "male" or "female"');
  }

  // Validate children
  let children = 0;
  if (
    data.children !== undefined &&
    data.children !== null &&
    data.children !== ""
  ) {
    children = Number(data.children);
    if (isNaN(children) || children < MIN_CHILDREN || children > MAX_CHILDREN) {
      throw new Error(
        `Number of children must be between ${MIN_CHILDREN} and ${MAX_CHILDREN}`
      );
    }
  }

  return {
    income,
    taxPaid,
    gender,
    children,
  };
}

// Calculate tax by brackets
function calcIncomeTax(income) {
  let tax = 0;
  let prev = 0;
  for (const bracket of TAX_BRACKETS) {
    if (income > prev) {
      const taxableInThisBracket = Math.min(income - prev, bracket.upTo - prev);
      tax += taxableInThisBracket * bracket.rate;
      prev = bracket.upTo;
    } else {
      break;
    }
  }
  return Math.round(tax);
}

// Calculate credit points
function calcCreditPoints(data) {
  let points = 2.25; // Base points for every resident

  // Gender points
  if (data.gender === "female") {
    points += 0.5;
  }

  // Children points (1 point per child)
  if (data.children > 0) {
    points += data.children * 1;
  }

  // Academic degree points
  if (data.academicDegree) {
    points += 0.25;
  }

  // New immigrant points
  if (data.isNewImmigrant) {
    if (data.yearsSinceAliyah === 1) points += 3;
    else if (data.yearsSinceAliyah === 2) points += 2;
    else if (data.yearsSinceAliyah === 3) points += 1;
  }

  // Periphery points
  if (data.livesInPeriphery) {
    points += 0.5;
  }

  // Military/National service points
  if (data.isArmyService) points += 0.25;
  if (data.isNationalService) points += 0.25;

  return points;
}

// Main tax calculation function
function calculateTax(data) {
  try {
    // Validate and normalize input
    const validatedData = validateInput(data);

    // Calculate components
    const grossTax = calcIncomeTax(validatedData.income);
    const creditPoints = calcCreditPoints(validatedData);
    const creditValue = creditPoints * CREDIT_POINT_VALUE;
    const netTax = Math.max(0, grossTax - creditValue);
    const refund = validatedData.taxPaid - netTax;

    // Prepare detailed explanation
    const explanation = [
      "חישוב מס הכנסה לשנת 2024:",
      `הכנסה שנתית: ${validatedData.income.toLocaleString()} ₪`,
      `מס גולמי: ${grossTax.toLocaleString()} ₪`,
      `נקודות זיכוי: ${creditPoints.toFixed(2)}`,
      `ערך נקודות זיכוי: ${creditValue.toLocaleString()} ₪`,
      `מס נטו: ${netTax.toLocaleString()} ₪`,
      `מס ששולם: ${validatedData.taxPaid.toLocaleString()} ₪`,
      refund >= 0
        ? `החזר מס: ${refund.toLocaleString()} ₪`
        : `חוב מס: ${Math.abs(refund).toLocaleString()} ₪`,
    ].join("\n");

    // Return complete breakdown with all necessary data
    return {
      income: validatedData.income,
      grossTax,
      creditPoints,
      creditValue,
      netTax,
      taxPaid: validatedData.taxPaid,
      refund,
      explanation,
      gender: validatedData.gender,
      children: validatedData.children,
      taxYear: "2024",
      calculationDetails: {
        income: validatedData.income,
        grossTax,
        creditPoints,
        creditValue,
        netTax,
        taxPaid: validatedData.taxPaid,
        refund,
      },
    };
  } catch (error) {
    throw new Error(`Tax calculation failed: ${error.message}`);
  }
}

module.exports = { calculateTax, PDF_STYLES };
