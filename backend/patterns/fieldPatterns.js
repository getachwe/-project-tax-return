const FIELD_PATTERNS = [
  // Personal Information
  {
    key: "employeeName",
    regex: /(?:שם\s*העוב[ד|ת]|שם\s*העובד)[\s:|\-]+([^\n]*?)(?:\s*$|\s*[,;])/,
  },
  { key: "employeeId", regex: /(?:תעודת\s*זהות|ת\.ז\.)[\s:|\-]+([^\n]*)/ },
  {
    key: "birthDate",
    regex:
      /(?:תאריך\s*לידה|תאריך\s*לידת\s*העובד)[\s:|\-]+(\d{2}\/\d{2}\/\d{4})/,
  },
  {
    key: "address",
    regex: /(?:כתובת|כתובת\s*העובד)[\s:|\-]+([^\n]+?)(?:\s*$)/,
  },
  {
    key: "maritalStatus",
    regex: /(?:מצב\s*משפחתי|סטטוס\s*משפחתי)[\s:|\-]+([^\n]+?)(?:\s*$|\s*[,;])/,
  },
  {
    key: "residency",
    regex: /(?:תושבות|מעמד\s*תושבות)[\s:|\-]+([^\n]+?)(?:\s*$|\s*[,;])/,
  },
  { key: "gender", regex: /(?:מין|מגדר)[\s:|\-]+([^\n]+?)(?:\s*$|\s*[,;])/ },
  { key: "phoneNumber", regex: /(?:טלפון|מספר\s*טלפון)[\s:|\-]+([\d\-]+)/ },
  { key: "email", regex: /(?:דוא"ל|אימייל)[\s:|\-]+([^\n]*)/ },

  // Employment Information
  {
    key: "employerName",
    regex: /(?:שם\s*המעסיק|שם\s*החברה)[\s:|\-]+([^\n]+?)(?:\s*$|\s*[,;])/,
  },
  { key: "employerId", regex: /(?:ח\.פ\.\s*המעסיק|ח\.פ\.)[\s:|\-]+([\d\-]+)/ },
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
    regex: /(?:סוג\s*משרה|סוג\s*העסקה)[\s:|\-]+([^\n]+?)(?:\s*$|\s*[,;])/,
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
    regex: /(?:תקופת\s*עבודה|תקופת\s*העסקה)[\s:|\-]+([^\n]+?)(?:\s*$|\s*[,;])/,
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
    regex: /(?:נקודות\s*זיכוי|נקודות\s*זיכוי\s*למס)[\s:|\-]+([\d\.]+)/,
  },
  { key: "children", regex: /(?:מספר\s*ילדים|ילדים)[\s:|\-]+(\d+)/ },
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

  // Form Information
  {
    key: "fileNumber",
    regex: /(?:מספר\s*תיק\s*ניכויים|מספר\s*תיק)[\s:|\-]+([\d\-]+)/,
  },
  {
    key: "formNumber",
    regex: /(?:מספר\s*טופס|מספר\s*הטופס)[\s:|\-]+([\d\-]+)/,
  },
  {
    key: "formDate",
    regex: /(?:תאריך\s*טופס|תאריך\s*הטופס)[\s:|\-]+(\d{2}\/\d{2}\/\d{4})/,
  },
  {
    key: "positionNumber",
    regex: /(?:מספר\s*תפקיד|מספר\s*משרה)[\s:|\-]+([\d\-]+)/,
  },
  {
    key: "bankAccount",
    regex: /(?:חשבון\s*בנק|מספר\s*חשבון)[\s:|\-]+([\d\-]+)/,
  },
  { key: "bankBranch", regex: /(?:סניף\s*בנק|מספר\s*סניף)[\s:|\-]+([\d\-]+)/ },
  {
    key: "bankName",
    regex: /(?:שם\s*הבנק|בנק)[\s:|\-]+([\u0590-\u05FF][^\n]*)/,
  },
  {
    key: "managerName",
    regex: /(?:שם\s*המנהל|מנהל)[\s:|\-]+([^\n]+?)(?:\s*$|\s*[,;])/,
  },
  {
    key: "managerId",
    regex: /(?:ת\.ז\.\s*המנהל|תעודת\s*זהות\s*המנהל)[\s:|\-]+([\d\-]+)/,
  },
  {
    key: "managerPhone",
    regex: /(?:טלפון\s*המנהל|מספר\s*טלפון\s*המנהל)[\s:|\-]+([\d\-]+)/,
  },
  {
    key: "managerEmail",
    regex: /(?:דוא"ל\s*המנהל|אימייל\s*המנהל)[\s:|\-]+([\w\.\-]+@[\w\.\-]+)/,
  },
];

module.exports = { FIELD_PATTERNS };
