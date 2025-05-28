const fs = require("fs");
const path = require("path");
const { extract106 } = require("./extract106");

// Mock the pdf-parse module
jest.mock("pdf-parse", () => {
  return jest.fn().mockImplementation((buffer) => {
    // Instead of reading from file, we'll use the buffer directly
    return Promise.resolve({
      text: buffer.toString("utf8"),
    });
  });
});

describe("extract106", () => {
  // Helper function to create test data
  const createTestData = (data) => {
    const testDir = path.join(__dirname, "test-data");
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir);
    }
    fs.writeFileSync(path.join(testDir, "sample-106.txt"), data);
  };

  // Helper function to clean up test data
  const cleanupTestData = () => {
    const testDir = path.join(__dirname, "test-data");
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  };

  beforeEach(() => {
    cleanupTestData();
  });

  afterAll(() => {
    cleanupTestData();
  });

  test("should extract all required fields correctly", async () => {
    // Sample form data
    const sampleData = `
      שם העובד: ישראל ישראלי
      תעודת זהות: 123456789
      תאריך לידה: 01/01/1990
      כתובת: רחוב הרצל 1, תל אביב
      מצב משפחתי: נשוי
      תושבות: תושב ישראל
      מין: זכר
      טלפון: 050-1234567
      דוא"ל: israel@example.com

      שם המעסיק: חברה בע"מ
      ח.פ. המעסיק: 123456789
      תפקיד: מתכנת
      מחלקה: פיתוח
      סוג משרה: מלאה
      תאריך תחילת עבודה: 01/01/2023
      תאריך סיום עבודה: 31/12/2023
      תקופת עבודה: 12 חודשים
      שעות עבודה: 186
      סוג שכר: חודשי

      שנת המס: 2023
      נקודות זיכוי: 2.25
      מספר ילדים: 2
      קצבת ילדים: 2
      קצבת נכות: 0
      קצבת זקנה: 0
      מדרגת מס: 1
      ניכויים למס: 0
      פטורים ממס: 0

      מספר תיק ניכויים: 123456
      מספר טופס: 789012
      תאריך טופס: 01/01/2024
      מספר תפקיד: 123
      חשבון בנק: 123456
      סניף בנק: 12
      שם הבנק: בנק הפועלים
      שם המנהל: דוד כהן
      ת.ז. המנהל: 987654321
      טלפון המנהל: 050-7654321
      דוא"ל המנהל: david@example.com

      קודי מס:
      158 100000
      244 20000
      248 5000
      045 10000
      991 1000
      182 2000
      505 3000
      184 4000
      176 5000
      201 6000
      230 7000
      2560 8000
      31446 9000
      59523 10000
      11926 11000
      300 12000
      301 13000
      302 14000
      303 15000
      304 16000
      305 17000
      306 18000
      307 19000
      308 20000
      309 21000
      310 22000
      311 23000
      312 24000
      313 25000
      314 26000
      315 27000
    `;

    createTestData(sampleData);
    const filePath = path.join(__dirname, "test-data", "sample-106.txt");
    const buffer = Buffer.from(sampleData);

    const result = await extract106(filePath, "application/pdf");

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      // Personal Information
      employeeName: "ישראל ישראלי",
      employeeId: "123456789",
      birthDate: "01/01/1990",
      address: "רחוב הרצל 1, תל אביב",
      maritalStatus: "נשוי",
      residency: "תושב ישראל",
      gender: "זכר",
      phoneNumber: "050-1234567",
      email: "israel@example.com",

      // Employment Information
      employerName: 'חברה בע"מ',
      employerId: "123456789",
      jobTitle: "מתכנת",
      department: "פיתוח",
      employmentType: "מלאה",
      workStartDate: "01/01/2023",
      workEndDate: "31/12/2023",
      workPeriod: "12 חודשים",
      workHours: "186",
      salaryType: "חודשי",

      // Tax Information
      taxYear: "2023",
      creditPoints: "2.25",
      children: "2",
      childAllowance: "2",
      disabilityAllowance: "0",
      oldAgeAllowance: "0",
      taxBracket: "1",
      taxDeductions: "0",
      taxExemptions: "0",

      // Form Information
      fileNumber: "123456",
      formNumber: "789012",
      formDate: "01/01/2024",
      positionNumber: "123",
      bankAccount: "123456",
      bankBranch: "12",
      bankName: "בנק הפועלים",
      managerName: "דוד כהן",
      managerId: "987654321",
      managerPhone: "050-7654321",
      managerEmail: "david@example.com",

      // Tax Codes
      income: 100000,
      taxPaid: 20000,
      taxCredits: 5000,
      additionalIncome: 10000,
      deductions991: 1000,
      deductions182: 2000,
      deductions505: 3000,
      deductions184: 4000,
      deductions176: 5000,
      pension201: 6000,
      pension230: 7000,
      pension2560: 8000,
      pension31446: 9000,
      pension59523: 10000,
      pension11926: 11000,
      severancePay: 12000,
      severancePayTax: 13000,
      compensation: 14000,
      compensationTax: 15000,
      bonus: 16000,
      bonusTax: 17000,
      overtime: 18000,
      overtimeTax: 19000,
      allowances: 20000,
      allowancesTax: 21000,
      benefits: 22000,
      benefitsTax: 23000,
      reimbursements: 24000,
      reimbursementsTax: 25000,
      otherIncome: 26000,
      otherIncomeTax: 27000,
    });

    expect(result.missingFields).toEqual([]);
  });

  test("should handle missing fields correctly", async () => {
    const sampleData = `
      שם העובד: ישראל ישראלי
      תעודת זהות: 123456789
    `;

    createTestData(sampleData);
    const filePath = path.join(__dirname, "test-data", "sample-106.txt");

    const result = await extract106(filePath, "application/pdf");

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      employeeName: "ישראל ישראלי",
      employeeId: "123456789",
    });

    // Check that all required fields except the ones we provided are in missingFields
    const expectedMissingFields = [
      "income",
      "taxPaid",
      "taxCredits",
      "employmentType",
      "children",
      "workPeriod",
      "creditPoints",
      "additionalIncome",
      "taxYear",
      "birthDate",
      "workStartDate",
      "workEndDate",
      "childAllowance",
      "disabilityAllowance",
      "oldAgeAllowance",
      "address",
      "maritalStatus",
      "residency",
      "employerName",
      "employerId",
      "department",
      "jobTitle",
      "deductions991",
      "deductions182",
      "deductions505",
      "deductions184",
      "deductions176",
      "pension201",
      "pension230",
      "pension2560",
      "pension31446",
      "pension59523",
      "pension11926",
      "formDate",
      "fileNumber",
      "positionNumber",
      "bankAccount",
      "formNumber",
      "managerName",
    ];

    expect(result.missingFields.sort()).toEqual(expectedMissingFields.sort());
  });

  test("should handle invalid file path", async () => {
    const result = await extract106("non-existent-file.pdf", "application/pdf");
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test("should handle malformed data", async () => {
    const sampleData = `
      שם העובד: 
      תעודת זהות: abc
      תאריך לידה: 99/99/9999
    `;

    createTestData(sampleData);
    const filePath = path.join(__dirname, "test-data", "sample-106.txt");

    const result = await extract106(filePath, "application/pdf");

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      employeeName: "",
      employeeId: "abc",
      birthDate: "99/99/9999",
    });

    // Verify that malformed data is still included in missingFields
    expect(result.missingFields).toContain("employeeName");
  });

  test("should handle tax codes with different formats", async () => {
    const sampleData = `
      קודי מס:
      158 100,000
      244 20,000.50
      248 5,000.00
    `;

    createTestData(sampleData);
    const filePath = path.join(__dirname, "test-data", "sample-106.txt");

    const result = await extract106(filePath, "application/pdf");

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      income: 100000,
      taxPaid: 20000.5,
      taxCredits: 5000.0,
    });
  });
});

