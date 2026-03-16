# AI Agents Expansion Plan

## Tax Refund System – Safe Implementation Guide

You are an expert senior AI engineer and full-stack architect.

You are working on an **existing tax refund calculation system that already works correctly in production** and is integrated with the OpenAI API.

The purpose of this document is to guide the implementation of **new AI capabilities** without breaking any existing functionality.

The system must remain **stable, reliable, and backward compatible**.

---

# CRITICAL RULES (MUST FOLLOW)

1. **Never break existing functionality.**
2. **Never refactor working code unless explicitly required.**
3. **Never modify configuration files unless absolutely necessary.**
4. **Preserve all existing integrations and environment variables.**
5. **All improvements must be additive.**
6. **Prefer creating new modules instead of editing existing ones.**
7. **Before writing code, analyze the full project structure.**
8. **If a change could affect existing behavior, stop and ask for approval.**

---

# SYSTEM GOAL

Improve the tax refund system by adding:

- AI Agents
- Document intelligence
- Validation
- Recommendations
- Risk analysis
- Simulation tools
- Audit logging

All while keeping the current system stable.

---

# STEP 1 – PROJECT ANALYSIS (DO THIS FIRST)

Before implementing anything:

1. Scan the entire project.
2. Identify:

   - architecture
   - folders
   - services
   - API integrations
   - OpenAI integration
   - configuration files
   - environment variables

3. Document the structure.

Output a short report describing:

- backend structure
- frontend structure
- AI usage
- calculation logic

Do not change any code yet.

---

# STEP 2 – SAFE EXTENSION STRATEGY

All new features must follow these principles:

- Use **new modules**
- Avoid editing existing logic
- Use **feature flags** if necessary
- Keep backward compatibility
- Keep code clean and modular

---

# STEP 3 – CREATE AI AGENTS ARCHITECTURE

Create a new directory:

/ai-agents

Inside it implement multiple specialized agents.

Each agent must have a **single responsibility**.

---

# AGENT 1 – DocumentAnalyzerAgent

Purpose:
Extract structured data from uploaded tax documents.

Supported documents:

- Form 106
- Form 867
- Other tax related forms

Responsibilities:

- parse document text
- detect important tax fields
- extract structured values

Example output JSON:

{
"income": number,
"taxPaid": number,
"pensionContribution": number,
"donations": number
}

The agent must not interfere with existing logic.

---

# AGENT 2 – TaxRulesAgent

Purpose:

Apply tax laws and determine refund eligibility.

Responsibilities:

- apply tax rules
- calculate estimated refund
- evaluate tax credits
- validate calculation logic

Prefer deterministic logic when possible.

---

# AGENT 3 – ValidationAgent

Purpose:

Ensure data quality and detect inconsistencies.

Responsibilities:

- detect missing values
- detect inconsistent data
- detect suspicious inputs

Example validation:

Income high but tax paid extremely low.

Flag as potential error.

---

# AGENT 4 – RecommendationAgent

Purpose:

Provide insights and recommendations to users.

Responsibilities:

- identify possible tax credits
- explain refund eligibility
- suggest ways to improve refund eligibility

Example recommendations:

- child tax credits
- donation deductions
- pension contributions

---

# AGENT 5 – RiskAgent

Purpose:

Evaluate risk level of the refund claim.

Responsibilities:

- detect unusually large refunds
- detect unclear documents
- evaluate confidence level

Return:

riskLevel
confidenceScore

---

# STEP 4 – DOCUMENT PROCESSING PIPELINE

Create a pipeline for document analysis.

Pipeline structure:

Upload Document
→ OCR
→ AI Parsing
→ Structured Data
→ ValidationAgent
→ TaxRulesAgent

This pipeline must not interfere with existing logic.

---

# STEP 5 – CONFIDENCE SCORE

Add a confidence score to refund results.

Example response structure:

refundEstimate
confidenceScore
riskLevel

The confidence score should reflect:

- data completeness
- document clarity
- validation results

---

# STEP 6 – EXPLANATION ENGINE

Implement a system that explains refund results.

The explanation should include:

- why refund exists
- which tax rules were applied
- which documents influenced the calculation

The explanation must be clear and user-friendly.

---

# STEP 7 – SIMULATION ENGINE

Add a simulation feature.

Purpose:

Allow users to test different financial scenarios.

Examples:

- donating money
- contributing to pension
- changes in salary

The system should simulate the impact on taxes and refunds.

---

# STEP 8 – AUDIT TRAIL

Implement logging for transparency.

Store:

- calculation steps
- rules applied
- documents used
- AI outputs
- timestamps

Create a separate audit service or module.

This is critical for system reliability.

---

# STEP 9 – UX IMPROVEMENT SUGGESTIONS

Recommend improvements for the user interface.

Examples:

- guided wizard input
- missing document alerts
- clear refund dashboard

Important:

Do not modify UI automatically.
Only suggest improvements.

---

# STEP 10 – TEST SAFETY

Before implementing any features:

Generate automated tests.

Test areas:

- tax calculation logic
- agent outputs
- validation system

Ensure that **existing behavior remains unchanged**.

---

# FINAL RULE

All improvements must be **safe, modular, and reversible**.

Never remove working logic.

If there is any uncertainty, pause implementation and ask for confirmation.
