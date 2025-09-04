const TAX_CODES = {
  // הכנסות
  150: "income",
  158: "income",
  170: "income",
  172: "income",
  200: "additionalIncome",
  "045": "additionalIncome",

  // מס שנוכה / ניכויי מס
  244: "taxPaid",
  245: "taxPaid",
  "042": "taxPaid",

  // נקודות/זיכויי מס נומינליים
  248: "taxCredits",
  249: "taxCredits",
  218: "taxCredits",

  // קופות גמל ופנסיה (הפרשות עובד/מעביד/מבוטח)
  127: "pensionContribution",
  128: "pensionContribution",
  129: "pensionContribution",
  086: "pensionContribution",
  201: "pension201",
  230: "pension230",
  2560: "pension2560",
  31446: "pension31446",
  59523: "pension59523",
  11926: "pension11926",

  // קופת השתלמות
  130: "studyFund",
  131: "studyFund",
  132: "studyFund",

  // ניכויים שונים
  991: "deductions991",
  182: "deductions182",
  505: "deductions505",
  184: "deductions184",
  176: "deductions176",

  // תשלומים/הכנסות נוספים
  300: "severancePay",
  301: "severancePayTax",
  302: "compensation",
  303: "compensationTax",
  304: "bonus",
  305: "bonusTax",
  306: "overtime",
  307: "overtimeTax",
  308: "allowances",
  309: "allowancesTax",
  310: "benefits",
  311: "benefitsTax",
  312: "reimbursements",
  313: "reimbursementsTax",
  314: "otherIncome",
  315: "otherIncomeTax",

  // זיהוי אישי
  215: "employeeId",
  216: "employeeId",
  217: "employeeId",
};

module.exports = { TAX_CODES };