const FIELD_PATTERNS = [
  // Personal Information
  {
    key: "employeeName",
    regex: /^ *(?:שם\s*העוב[ד|ת]|שם\s*העובד)[\s:|\-]*(.*)$/m,
  },
  { key: "employeeId", regex: /^ *(?:תעודת\s*זהות|ת\.ז\.)[\s:|\-]*(.*)$/m },
  {
    key: "birthDate",
    regex:
      /^ *(?:תאריך\s*לידה|תאריך\s*לידת\s*העובד)[\s:|\-]+(\d{2}\/\d{2}\/\d{4})/m,
  },
  // חילוץ כתובת: כל מה שאחרי הנקודתיים עד סוף השורה
  { key: "address", regex: /^ *(?:כתובת|כתובת\s*העובד)[\s:|\-]+(.+)$/m },
  // ... שדות נוספים ...
  // חילוץ שם הבנק: אם יש פסיק אחרי מספר, קח את מה שאחריו, אחרת קח את מה שמתחיל באות
  {
    key: "bankName",
    regex: /^ *(?:שם\s*הבנק|בנק)[\s:|\-]+(?:(?:[\d\-]+, *)?(.+))$/m,
  },
  // ... שדות נוספים ...
];

async function extractData(filePath) {
  const text = await extractTextFromPdf(filePath);
  const data = {};

  const lines = text.split("\n");

  for (const line of lines) {
    for (const { key, regex } of FIELD_PATTERNS) {
      if (!data[key]) {
        const match = line.match(regex);
        if (match) {
          // ערך ריק יישמר כ-"" ולא undefined
          const value = (match[1] !== undefined ? match[1] : "").trim();
          data[key] = value;
        }
      }
    }

    // חילוץ קודי מס (ללא שינוי)
    const codeAmountRegex = /(?:^|\s)(\d{3,5})\s{1,10}([\d,\.]+)/gm;
    let match;
    while ((match = codeAmountRegex.exec(line)) !== null) {
      const code = match[1];
      const amount = Number(match[2].replace(/,/g, ""));
      if (TAX_CODES[code]) {
        data[TAX_CODES[code]] = amount;
      }
    }
  }

  return data;
}
