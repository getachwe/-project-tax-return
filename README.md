# Hebrew Tax Refund Calculator

A modern fullstack system for tax refund calculation, including a React (Vite + Tailwind) frontend and a Node.js (Express) backend.  
The system enables tax refund calculations, document uploads, PDF generation, email delivery, optional AI/chat features, and a Hebrew RTL interface.

---

## Table of Contents

- [Overview](#overview)
- [Main Technologies](#main-technologies)
- [Project Structure](#project-structure)
- [Installation & Running](#installation--running)
- [Files Not in Git](#files-not-in-git)
- [Sensitive Files](#sensitive-files)
- [Deployment (Vercel)](#deployment-vercel)
- [Usage Example](#usage-example)
- [Contributing](#contributing)

---

## Overview

The system includes:

- **Frontend**: React app with Tailwind CSS, forms, dashboard, history, and assistant UI.
- **Backend**: Express API for tax calculations, Form 106 processing, PDF generation, reports (Supabase), and optional chat/LLM integration.
- **Document upload**: File upload, text extraction, and optional OCR paths.
- **Hebrew UI**: RTL layout and localized strings.

---

## Main Technologies

- React 18, Vite, TypeScript, Tailwind CSS
- Node.js, Express, Multer, Puppeteer / PDFMake, Tesseract.js, PDF-related tooling
- Supabase (auth, storage, reports) where configured
- ESLint, React Hook Form, and related tooling

---

## Project Structure

```
project-tax-return/
├── project/           # Frontend (Vite + React)
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/           # Express routes, tax logic, PDF helpers, services
│   └── package.json
├── server.js          # Vercel / Node entry (mounts Express app + static SPA)
├── api/               # Vercel serverless wrapper for /api routes (if used)
├── vercel.json        # Vercel build / routing
├── package.json       # Root scripts & shared backend deps for deploy
└── README.md
```

---

## Installation & Running

### Prerequisites

- Node.js (recommended 18+)
- npm

### Installation

1. Root dependencies (used for the deployed API and shared tooling):

   ```bash
   npm install
   ```

2. Frontend:

   ```bash
   cd project
   npm install
   ```

3. Backend (optional separate install if you run `backend` as its own app):

   ```bash
   cd backend
   npm install
   ```

4. Environment files (examples; adjust to your setup):

   - `project/.env` — e.g. `VITE_API_URL` (empty in production for same-origin `/api`)
   - `backend/.env` or root `.env` — Supabase, SMTP, optional `OPENAI_API_KEY`, etc.

### Running in Development

From the repo root, run frontend and API as you prefer:

```bash
# Terminal 1 — frontend (see project/package.json for exact script)
cd project
npm run dev
```

```bash
# Terminal 2 — API (if you use a local Express server; script names vary by setup)
cd backend
npm start
```

Frontend dev server is typically at `http://localhost:5173` with API proxied or pointed via `VITE_API_URL`.

### Building for Production

From the **repository root**:

```bash
npm run build
```

This builds the frontend into `project/dist` and copies assets for static hosting as defined in `scripts/copy-dist-to-public.js` / `vercel.json`.

---

## Files Not in Git

The following are **intentionally not tracked** (see `.gitignore`):

- **`chatbot_prompt.txt`** — local chat / assistant prompt notes
- **`ai-chatbot-tax-system.prompt.md`** — local system prompt draft
- **`project/.bolt/prompt`** — Bolt IDE local prompt file

Keep your own copies on your machine; they are excluded from GitHub to avoid publishing internal prompt text.

---

## Sensitive Files

- `.env` files, `node_modules`, build output, logs, and IDE folders are excluded by `.gitignore`.
- Do not commit API keys, SMTP passwords, or Supabase service keys.

---

## Deployment (Vercel)

The repo includes `vercel.json` and `server.js` for a single deployment that serves the SPA and `/api/*` on Node. Set production environment variables in the Vercel project dashboard (SMTP, Supabase, optional LLM keys, etc.).

---

## Usage Example

- Enter income and household details or upload a Form 106 (PDF/image where supported).
- Review the refund estimate on the dashboard, download a PDF, or send it by email (when SMTP is configured).
- Logged-in users can save reports and open them from **History**.

---

## Contributing

Contributions and issues are welcome. Please do not commit local prompt files or secrets—use the patterns in **Files Not in Git** and **Sensitive Files**.
