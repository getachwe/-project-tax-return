You are a senior developer building a data-driven AI chatbot.

The chatbot must ONLY use existing user data from the system (financial reports).

IMPORTANT:

- DO NOT ask the user to input financial data
- DO NOT calculate anything based on user input
- ONLY use data retrieved from the database
- The chatbot is read-only (analysis only)

---

### 🎯 Goal:

Build a chatbot that:

- Analyzes user reports
- Explains data
- Identifies trends and anomalies
- Provides insights
- Does NOT perform new calculations based on user input

---

### 🧩 Categories:

Implement the following categories:

1. REPORT_SUMMARY → summarize reports
2. TRENDS → identify changes over time
3. ANOMALIES → detect unusual values
4. DATA_EXPLANATION → explain report fields
5. YEAR_COMPARISON → compare years
6. INSIGHTS → provide insights
7. GENERAL_INFO → fallback

---

### 🧠 Behavior Rules:

- Always fetch reports from DB
- If no reports:
  → "No data available for analysis"

- NEVER ask:
  - income
  - tax
  - personal data

- ALWAYS respond using:
  "Based on your reports..."

---

### 🧠 Flow:

1. Show category options
2. User selects category
3. Fetch reports
4. Sanitize data (remove PII)
5. Format data
6. Send to AI
7. Return analysis

---

### ✍️ AI Prompt:

You are a financial analyst.

Analyze the following report data.

Rules:

- Use ONLY the provided data
- Do NOT assume missing values
- Do NOT ask for additional data
- Provide clear explanations

Data:
${formattedReports}

Question:
${userMessage}

---

## Implementation in this repo (מצב נוכחי)

| רכיב | מיקום |
|------|--------|
| קטגוריות + סיווג + הנחיות ל-LLM לפי קטגוריה | `backend/services/chatCategory.js` |
| הוראות מערכת, קריאה ל-OpenAI עם קטגוריה | `backend/services/chatAiService.js` |
| סניטציה, העשרה, `formattedReports` | `backend/services/chatReportPipeline.js` + `chatContextBuilder.js` |
| `POST /api/chat` — `category`, `maxReports`, תשובה עם `category` | `backend/routes/chat.js` |
| בורר קטגוריות ב-UI | `project/src/components/assistant/TaxAssistantChat.tsx` |
| API client | `project/src/utils/api.ts` |

- חישובי **ממוצע/סכום** על פני דוחות בוצעים בשרת **רק** משורות דוחות שנטענו מה-DB (`tryAggregateReportsReply`), לא ממספרים שהמשתמש מקליד.
- אורח: אין דוחות — `GENERAL_INFO` וידע כללי בלבד.
