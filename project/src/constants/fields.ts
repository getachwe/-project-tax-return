export const FIELD_LABELS: Record<string, string> = {
  // נתונים עיקריים לחישוב מס
  income: "הכנסה (158)",
  taxPaid: "מס שנוכה (042)",
  taxCredits: "זיכויי מס (248)",
  additionalIncome: "הכנסה נוספת (045)",
  workPeriod: "תקופת עבודה",
  creditPoints: "נקודות זיכוי",
  children: "מספר ילדים מתחת לגיל 18",
  taxYear: "שנת המס",
  
  // נתונים אישיים
  firstName: "שם פרטי",
  lastName: "שם משפחה",
  employeeId: "מספר זהות",
  birthDate: "תאריך לידה",
  maritalStatus: "מצב משפחתי",
  gender: "מגדר",
  address: "כתובת",
  residency: "תושבות",
  
  // נתוני עבודה
  employmentType: "סוג משרה",
  workStartDate: "תאריך תחילת עבודה",
  workEndDate: "תאריך סיום עבודה",
  employerName: "שם המעביד",
  deductionFileNumber: "מספר תיק ניכויים",
  kibbutzMember: "חבר קיבוץ",
  
  // נתונים פיננסיים נוספים
  pensionAllocation: "הפרשה לקצבה",
  employeePensionDeposit: "הפקדות עובד לקופ״ג",
  socialSecuritySalary: "שכר חייב בדמי ביטוח",
  
  // קצבאות
  childAllowance: "קצבת ילדים",
  disabilityAllowance: "קצבת נכות",
  oldAgeAllowance: "קצבת זקנה",
};

export const FIELD_TOOLTIPS: Record<string, string> = {
  // נתונים עיקריים לחישוב מס
  income: "סך כל ההכנסה החייבת במס לשנה. ניתן למצוא בשדה 158 בטופס 106.",
  taxPaid: "סכום המס שנוכה בפועל מהמשכורת. מופיע בשדה 042 בטופס 106.",
  taxCredits: "סך נקודות הזיכוי שלך. שדה 248 בטופס 106.",
  additionalIncome: "הכנסה נוספת (למשל בונוסים, פרסים). שדה 045 בטופס 106.",
  workPeriod: "התקופה בה עבדת אצל המעסיק בשנה הנוכחית.",
  creditPoints: "מספר נקודות הזיכוי שלך.",
  children: "מספר ילדים מתחת לגיל 18 שיש לך.",
  taxYear: "השנה עבורה מתבצע החישוב. מצוין בראש טופס 106.",
  
  // נתונים אישיים
  firstName: "שם פרטי שיוצג בדוח ה־PDF.",
  lastName: "שם משפחה שיוצג בדוח ה־PDF.",
  employeeId: "מספר הזהות שלך כפי שמופיע בטופס 106.",
  birthDate: "תאריך הלידה שלך.",
  maritalStatus: "המצב המשפחתי שלך נכון לשנת המס.",
  gender: "בחר את המגדר שלך.",
  address: "כתוב את כתובת המגורים שלך.",
  residency: "האם אתה תושב ישראל.",
  
  // נתוני עבודה
  employmentType: "סוג המשרה שלך (מלאה/חלקית/אחר).",
  workStartDate: "תאריך תחילת העבודה אצל המעסיק.",
  workEndDate: "תאריך סיום העבודה (אם רלוונטי).",
  employerName: "שם החברה/המעסיק כפי שמופיע בטופס 106.",
  deductionFileNumber: "מספר תיק הניכויים של המעסיק.",
  kibbutzMember: "האם אתה חבר קיבוץ (כן/לא).",
  
  // נתונים פיננסיים נוספים
  pensionAllocation: "סכום ההפרשה לקצבה ממנה נוכה מס.",
  employeePensionDeposit: "סכום ההפקדות שלך לקופת גמל לקצבה.",
  socialSecuritySalary: "השכר החייב בדמי ביטוח לאומי.",
  
  // קצבאות
  childAllowance: "סכום קצבת ילדים (אם קיבלת).",
  disabilityAllowance: "סכום קצבת נכות (אם קיבלת).",
  oldAgeAllowance: "סכום קצבת זקנה (אם קיבלת).",
};

export const MARITAL_OPTIONS = [
  { value: "", label: "בחר מצב משפחתי..." },
  { value: "single", label: "רווק/ה" },
  { value: "married", label: "נשוי/ה" },
  { value: "divorced", label: "גרוש/ה" },
  { value: "widowed", label: "אלמן/ה" },
];

export const EMPLOYMENT_OPTIONS = [
  { value: "", label: "בחר סוג משרה..." },
  { value: "full", label: "משרה מלאה" },
  { value: "part", label: "משרה חלקית" },
  { value: "other", label: "אחר" },
];

export const GENDER_OPTIONS = [
  { value: "", label: "בחר מגדר..." },
  { value: "male", label: "זכר" },
  { value: "female", label: "נקבה" },
]; 