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

/**
 * שווי נקודת זיכוי שנתי (₪) — לפי שנת המס. מ־2024: 2,904 ₪ כפי שבסימולטור רשות המסים.
 * שנים קודמות נשארות בערך הישן לתאימות לאחור עם טסטים ומחשבונות ישנים.
 * @param {number} taxYear שנת המס (לאחר resolve ב-calculateTax)
 * @returns {number}
 */
function getCreditPointValueForYear(taxYear) {
  const y = Number(taxYear);
  if (!Number.isFinite(y) || y < 2024) return 2352;
  return 2904;
}

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

/** ניכויי מס נוספים (שדות 040/043 בטופס 106) — אופציונלי; רק וידוא תקין */
function validateOptionalWithholding(data, key) {
  const v = data[key];
  if (v === undefined || v === null || v === "") return;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`${key} must be a non-negative number`);
  }
}

const MAX_COMBINED_INCOME = MAX_INCOME * 2;

/** גילוי יחיד / משותף — ברירת מחדל single (תאימות לאחור) */
function normalizeFilingStatus(data) {
  const raw = data.filingStatus;
  if (raw === undefined || raw === null || raw === "") return "single";
  const s = String(raw).trim().toLowerCase();
  return s === "joint" ? "joint" : "single";
}

function spouseIncomeForJoint(data, filingStatus) {
  if (filingStatus !== "joint") return 0;
  const v = data.spouseIncome;
  if (v === undefined || v === null || v === "") return 0;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > MAX_INCOME) {
    throw new Error(`Spouse income must be between 0 and ${MAX_INCOME}`);
  }
  return n;
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

/** תוספת נקודות (STEP F) — אופציונלי; 0 משמעו ללא שינוי לעומת גרסה קודמת */
const MAX_ADDITIONAL_CREDIT_POINTS = 5;

function validateOptionalAdditionalCreditPoints(data) {
  const v = data.additionalCreditPoints;
  if (v === undefined || v === null || v === "") return 0;
  const n = Number(v);
  if (
    !Number.isFinite(n) ||
    n < 0 ||
    n > MAX_ADDITIONAL_CREDIT_POINTS
  ) {
    throw new Error(
      `additionalCreditPoints must be between 0 and ${MAX_ADDITIONAL_CREDIT_POINTS}`
    );
  }
  return n;
}

/**
 * נקודות זיכוי סטנדרטיות + פירוט (ילדים, מגדר, עולה, וכו') — בלי additionalCreditPoints.
 * @returns {{ standardPoints: number, breakdown: Record<string, number> }}
 */
function calcCreditPointsWithBreakdown(data) {
  const breakdown = {
    baseResident: 2.25,
    female: 0,
    childrenUnder18: 0,
    childrenUnder6Extra: 0,
    academicDegree: 0,
    newImmigrant: 0,
    periphery: 0,
    nationalService: 0,
  };
  let points = breakdown.baseResident;

  if (data.gender === "female") {
    breakdown.female = 0.5;
    points += 0.5;
  }

  if (data.children > 0) {
    breakdown.childrenUnder18 = data.children * 1;
    points += breakdown.childrenUnder18;
  }

  if (data.childrenUnder6 && data.childrenUnder6 > 0) {
    breakdown.childrenUnder6Extra = data.childrenUnder6 * 2;
    points += breakdown.childrenUnder6Extra;
  }

  if (data.academicDegree) {
    breakdown.academicDegree = 0.25;
    points += 0.25;
  }

  if (data.newImmigrant || data.isNewImmigrant) {
    const years = Number(data.yearsSinceAliyah) || 0;
    if (years === 1) breakdown.newImmigrant = 3;
    else if (years === 2) breakdown.newImmigrant = 2;
    else if (years === 3) breakdown.newImmigrant = 1;
    points += breakdown.newImmigrant;
  }

  if (data.livingInPeriphery || data.livesInPeriphery) {
    breakdown.periphery = 0.5;
    points += 0.5;
  }

  if (data.isNationalService) {
    breakdown.nationalService = 0.25;
    points += 0.25;
  }

  return { standardPoints: points, breakdown };
}

