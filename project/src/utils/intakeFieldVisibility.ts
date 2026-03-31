import type { IncomeType } from "../constants/incomeType";

/**
 * STEP 0: שדות מעסיק/תיק ניכויים רלוונטיים בעיקר לשכיר. לעצמאי/ת באינטייק — מוסתרים בטופס המלא והשלמה.
 */
export function showEmployerDetailFields(
  incomeType: IncomeType | undefined,
): boolean {
  return incomeType !== "self_employed";
}
