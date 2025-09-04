const FIELD_PATTERNS = {
  default: [
    // Personal Information
    {
      key: "employeeName",
      regex:
        /(?:שם\s*העוב[ד|ת]|שם\s*העובד)[\s:|\-]+([^\n]*?)(?:\s*$|\s*[,;])|שם\s*העובד\s*([^\n]+)/,
    },
    {
      key: "employeeId",
      regex:
        /(?:תעודת\s*זהות|ת\.ז\.|מספר\s*זהות|מספר\s*עובד|מס'?\s*עובד)[\s:|\-]+([^\n]*)/,
    },
    {
      key: "birthDate",
      regex:
        /(?:תאריך\s*לידה|תאריך\s*לידת\s*העובד)[\s:|\-]+(\d{2}\/\d{2}\/\d{4})/,
    },
    {
      key: "birthYear",
      regex: /(?:שנת\s*לידה|שנת\s*לידת\s*העובד)[\s:|\-]+(\d{4})/,
    },
    {
      key: "address",
      regex: /(?:כתובת|כתובת\s*העובד|כתובת\s*מגורים)[\s:|\-]+([^\n]+?)(?:\s*$)/,
    },
    {
      key: "maritalStatus",
      regex:
        /(?:מצב\s*משפחתי|סטטוס\s*משפחתי)[\s:|\-]+([^\n]+?)(?:\s*$|\s*[,;])|מצב\s*משפחתי\s*([^\n]+)/,
    },
    {
      key: "residency",
      regex: /(?:תושבות|מעמד\s*תושבות)[\s:|\-]+([^\n]+?)(?:\s*$|\s*[,;])/,
    },
    {
      key: "gender",
      regex: /(?:מין|מגדר|מין\s*מועמד)[\s:|\-]+([^\n]+?)(?:\s*$|\s*[,;])/,
    },
    { key: "phoneNumber", regex: /(?:טלפון|מספר\s*טלפון)[\s:|\-]+([\d\-]+)/ },
    { key: "email", regex: /(?:דוא"ל|אימייל)[\s:|\-]+([^\n]*)/ },

    // Employment Information
    {
      key: "employerName",
      regex:
        /(?:שם\s*המעסיק|שם\s*החברה|שם\s*המעביד)[\s:|\-]+([^\n]+?)(?:\s*$|\s*[,;])|שם\s*המעסיק\s*([^\n]+)/,
    },
    {
      key: "employerId",
      regex:
        /(?:ח\.פ\.|ע\.מ\.|מספר\s*מעסיק|מס'?\s*תיק\s*ניכויים)[\s:|\-]+([\d\-]+)/,
    },
    {
      key: "jobTitle",
      regex: /(?:תפקיד|משרה)[\s:|\-]+([^\n]+?)(?:\s*$|\s*[,;])/,
    },
    {
      key: "department",
      regex: /(?:מחלקה|אגף)[\s:|\-]+([^\n]+?)(?:\s*$|\s*[,;])/,
    },
    {
      key: "employmentType",
      regex: /(?:סוג\s*משרה|משרה)[\s:|\-]+(מלאה|חלקית|אחר)[^\n]*/,
    },
    {
      key: "workStartDate",
      regex:
        /(?:תאריך\s*תחילת\s*עבודה|תחילת\s*עבודה)[\s:|\-]+(\d{2}\/\d{2}\/\d{4})/,
    },
    {
      key: "workEndDate",
      regex:
        /(?:תאריך\s*סיום\s*עבודה|סיום\s*עבודה)[\s:|\-]+(\d{2}\/\d{2}\/\d{4})/,
    },
    {
      key: "workPeriod",
      regex:
        /(?:תקופת\s*עבודה|תקופת\s*העסקה)[\s:|\-]+([^\n]+?)(?:\s*$|\s*[,;])|חדשי\s*עבודה\s*[:\-\s]+(\d+)/,
    },
    { key: "workHours", regex: /(?:שעות\s*עבודה|משרה)[\s:|\-]+(\d+)/ },
    {
      key: "salaryType",
      regex: /(?:סוג\s*שכר|סוג\s*תשלום)[\s:|\-]+([^\n]+?)(?:\s*$|\s*[,;])/,
    },

    // Tax Information
    { key: "taxYear", regex: /(?:שנת\s*המס|שנת\s*מס)[\s:|\-]+(\d{4})/ },
    {
      key: "creditPoints",
      regex: /(?:נקודות\s*זיכוי|נקודת\s*זיכוי)[:\s]+([\d]+(?:[\.,]\d+)?)/,
    },
    {
      key: "children",
      regex:
        /(?:מספר\s*ילדים|ילדים|מספר\s*ילדים\s*מתחת\s*לגיל\s*18)[\s:|\-]+(\d+)/,
    },
    {
      key: "childAllowance",
      regex: /(?:קצבת\s*ילדים|זכאות\s*לילדים)[\s:|\-]+(\d+)/,
    },
    {
      key: "disabilityAllowance",
      regex: /(?:קצבת\s*נכות|זכאות\s*לנכות)[\s:|\-]+(\d+)/,
    },
    {
      key: "oldAgeAllowance",
      regex: /(?:קצבת\s*זקנה|זכאות\s*לזקנה)[\s:|\-]+(\d+)/,
    },
    {
      key: "taxBracket",
      regex: /(?:מדרגת\s*מס|מדרגת\s*המס)[\s:|\-]+([^\n]+?)(?:\s*$|\s*[,;])/,
    },
    {
      key: "taxDeductions",
      regex: /(?:ניכויים\s*למס|הפחתות\s*למס)[\s:|\-]+([^\n]+?)(?:\s*$|\s*[,;])/,
    },
    {
      key: "taxExemptions",
      regex: /(?:פטורים\s*ממס|פטור\s*ממס)[\s:|\-]+([^\n]+?)(?:\s*$|\s*[,;])/,
    },
    // textual 042 form (סה"כ ניכויי מס ...)
    {
      key: "taxPaid",
      regex: /(?:סה"כ\s*ניכויי\s*מס)[^\d]*([\d,\.]+)/,
    },

    // Income Information
    { key: "income", regex: /שכר\s*ברוטו[:\s]+([\d,\.]+)/ },
    { key: "income", regex: /סה"כ\s*שכר\s*ברוטו[:\s]+([\d,\.]+)/ },
    { key: "income", regex: /ברוטו\s*לשנה[:\s]+([\d,\.]+)/ },
    { key: "income", regex: /סה"כ\s*הכנסה[:\s]+([\d,\.]+)/ },
    { key: "additionalIncome", regex: /הכנסה\s*נוספת[:\s]+([\d,\.]+)/ },
    { key: "taxPaid", regex: /מס\s*הכנסה[:\s]+([\d,\.]+)/ },
    { key: "taxPaid", regex: /סה"כ\s*מס\s*הכנסה[:\s]+([\d,\.]+)/ },
    { key: "taxPaid", regex: /ניכוי\s*מס\s*הכנסה[:\s]+([\d,\.]+)/ },
    {
      key: "formDate",
      regex: /(?:תאריך\s*הטופס|תאריך)[\s:|\-]+(\d{2}\/\d{2}\/\d{4})/,
    },
    {
      key: "fileNumber",
      regex: /(?:מס'?\s*תיק\s*ניכויים|מספר\s*תיק\s*ניכויים)[\s:|\-]+([\d\-]+)/,
    },
  ],
  templateA: [
    // וריאציה נפוצה: כותרת "אישור על הכנסות" + "שנת המס"
    { key: "employeeName", regex: /שם\s*העוב[ד|ת][\s:|\-]+([^\n]+)/ },
    { key: "employeeId", regex: /(ת\.ז\.|מספר\s*זהות)[\s:|\-]+([^\n]+)/ },
    { key: "employerName", regex: /שם\s*המעסיק[\s:|\-]+([^\n]+)/ },
    { key: "employerId", regex: /(ח\.פ\.|מספר\s*מעסיק)[\s:|\-]+([\d\-]+)/ },
    { key: "taxYear", regex: /שנת\s*המס[\s:|\-]+(\d{4})/ },
    {
      key: "income",
      regex: /(סה"כ\s*שכר\s*ברוטו|ברוטו\s*לשנה)[:\s]+([\d,\.]+)/,
    },
    {
      key: "taxPaid",
      regex:
        /(סה"כ\s*מס\s*הכנסה|מס\s*שנוכה|ניכוי\s*מס\s*הכנסה)[:\s]+([\d,\.]+)/,
    },
    { key: "creditPoints", regex: /נקודות\s*זיכוי[:\s]+([\d]+(?:[\.,]\d+)?)/ },
  ],
  templateB: [
    // דוגמה: regex מותאם לטופס מסוג B (אפשר להעתיק מה-default ולהתאים בהמשך)
    { key: "employeeName", regex: /שם\s*העוב[ד|ת]\s*[:\-]\s*([^\n]+)/ },
    { key: "employeeId", regex: /(ת\.ז\.|מספר\s*זהות)\s*[:\-]\s*([^\n]+)/ },
    { key: "taxYear", regex: /שנת\s*מס\s*[:\-]\s*(\d{4})/ },
    { key: "income", regex: /סה"כ\s*הכנסה\s*[:\-]\s*([\d,\.]+)/ },
    { key: "taxPaid", regex: /סה"כ\s*ניכויי\s*מס\s*[:\-]\s*([\d,\.]+)/ },
    {
      key: "creditPoints",
      regex: /נקודות\s*זיכוי\s*[:\-]\s*([\d]+(?:[\.,]\d+)?)/,
    },
  ],
  templateC: [
    // וריאציה: "טופס 106" בולט, טבלאות מפורקות, שדה "מספר עובד"
    { key: "employeeName", regex: /שם\s*עוב[ד|ת][\s:|\-]+([^\n]+)/ },
    { key: "employeeId", regex: /(מספר\s*עובד|ת\.ז\.)[\s:|\-]+([^\n]+)/ },
    { key: "employerName", regex: /(שם\s*המעסיק|שם\s*החברה)[:\-\s]+([^\n]+)/ },
    { key: "taxYear", regex: /(שנת\s*מס|שנת\s*המס)[:\-\s]+(\d{4})/ },
    { key: "income", regex: /(ברוטו\s*לשנה|שכר\s*ברוטו)[\s:|\-]+([\d,\.]+)/ },
    {
      key: "taxPaid",
      regex: /(מס\s*הכנסה|ניכוי\s*מס\s*הכנסה)[\s:|\-]+([\d,\.]+)/,
    },
    {
      key: "creditPoints",
      regex: /נקודות\s*זיכוי[\s:|\-]+([\d]+(?:[\.,]\d+)?)/,
    },
  ],
};

module.exports = { FIELD_PATTERNS };
