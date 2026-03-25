# Tax Return & Refund Calculator (Israel / Hebrew UI)

Full-stack application for income tax refund estimation, Form 106 ingestion, PDF output, and authenticated report storage. The product surface is Hebrew (RTL); core tax logic and APIs are implemented in Node.js.

**Production:** [https://project-tax-return.vercel.app](https://project-tax-return.vercel.app)

---

## Scope

| Layer | Responsibility |
|--------|----------------|
| **Client** (`project/`) | React 18, Vite 5, TypeScript, Tailwind. Multi-step flows, dashboard, history, optional assistant UI. |
| **API** (`backend/`, mounted by root `server.js`) | Express routes: tax calculation, Form 106 pipeline, PDF generation, reports CRUD (Supabase), SMTP email, optional LLM/chat. |
| **Hosting** | Vercel: static SPA + Node function; `vercel.json` routes `/api/*` to `server.js`. |

---

## Tech Stack

- **Frontend:** React, React Router, Headless UI, Tailwind CSS, lucide-react  
- **Backend:** Express, multer (uploads under `os.tmpdir()` on serverless), pdf-parse / optional pdf2pic + OCR paths, Puppeteer with PDFMake fallback, Supabase JS client  
- **Auth & data:** Supabase Auth; Storage bucket for generated PDFs; Postgres-backed `reports` where configured  
- **Tooling:** Jest (frontend), npm workspaces-style layout (root + `project/` + `backend/`)

---

## Repository Layout

```
.
├── project/                 # Vite app (npm scripts: dev, build)
├── backend/                 # Express app (local: npm start → port 4000)
├── server.js                # Production entry: createApp() + static SPA + catch-all
├── api/                     # Vercel catch-all handler for /api (if used in deployment)
├── scripts/                 # e.g. copy-dist-to-public for CI
├── vercel.json
├── package.json             # Root install + `npm run build` for deploy bundle
└── README.md
```

Files intentionally **not** tracked (see `.gitignore`): local prompt drafts, `.env`, build artifacts, `node_modules`.

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)  
- **npm**  
- **Supabase** project (Auth + Storage + DB) for full feature parity in production  
- **SMTP** (or Mailtrap in development) for outbound email  
- Optional: **OpenAI** API key for LLM-assisted Form 106 / chat features  

---

## Environment Variables

Configure at least the following for production (e.g. Vercel project settings). Local development typically uses `backend/.env` and/or root `.env` loaded via `dotenv`.

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Client-safe Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only: storage, row-level operations |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (optional `SMTP_SECURE`) | Outbound mail |
| `FRONTEND_URL` | OAuth redirects, email links |
| `OPENAI_API_KEY`, `LLM_ENABLED` | Optional extraction / chat |
| `AI_AGENTS_ENABLED` | Optional post-calculation pipeline |

Never commit secrets. The repository excludes `.env*` via `.gitignore`.

---

## Local Development

### 1. Install dependencies

```bash
# API + shared root deps (matches typical Vercel install)
npm install

cd project && npm install && cd ..
cd backend && npm install && cd ..
```

### 2. Run API and client

**Option A — single command from `project/`** (uses `concurrently`):

```bash
cd project
npm run start:all
```

This starts Vite (default `http://localhost:5173`) and `backend` on `http://localhost:4000`.

**Option B — two terminals**

```bash
# Terminal 1
cd backend && npm start

# Terminal 2
cd project && npm run dev
```

Point the frontend at the API:

- Leave `VITE_API_URL` unset **or** set `VITE_API_URL=http://localhost:4000` in `project/.env` if the client must target a non-default host.

### 3. Production build (local verification)

From repository root:

```bash
npm run build
```

Produces a deployable artifact consistent with `vercel.json` (frontend build copied for static serving).

---

## API Overview (non-exhaustive)

| Method / Path | Description |
|---------------|-------------|
| `POST /api/calculate-tax` | Core refund calculation |
| `POST /api/process-106` | Upload + extract Form 106 |
| `POST /api/generate-pdf` | PDF generation; optional Supabase upload |
| `POST /api/send-tax-return-email` | Attach PDF, send via SMTP |
| `GET/POST /api/reports` | List/create reports (authenticated) |
| `POST /api/auth/*` | Supabase-backed auth flows |

Health check where enabled: `GET /health`.

---

## Deployment Notes (Vercel)

- Set all required environment variables in the Vercel dashboard.  
- Ensure OAuth redirect URLs in Supabase match the deployed origin (e.g. `https://project-tax-return.vercel.app/auth/callback`).  
- PDF generation prefers Puppeteer; the codebase falls back to PDFMake when Chromium is unavailable in the runtime.

---