function calcCreditPoints(data) {
  return calcCreditPointsWithBreakdown(data).standardPoints;
}

// Main tax calculation function
function calculateTax(data) {
  try {
    // Validate and normalize input
    const validatedData = validateInput(data);
    // Determine tax year from input; default to previous calendar year
    const submittedYear = Number(data.taxYear);
    const currentYear = new Date().getFullYear();
    const taxYear =
      !isNaN(submittedYear) && submittedYear > 1900
        ? submittedYear
        : currentYear - 1;

    const filingStatus = normalizeFilingStatus(data);
    const spouseIncome = spouseIncomeForJoint(data, filingStatus);
    const combinedIncome = validatedData.income + spouseIncome;
    if (combinedIncome > MAX_COMBINED_INCOME) {
      throw new Error(
        `Combined income must not exceed ${MAX_COMBINED_INCOME.toLocaleString()}`
      );
    }

    /** הכנסה לחישוב מדרגות — משותף: סכום בני הזוג (מודל פשוט; לא ייעוץ מס) */
    const incomeForBrackets = combinedIncome;

    // פטור לנכה - אם אחוז נכות 40% ומעלה, פטור ממס עד תקרה (נכון לשנים האחרונות ~614,400 ש"ח)
    let grossTax = 0;
    let disabilityExemption = 0;
    const disabilityPercent = Number(data.disabilityPercent) || 0;
    const disabilityExemptionCap = 614400;
    if (disabilityPercent >= 40) {
      const exemptIncome = Math.min(
        incomeForBrackets,
        disabilityExemptionCap
      );
      disabilityExemption = calcIncomeTax(exemptIncome);
      grossTax = calcIncomeTax(incomeForBrackets - exemptIncome);
    } else {
      grossTax = calcIncomeTax(incomeForBrackets);
    }

    // חישוב פטור לחייל/ת משוחרר/ת
    let armyExemption = 0;
    if (data.isArmyService) {
      const exemptionCap = 186000;
      const exemptIncome = Math.min(incomeForBrackets, exemptionCap);
      armyExemption = calcIncomeTax(exemptIncome);
      grossTax = calcIncomeTax(incomeForBrackets - exemptIncome);
    }

    // ודא שאין חפיפה בין ילדים מתחת ל-6 לסך הילדים
    let children = Number(data.children) || 0;
    let childrenUnder6 = Number(data.childrenUnder6) || 0;
    if (childrenUnder6 > children) {
      childrenUnder6 = children;
    }

    const creditPayload = {
      ...validatedData,
      ...data,
      children,
      childrenUnder6,
    };
    const { standardPoints, breakdown: creditPointsBreakdown } =
      calcCreditPointsWithBreakdown(creditPayload);
    validateOptionalWithholding(data, "taxWithheld040");
    validateOptionalWithholding(data, "taxWithheld043");
    validateOptionalWithholding(data, "spouseTaxPaid");
    const additionalCreditPoints = validateOptionalAdditionalCreditPoints(data);
    const creditPoints = standardPoints + additionalCreditPoints;

    const taxPaid042 = validatedData.taxPaid;
    const w040 = Math.max(0, Number(data.taxWithheld040) || 0);
    const w043 = Math.max(0, Number(data.taxWithheld043) || 0);
    const taxPaidEffective = taxPaid042 + w040 + w043;

    const spouseTaxPaid =
      filingStatus === "joint" ? Math.max(0, Number(data.spouseTaxPaid) || 0) : 0;
    const householdTaxPaidEffective = taxPaidEffective + spouseTaxPaid;

    const creditPointNis = getCreditPointValueForYear(taxYear);
    const creditValue = creditPoints * creditPointNis;
    const netTax = Math.max(0, grossTax - creditValue);
    const refund = householdTaxPaidEffective - netTax;

    // Prepare detailed explanation
    const explanation = [
      `חישוב מס הכנסה לשנת ${taxYear}:`,
      filingStatus === "joint"
        ? `מצב הגשה: גילוי משותף (הכנסות משולבות למדרגות)`
        : `מצב הגשה: יחיד/נפרד`,
      filingStatus === "joint"
        ? `הכנסת מגיש/ה ראשי/ת: ${validatedData.income.toLocaleString()} ₪; הכנסת בן/בת זוג: ${spouseIncome.toLocaleString()} ₪; סה״כ לחישוב מס: ${combinedIncome.toLocaleString()} ₪`
        : `הכנסה שנתית: ${validatedData.income.toLocaleString()} ₪`,
      `מס גולמי: ${grossTax.toLocaleString()} ₪`,
      `נקודות זיכוי (סטנדרט): ${standardPoints.toFixed(2)}`,
      additionalCreditPoints > 0
        ? `נקודות זיכוי נוספות (הזנה ידנית / ייעוץ): ${additionalCreditPoints.toFixed(2)}`
        : undefined,
      `סה״כ נקודות זיכוי לחישוב: ${creditPoints.toFixed(2)}`,
      `ערך נקודת זיכוי לשנת ${taxYear}: ${creditPointNis.toLocaleString()} ₪`,
      `ערך נקודות זיכוי (סה״כ): ${creditValue.toLocaleString()} ₪`,
      `מס נטו: ${netTax.toLocaleString()} ₪`,
      `מס שנוכה (שדה 042): ${taxPaid042.toLocaleString()} ₪`,
      w040 > 0 ? `ניכוי מס נוסף (שדה 040): ${w040.toLocaleString()} ₪` : undefined,
      w043 > 0 ? `ניכוי מס נוסף (שדה 043): ${w043.toLocaleString()} ₪` : undefined,
      `סה״כ ניכוי מס (מגיש/ה ראשי/ת): ${taxPaidEffective.toLocaleString()} ₪`,
      spouseTaxPaid > 0
        ? `מס שנוכה בן/בת זוג: ${spouseTaxPaid.toLocaleString()} ₪`
        : undefined,
      `סה״כ ניכוי מס משקי לחישוב החזר/חוב: ${householdTaxPaidEffective.toLocaleString()} ₪`,
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
      filingStatus,
      spouseIncome,
      combinedIncome,
      grossTax,
      standardCreditPoints: standardPoints,
      additionalCreditPoints,
      creditPointsBreakdown,
      creditPoints,
      creditValue,
      netTax,
      taxPaid: taxPaid042,
      taxWithheld040: w040,
      taxWithheld043: w043,
      taxPaidEffective,
      spouseTaxPaid,
      householdTaxPaidEffective,
      refund,
      explanation,
      gender: validatedData.gender,
      children: validatedData.children,
      childrenUnder6: data.childrenUnder6,
      isArmyService: data.isArmyService,
      isNationalService: data.isNationalService,
      yearsSinceAliyah: data.yearsSinceAliyah,
      taxYear,
      calculationDetails: {
        income: validatedData.income,
        filingStatus,
        spouseIncome,
        combinedIncome,
        grossTax,
        standardCreditPoints: standardPoints,
        additionalCreditPoints,
        creditPointsBreakdown,
        creditPoints,
        creditValue,
        netTax,
        taxPaid: taxPaid042,
        taxWithheld040: w040,
        taxWithheld043: w043,
        taxPaidEffective,
        spouseTaxPaid,
        householdTaxPaidEffective,
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

module.exports = {
  calculateTax,
  calcCreditPoints,
  calcCreditPointsWithBreakdown,
  PDF_STYLES,
  getCreditPointValueForYear,
};
