/**
 * RecommendationAgent – המלצות למשתמש לשיפור זכאות להחזר.
 * אחריות יחידה: identify possible tax credits, explain refund eligibility, suggest improvements.
 */

/**
 * מייצר המלצות לפי נתונים ותוצאת חישוב.
 * @param {Record<string, unknown>} structuredData - נתונים מובנים
 * @param {{ refundEstimate?: number, rawResult?: object }} taxResult - תוצאה מ-TaxRulesAgent
 * @returns {{ recommendations: string[] }}
 */
function recommend(structuredData, taxResult = {}) {
  const recommendations = [];
  const data = structuredData || {};
  const refund = Number(taxResult.refundEstimate ?? taxResult.rawResult?.refund) || 0;

  if (refund > 0) {
    recommendations.push("יש לך זכאות להחזר מס – מומלץ להגיש תביעה.");
  } else if (refund < 0) {
    recommendations.push("חוב מס – מומלץ להשלים תשלום או לבדוק ניכויים עתידיים.");
  }

  const children = Math.floor(Number(data.children) || 0);
  if (children === 0 && (data.childrenUnder6 === undefined || data.childrenUnder6 === null)) {
    recommendations.push("אם יש ילדים מתחת לגיל 6 – הזנת המספר מגדילה נקודות זיכוי.");
  }

  const hasPension = Number(data.pensionContribution ?? data.pension201 ?? data.pension230) > 0;
  if (!hasPension) {
    recommendations.push("הפרשה לקופת גמל/פנסיה יכולה להקטין מס – כדאי לבדוק זכאות.");
  }

  const donations = Number(data.donations ?? data.deductions991) || 0;
  if (donations === 0) {
    recommendations.push("תרומות לארגונים מוכרים מקנות זיכוי מס – שמור קבלות אם תרמת.");
  }

  const creditPoints = Number(data.creditPoints) || 2.25;
  if (creditPoints <= 2.25) {
    recommendations.push("וודא שכל נקודות הזיכוי שלך מוכרות (מגדר, ילדים, עולה חדש, פריפריה).");
  }

  return { recommendations };
}

module.exports = { recommend };
