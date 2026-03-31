/**
 * STEP 0 (AGENT_TAX_SIMULATOR_ROLLOUT): התאמת מצב הגשה לפי מצב משפחתי מינימלי באינטייק.
 * נשוי/ה → ברירת מחדל גילוי משותף; אחרת יחיד/נפרד (המשתמש יכול לשנות בטופס המלא).
 */
export function defaultFilingStatusFromMarital(
  maritalStatus: string | undefined,
): "single" | "joint" {
  return String(maritalStatus || "").toLowerCase() === "married"
    ? "joint"
    : "single";
}
