/**
 * ExplanationAgent – מערכת הסבר לתוצאות החזר המס.
 * אחריות יחידה: להסביר למשתמש למה יש החזר/חוב, אילו כללים הופעלו, ואיזה מסמכים השפיעו.
 * לא משנה את taxCalculator – משתמש ב-explanation הקיים ומוסיף שדות מובנים.
 */

/**
 * בונה הסבר מובנה מתוך תוצאת החישוב ונתוני הקלט.
 * @param {Record<string, unknown>} inputData - נתונים שהמשתמש הזין (כולל hasFormData אם יש)
 * @param {Record<string, unknown>} taxResult - תוצאה מ-calculateTax (explanation, refund, וכו')
 * @returns {{ fullExplanation: string, whyRefund: string, rulesApplied: string[], documentSource: string }}
 */
function explain(inputData, taxResult) {
  const data = inputData || {};
  const result = taxResult || {};
  const refund = Number(result.refund) || 0;
  const fullExplanation = result.explanation ? String(result.explanation) : "";

  const rulesApplied = [];
  if (result.calculationDetails) {
    if (result.calculationDetails.creditPoints > 2.25) rulesApplied.push("נקודות זיכוי (מגדר, ילדים)");
    if (result.calculationDetails.childrenUnder6 > 0) rulesApplied.push("זיכוי ילדים מתחת לגיל 6");
    if (data.isArmyService) rulesApplied.push("פטור לחייל/ת משוחרר/ת");
    if (Number(data.disabilityPercent) >= 40) rulesApplied.push("פטור נכות");
    if (data.isNationalService) rulesApplied.push("נקודות זיכוי שירות לאומי");
    if (data.newImmigrant || data.isNewImmigrant) rulesApplied.push("נקודות זיכוי עולה חדש/ה");
    if (data.livingInPeriphery || data.livesInPeriphery) rulesApplied.push("נקודות זיכוי פריפריה");
  }
  rulesApplied.push("מדרגות מס הכנסה");
  if (rulesApplied.length === 1) rulesApplied.unshift("נקודות זיכוי בסיס");

  let whyRefund = "";
  if (refund > 0) {
    whyRefund = `שילמת מס בשיעור גבוה יותר מהמס שחושב לפי ההכנסה והנקודות שלך, ולכן מגיע לך החזר של ${Math.round(refund).toLocaleString()} ₪.`;
  } else if (refund < 0) {
    whyRefund = `המס שחושב לפי ההכנסה והנקודות גבוה מהמס ששולם, ולכן יש חוב מס של ${Math.round(Math.abs(refund)).toLocaleString()} ₪.`;
  } else {
    whyRefund = "המס ששולם תואם למס שחושב – אין החזר ואין חוב.";
  }

  const documentSource = data.hasFormData ? "טופס 106 (חילוץ אוטומטי)" : "הזנה ידנית";

  return {
    fullExplanation,
    whyRefund,
    rulesApplied,
    documentSource,
  };
}

module.exports = { explain };
