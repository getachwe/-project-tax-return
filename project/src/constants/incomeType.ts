/** סוג הכנסה עיקרי — STEP 0 Intake; מנוע המס עדיין מותאם בעיקר לשכיר */
export type IncomeType = "employee" | "self_employed" | "mixed";

export const INCOME_TYPE_OPTIONS: { value: IncomeType; label: string }[] = [
  { value: "employee", label: "שכיר/ה (הכנסה עיקרית ממשכורת)" },
  { value: "self_employed", label: "עצמאי/ת" },
  {
    value: "mixed",
    label: "שכיר/ה עם הכנסות נוספות (ריבית, שכירות וכו׳)",
  },
];
