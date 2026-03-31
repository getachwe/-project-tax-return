# הוראות יישום מדורג — מנוע מס והתאמה לסימולטור (Production-Safe Architecture)

מסמך זה מיועד למנהל פרויקט / מפתח: איך לפרק את העבודה לשלבים בטוחים,
עם דגש על אמינות, ביצועים, ושליטה מלאה בלוגיקה.

---

## 1. מטרה ועקרונות בטיחות

מטרה:
להתקרב ללוגיקת דוח שנתי לשכירים (טופס 135 / סימולטור),
תוך שמירה על מערכת יציבה, אמינה, וללא תלות ב-AI לחישובים.

---

## כללים קריטיים (חובה)

1. שלב אחד בכל פעם — ללא ערבוב לוגיקות
2. טסטים חובה לפני merge
3. Backward compatibility מלא
4. הפרדה מוחלטת:

normalize → calculateTax → (optional) AI explanation

5. מנוע המס הוא מקור האמת היחיד

---

## ❗ חוק זהב

ALL tax calculations MUST be deterministic code.

AI is NOT allowed to:

- calculate tax
- change numbers
- override logic

---

## 1.1 שמירה על מה שעובד

- כל שדה חדש = אופציונלי
- calculateTax חייב להישאר תואם אחורה
- אין שינוי מבנה API קיים
- אין שינוי קונפיגורציה (.env וכו')

---

## 1.2 Intake (פרופיל משתמש)

לפני כל טופס:

המערכת חייבת לזהות:

- מצב משפחתי
- ילדים (כן/לא)
- סוג הכנסה

---

### כלל חשוב:

אין להציג שדות לא רלוונטיים

לדוגמה:
יחיד → לא רואה בן זוג  
בלי ילדים → לא רואה טבלת ילדים

---

## 2. ארכיטקטורה נכונה

```text
User
 ↓
Intake (profile)
 ↓
Data Input (106 / manual)
 ↓
normalizeToEnginePayload
 ↓
calculateTax (source of truth)
 ↓
validateEngineOutput (NEW)
 ↓
(optional) AI Explanation Layer
 ↓
Response
```
You are a senior backend engineer working on a production-grade tax system.

Your task is to implement a deterministic, reliable, and scalable tax calculation engine,
aligned with the Israeli tax simulator (Form 135 logic), while preserving system stability.

---

## 🎯 GOAL

Build the tax engine step-by-step WITHOUT breaking the existing system.

The system already exists. You are NOT building from scratch.

---

## 🚨 CRITICAL RULES (MUST FOLLOW)

1. NEVER break existing API responses
2. NEVER modify or delete configuration files (.env, vercel.json, etc.)
3. ALWAYS maintain backward compatibility
4. ALWAYS write/update tests (Jest) for any logic change
5. NEVER implement tax logic using AI
6. ALL tax calculations MUST be deterministic code
7. DO NOT refactor unrelated files
8. DO NOT introduce unnecessary abstractions

---

## ❗ ABSOLUTE RULE

AI IS NOT ALLOWED TO:
- calculate tax
- change numeric results
- override business logic

AI can ONLY:
- explain results
- guide users
- ask clarification questions

---

## 🧠 ARCHITECTURE (STRICT)

Follow this exact flow:

User Input
↓
Intake (user profile)
↓
Data Input (Form 106 / manual input)
↓
normalizeToEnginePayload(rawData)
↓
calculateTax(enginePayload)  ← SOURCE OF TRUTH
↓
validateEngineOutput(result)
↓
(optional) AI explanation layer
↓
Response

---

## 🧩 STEP-BY-STEP IMPLEMENTATION PLAN

---

### STEP 0 — Intake Layer

Goal:
Create a minimal user profile system BEFORE tax calculation.

Collect ONLY:
- maritalStatus
- hasChildren (true/false)
- incomeType (employee / self-employed / mixed)

Rules:
- DO NOT show irrelevant fields in UI
- DO NOT assume values from documents
- Store profile in existing context/state

---

### STEP A — Tax Constants

Goal:
Update tax constants for 2024

Tasks:
- Set CREDIT_POINT_VALUE = 2904
- Support taxYear parameter (default 2024)
- Fix incorrect field labels if exist

Files allowed:
- backend/taxCalculator.js
- backend/taxCalculator.test.js

---

### STEP B — Normalization Layer

Goal:
Create a normalization function:

normalizeToEnginePayload(rawData)

Rules:
- Convert extracted 106 data into a clean structure
- NO business logic
- NO calculations

Example output:
{
  income: number,
  taxPaid: number,
  pensionDeposits?: number
}

Files allowed:
- create new file: backend/taxEngine/normalizeToEnginePayload.js
- update process106.js to use it

---

### STEP C — Core Tax Engine

Goal:
Implement calculateTax()

Rules:
- Deterministic logic only
- No AI usage
- Single employee only

Tasks:
- Calculate taxable income
- Apply tax brackets
- Subtract tax credits
- Compare vs taxPaid

Output:
{
  taxLiability,
  taxPaid,
  refundOrDue
}

---

### STEP D — Joint Filing (Spouse)

Goal:
Support married users

Tasks:
- Add spouse income
- Combine taxPaid
- Support filingStatus = 'single' | 'joint'

---

### STEP E — Withholding Extensions

Goal:
Support additional withheld tax fields

Add:
- 040
- 043

Update:
taxPaidEffective = 042 + 040 + 043

---

### STEP F — Advanced Credits

Goal:
Add:
- children credits
- special credits (basic structure only)

---

## 🚫 IMPORTANT

DO NOT implement AI logic in Steps A–F

---

## 🧪 TESTING REQUIREMENTS

For every step:

- Update or create Jest tests
- Ensure no regression
- Old inputs must return SAME results as before

---

## 🛡 VALIDATION LAYER (MANDATORY)

Create:

validateEngineOutput(result)

Checks:
- negative values
- unrealistic outputs
- missing fields

DO NOT use AI for validation

---

## 🧠 AI LAYER (ONLY AFTER ENGINE IS STABLE)

Create optional explanation layer:

Input:
{
  result,
  summaryData
}

Output:
- simple explanation
- suggested follow-up questions

Rules:
- DO NOT modify result
- DO NOT calculate anything

---

## 📦 INTEGRATION NOTES

- process106.js must call:
  normalize → calculateTax → validate

- TaxRulesAgent must NOT override engine results

- If structuredData changes → ensure pipeline compatibility

---

## 🔴 RESTRICTED FILES (DO NOT TOUCH)

- backend/.env
- any .env.* file
- vercel.json
- deployment configs

---

## ✅ DEFINITION OF DONE

- All tests pass
- No API breaking changes
- No config changes
- Manual verification works
- Results match expected tax logic

---

## 🎯 FINAL INSTRUCTION

Focus on stability, simplicity, and correctness.

Do NOT over-engineer.

Do NOT introduce AI into core logic.

The tax engine must be predictable, testable, and production-safe.