export const FIELD_LABELS: Record<string, string> = {
  income: "הכנסה (158)",
  taxPaid: "מס שנוכה (244)",
  taxCredits: "זיכויי מס (248)",
  additionalIncome: "הכנסה נוספת (045)",
  firstName: "שם פרטי",
  lastName: "שם משפחה",
  employmentType: "סוג משרה",
  workPeriod: "תקופת עבודה",
  creditPoints: "נקודות זיכוי",
  children: "מספר ילדים מתחת לגיל 18",
  maritalStatus: "מצב משפחתי",
  taxYear: "שנת המס",
  birthDate: "תאריך לידה",
  workStartDate: "תאריך תחילת עבודה",
  workEndDate: "תאריך סיום עבודה",
  childAllowance: "קצבת ילדים",
  disabilityAllowance: "קצבת נכות",
  oldAgeAllowance: "קצבת זקנה",
  address: "כתובת",
  residency: "תושבות",
  gender: "מגדר",
};

export const FIELD_TOOLTIPS: Record<string, string> = {
  income: "סך כל ההכנסה החייבת במס לשנה. ניתן למצוא בשדה 158 בטופס 106.",
  taxPaid: "סכום המס שנוכה בפועל מהמשכורת. מופיע בשדה 244 בטופס 106.",
  taxCredits: "סך נקודות הזיכוי שלך. שדה 248 בטופס 106.",
  additionalIncome: "הכנסה נוספת (למשל בונוסים, פרסים). שדה 045 בטופס 106.",
  firstName: "שם פרטי שיוצג בדוח ה־PDF.",
  lastName: "שם משפחה שיוצג בדוח ה־PDF.",
  employmentType: "סוג המשרה שלך (מלאה/חלקית/אחר).",
  workPeriod: "התקופה בה עבדת אצל המעסיק בשנה הנוכחית.",
  creditPoints: "מספר נקודות הזיכוי שלך.",
  children: "מספר ילדים מתחת לגיל 18 שיש לך.",
  maritalStatus: "המצב המשפחתי שלך נכון לשנת המס.",
  taxYear: "השנה עבורה מתבצע החישוב. מצוין בראש טופס 106.",
  birthDate: "תאריך הלידה שלך.",
  workStartDate: "תאריך תחילת העבודה אצל המעסיק.",
  workEndDate: "תאריך סיום העבודה (אם רלוונטי).",
  childAllowance: "סכום קצבת ילדים (אם קיבלת).",
  disabilityAllowance: "סכום קצבת נכות (אם קיבלת).",
  oldAgeAllowance: "סכום קצבת זקנה (אם קיבלת).",
  address: "כתוב את כתובת המגורים שלך.",
  residency: "האם אתה תושב ישראל.",
  gender: "בחר את המגדר שלך.",
};

export const MARITAL_OPTIONS = [
  { value: "single", label: "רווק/ה" },
  { value: "married", label: "נשוי/אה" },
  { value: "divorced", label: "גרוש/ה" },
  { value: "widowed", label: "אלמן/ה" },
];

export const EMPLOYMENT_OPTIONS = [
  { value: "full", label: "משרה מלאה" },
  { value: "part", label: "משרה חלקית" },
  { value: "other", label: "אחר" },
];

export const GENDER_OPTIONS = [
  { value: "male", label: "זכר" },
  { value: "female", label: "נקבה" },
]; 