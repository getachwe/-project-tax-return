// backend/taxCalculator.js

const path = require("path");

// Yearly tax configuration (simplified; values can be refined per year)
const YEAR_CONFIG = {
  2019: {
    brackets: [
      { upTo: 75720, rate: 0.1 },
      { upTo: 108600, rate: 0.14 },
      { upTo: 174960, rate: 0.2 },
      { upTo: 243120, rate: 0.31 },
      { upTo: 505920, rate: 0.35 },
      { upTo: Infinity, rate: 0.47 },
    ],
    creditPointValue: 2184,
  },
  2020: {
    brackets: [
      { upTo: 75720, rate: 0.1 },
      { upTo: 108600, rate: 0.14 },
      { upTo: 174960, rate: 0.2 },
      { upTo: 243120, rate: 0.31 },
      { upTo: 505920, rate: 0.35 },
      { upTo: Infinity, rate: 0.47 },
    ],
    creditPointValue: 2184,
  },
  2021: {
    brackets: [
      { upTo: 77040, rate: 0.1 },
      { upTo: 110880, rate: 0.14 },
      { upTo: 178080, rate: 0.2 },
      { upTo: 247440, rate: 0.31 },
      { upTo: 512880, rate: 0.35 },
      { upTo: Infinity, rate: 0.47 },
    ],
    creditPointValue: 2232,
  },
  2022: {
    brackets: [
      { upTo: 79200, rate: 0.1 },
      { upTo: 113040, rate: 0.14 },
      { upTo: 180240, rate: 0.2 },
      { upTo: 250080, rate: 0.31 },
      { upTo: 518400, rate: 0.35 },
      { upTo: Infinity, rate: 0.47 },
    ],
    creditPointValue: 2256,
  },
  2023: {
    brackets: [
      { upTo: 81600, rate: 0.1 },
      { upTo: 116400, rate: 0.14 },
      { upTo: 184320, rate: 0.2 },
      { upTo: 255840, rate: 0.31 },
      { upTo: 531840, rate: 0.35 },
      { upTo: Infinity, rate: 0.47 },
    ],
    creditPointValue: 2352,
  },
  2024: {
    brackets: [
      { upTo: 83760, rate: 0.1 },
      { upTo: 120960, rate: 0.14 },
      { upTo: 194400, rate: 0.2 },
      { upTo: 268800, rate: 0.31 },
      { upTo: 558360, rate: 0.35 },
      { upTo: Infinity, rate: 0.47 },
    ],
    creditPointValue: 2352,
  },
};

function getConfigForYear(year) {
  const y = Number(year);
  if (YEAR_CONFIG[y]) return YEAR_CONFIG[y];
  // fallback: nearest lower year, else latest
  const years = Object.keys(YEAR_CONFIG)
    .map(Number)
    .sort((a, b) => a - b);
  const lower = years.filter((n) => n <= y).pop();
  return YEAR_CONFIG[lower || years[years.length - 1]];
}

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

// default credit point value will be taken from yearly config
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

  // Determine tax year (last 6 completed years)
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 6;
  const maxYear = currentYear - 1;
  let taxYear = Number(data.taxYear) || maxYear;
  if (taxYear < minYear) taxYear = minYear;
  if (taxYear > maxYear) taxYear = maxYear;

  return {
    income,
    taxPaid,
    gender,
    children,
    taxYear,
  };
}

