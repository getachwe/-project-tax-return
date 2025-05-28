// Calculate tax refund based on income, tax paid, and tax credits
export const calculateTaxRefund = (
  income: number,
  taxPaid: number,
  options: {
    baseCreditPoints?: number;
    isArmyService?: boolean;
    isNationalService?: boolean;
    hasAcademicDegree?: boolean;
    livesInPeriphery?: boolean;
    children?: number;
    isNewImmigrant?: boolean;
    yearsSinceAliyah?: number;
  } = {}
) => {
  // Value of each tax credit point in Israel (2024 data)
  const taxDeductionPerCreditPoint = 2352;
  
  // Calculate total credit points
  const totalCreditPoints = calculateTotalCreditPoints(options);
  
  // Total deduction from tax due to tax credits
  const totalTaxCreditDeduction = totalCreditPoints * taxDeductionPerCreditPoint;
  
  // Calculate expected tax based on income tax brackets (2024 Israeli tax brackets)
  let expectedTax = 0;
  let remainingIncome = income;
  
  // First bracket: 10% up to 83,760 NIS
  const bracket1 = Math.min(remainingIncome, 83760);
  expectedTax += bracket1 * 0.1;
  remainingIncome -= bracket1;
  
  // Second bracket: 14% from 83,761 to 120,960 NIS
  if (remainingIncome > 0) {
    const bracket2 = Math.min(remainingIncome, 120960 - 83760);
    expectedTax += bracket2 * 0.14;
    remainingIncome -= bracket2;
  }
  
  // Third bracket: 20% from 120,961 to 194,400 NIS
  if (remainingIncome > 0) {
    const bracket3 = Math.min(remainingIncome, 194400 - 120960);
    expectedTax += bracket3 * 0.2;
    remainingIncome -= bracket3;
  }
  
  // Fourth bracket: 31% from 194,401 to 268,800 NIS
  if (remainingIncome > 0) {
    const bracket4 = Math.min(remainingIncome, 268800 - 194400);
    expectedTax += bracket4 * 0.31;
    remainingIncome -= bracket4;
  }
  
  // Fifth bracket: 35% from 268,801 to 558,360 NIS
  if (remainingIncome > 0) {
    const bracket5 = Math.min(remainingIncome, 558360 - 268800);
    expectedTax += bracket5 * 0.35;
    remainingIncome -= bracket5;
  }
  
  // Sixth bracket: 47% above 558,361 NIS
  if (remainingIncome > 0) {
    expectedTax += remainingIncome * 0.47;
  }
  
  // Subtract tax credits from expected tax
  const expectedTaxAfterCredits = Math.max(0, expectedTax - totalTaxCreditDeduction);
  
  // Calculate refund: tax paid minus expected tax (if positive)
  const refundAmount = Math.max(0, taxPaid - expectedTaxAfterCredits);
  
  // Generate explanation
  let explanation = '';
  if (refundAmount > 0) {
    explanation = `תבסס על הכנסתך השנתית של ${income.toLocaleString()} ₪, `;
    explanation += `המס הצפוי הוא ${expectedTax.toLocaleString()} ₪. `;
    explanation += `לאחר הפחתת נקודות זיכוי (${totalCreditPoints.toFixed(2)} נקודות בשווי ${totalTaxCreditDeduction.toLocaleString()} ₪), `;
    explanation += `המס הצפוי הוא ${expectedTaxAfterCredits.toLocaleString()} ₪. `;
    explanation += `מכיוון ששילמת ${taxPaid.toLocaleString()} ₪, מגיע לך החזר של ${refundAmount.toLocaleString()} ₪.`;
  } else {
    explanation = `תבסס על הכנסתך השנתית של ${income.toLocaleString()} ₪, `;
    explanation += `המס הצפוי לאחר נקודות זיכוי הוא ${expectedTaxAfterCredits.toLocaleString()} ₪. `;
    explanation += `מכיוון ששילמת ${taxPaid.toLocaleString()} ₪, אין לך זכאות להחזר מס.`;
  }
  
  return {
    refundAmount,
    taxDeductionPerCreditPoint,
    expectedTax,
    totalCreditPoints,
    totalTaxCreditDeduction,
    explanation
  };
};

// Helper: Calculate credit points for military service
export function getArmyServiceCreditPoints(isArmyService: boolean): number {
  return isArmyService ? 0.25 : 0;
}

// Helper: Calculate credit points for national service
export function getNationalServiceCreditPoints(isNationalService: boolean): number {
  return isNationalService ? 0.25 : 0;
}

// Helper: Calculate credit points for academic degree
export function getAcademicDegreeCreditPoints(hasAcademicDegree: boolean): number {
  return hasAcademicDegree ? 0.25 : 0; // Updated to 0.25 points for first degree
}

// Helper: Calculate credit points for living in periphery
export function getPeripheryCreditPoints(livesInPeriphery: boolean): number {
  return livesInPeriphery ? 0.5 : 0;
}

// Helper: Calculate credit points for children under 18
export function getChildrenCreditPoints(children: number): number {
  return children * 1; // Updated to 1 point per child
}

// Helper: Calculate credit points for new immigrant
export function getNewImmigrantCreditPoints(isNewImmigrant: boolean, yearsSinceAliyah: number): number {
  // 1 year: 3 points, 2nd year: 2 points, 3rd year: 1 point
  if (!isNewImmigrant) return 0;
  if (yearsSinceAliyah === 1) return 3;
  if (yearsSinceAliyah === 2) return 2;
  if (yearsSinceAliyah === 3) return 1;
  return 0;
}

// Main: Calculate total credit points
export function calculateTotalCreditPoints({
  baseCreditPoints = 2.25,
  isArmyService = false,
  isNationalService = false,
  hasAcademicDegree = false,
  livesInPeriphery = false,
  children = 0,
  isNewImmigrant = false,
  yearsSinceAliyah = 0,
}: {
  baseCreditPoints?: number;
  isArmyService?: boolean;
  isNationalService?: boolean;
  hasAcademicDegree?: boolean;
  livesInPeriphery?: boolean;
  children?: number;
  isNewImmigrant?: boolean;
  yearsSinceAliyah?: number;
}): number {
  return (
    baseCreditPoints +
    getArmyServiceCreditPoints(isArmyService) +
    getNationalServiceCreditPoints(isNationalService) +
    getAcademicDegreeCreditPoints(hasAcademicDegree) +
    getPeripheryCreditPoints(livesInPeriphery) +
    getChildrenCreditPoints(children) +
    getNewImmigrantCreditPoints(isNewImmigrant, yearsSinceAliyah)
  );
}