// Calculate tax by brackets
function calcIncomeTax(income, brackets) {
  let tax = 0;
  let prev = 0;
  for (const bracket of brackets) {
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

  // Children under 18
  if (data.children > 0) {
    points += data.children * 1;
  }

  // Children under 6 (2 extra points per child under 6)
  if (data.childrenUnder6 && data.childrenUnder6 > 0) {
    points += data.childrenUnder6 * 2;
  }

  // Academic degree points
  if (data.academicDegree) {
    points += 0.25;
  }

  // New immigrant points
  if (data.newImmigrant || data.isNewImmigrant) {
    const years = Number(data.yearsSinceAliyah) || 0;
    if (years === 1) points += 3;
    else if (years === 2) points += 2;
    else if (years === 3) points += 1;
  }

  // Periphery points
  if (data.livingInPeriphery || data.livesInPeriphery) {
    points += 0.5;
  }

  // National service points
  if (data.isNationalService) points += 0.25;

  return points;
}

// Main tax calculation function
function calculateTax(data) {
  try {
    // Validate and normalize input
    const validatedData = validateInput(data);
    const cfg = getConfigForYear(validatedData.taxYear);

    // פטור לנכה - אם אחוז נכות 40% ומעלה, פטור ממס עד תקרה (2024: 614,400 ש"ח)
    let grossTax = 0;
    let disabilityExemption = 0;
    const disabilityPercent = Number(data.disabilityPercent) || 0;
    const disabilityExemptionCap = 614400;
    if (disabilityPercent >= 40) {
      // פטור מלא עד תקרה
      const exemptIncome = Math.min(
        validatedData.income,
        disabilityExemptionCap
      );
      disabilityExemption = calcIncomeTax(exemptIncome, cfg.brackets);
      grossTax = calcIncomeTax(
        validatedData.income - exemptIncome,
        cfg.brackets
      );
    } else {
      // חישוב רגיל
      grossTax = calcIncomeTax(validatedData.income, cfg.brackets);
    }

    // חישוב פטור לחייל/ת משוחרר/ת
    let armyExemption = 0;
    if (data.isArmyService) {
      // פטור ממס ל-36 חודשים ראשונים עד תקרה של 186,000 ש"ח (נכון ל-2024)
      const exemptionCap = 186000;
      const exemptIncome = Math.min(validatedData.income, exemptionCap);
      armyExemption = calcIncomeTax(exemptIncome, cfg.brackets);
      grossTax = calcIncomeTax(
        validatedData.income - exemptIncome,
        cfg.brackets
      );
    }

    // ודא שאין חפיפה בין ילדים מתחת ל-6 לסך הילדים
    let children = Number(data.children) || 0;
    let childrenUnder6 = Number(data.childrenUnder6) || 0;
    if (childrenUnder6 > children) {
      childrenUnder6 = children;
    }

    const creditPoints = calcCreditPoints({
      ...validatedData,
      ...data,
      children,
      childrenUnder6,
    });
    const creditValue = creditPoints * cfg.creditPointValue;
    const netTax = Math.max(0, grossTax - creditValue);
    const refund = validatedData.taxPaid - netTax;

    // Consistency checks -> warnings
    const warnings = [];
    if (
      validatedData.income > 0 &&
      validatedData.taxPaid > validatedData.income * 0.6
    ) {
      warnings.push("סכום המס ששולם גבוה מהרגיל ביחס להכנסה. נא לוודא ערכים.");
    }
    if (
      data.birthYear &&
      String(data.birthYear) === String(validatedData.taxYear)
    ) {
      warnings.push("שנת לידה זהה לשנת המס – ייתכן זיהוי שגוי של שדה.");
    }
    if (childrenUnder6 > children) {
      warnings.push(
        "מספר ילדים מתחת ל-6 גדול ממספר הילדים הכולל – תוקן אוטומטית."
      );
    }

    // Prepare detailed explanation
    const explanation = [
      `חישוב מס הכנסה לשנת ${validatedData.taxYear}:`,
      `הכנסה שנתית: ${validatedData.income.toLocaleString()} ₪`,
      `מס גולמי: ${grossTax.toLocaleString()} ₪`,
      `נקודות זיכוי: ${creditPoints.toFixed(2)}`,
      `ערך נקודות זיכוי: ${creditValue.toLocaleString()} ₪ (שווי נק' לשנה: ${cfg.creditPointValue.toLocaleString()} ₪)`,
      `מס נטו: ${netTax.toLocaleString()} ₪`,
      `מס ששולם: ${validatedData.taxPaid.toLocaleString()} ₪`,
      refund >= 0
        ? `החזר מס: ${refund.toLocaleString()} ₪`
        : `חוב מס: ${Math.abs(refund).toLocaleString()} ₪`,
      disabilityPercent >= 40 ? `פטור נכות: עד תקרה של 614,400 ש"ח` : undefined,
      data.isArmyService
        ? `החייל/ת משוחרר/ת: פטור ממס עד תקרה של 186,000 ש"ח (הפטור חושב)`
        : undefined,
      childrenUnder6 && childrenUnder6 > 0
        ? `מתוך ${children} ילדים, ${childrenUnder6} מתחת לגיל 6 (2 נקודות לכל ילד)`
        : undefined,
      data.gender === "female" ? "מגדר: נקבה (0.5 נקודות זיכוי)" : undefined,
      data.isNationalService ? "שירות לאומי: 0.25 נקודות זיכוי" : undefined,
      (data.newImmigrant || data.isNewImmigrant) && data.yearsSinceAliyah
        ? `עולה חדש/ה: ${data.yearsSinceAliyah} שנים בארץ (נקודות זיכוי בהתאם)`
        : undefined,
    ]
      .filter(Boolean)
      .join("\n");

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
      childrenUnder6: data.childrenUnder6,
      isArmyService: data.isArmyService,
      isNationalService: data.isNationalService,
      yearsSinceAliyah: data.yearsSinceAliyah,
      taxYear: String(validatedData.taxYear),
      warnings,
      calculationDetails: {
        income: validatedData.income,
        grossTax,
        creditPoints,
        creditValue,
        netTax,
        taxPaid: validatedData.taxPaid,
        refund,
        childrenUnder6: data.childrenUnder6,
        isArmyService: data.isArmyService,
        isNationalService: data.isNationalService,
        yearsSinceAliyah: data.yearsSinceAliyah,
      },
    };
  } catch (error) {
    throw new Error(`Tax calculation failed: ${error.message}`);
  }
}

module.exports = { calculateTax, PDF_STYLES };
