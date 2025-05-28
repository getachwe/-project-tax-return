# Hebrew Tax Refund Calculator

A modern fullstack system for tax refund calculation, including a React (Vite + Tailwind) frontend and a Node.js (Express) backend.  
The system enables tax refund calculations, document uploads, PDF generation, and a user-friendly Hebrew interface.

---

## Table of Contents

- [Overview](#overview)
- [Main Technologies](#main-technologies)
- [Project Structure](#project-structure)
- [Installation & Running](#installation--running)
- [Sensitive Files](#sensitive-files)
- [Usage Example](#usage-example)
- [Contributing](#contributing)

---

## Overview

The system includes:

- **Frontend**: Modern React app with Tailwind CSS, advanced forms, and business logic.
- **Backend**: Express server for tax calculations, PDF generation, file processing, and more.
- **Document Upload**: Supports file upload, OCR, and PDF report generation.
- **Hebrew UI**: RTL interface, accessibility, and modern design.

---

## Main Technologies

- React 18, Vite, TypeScript, Tailwind CSS, ShadCN/UI
- Node.js, Express, Multer, Puppeteer, Tesseract.js, PDFKit, PDFMake
- ESLint, Zod, React Hook Form, and more

---

## Project Structure

```
project-tax-return/
│
├── project/      # Frontend (React)
│   ├── src/
│   ├── public/
│   ├── index.html
│   └── ...
│
├── backend/      # Backend (Node.js/Express)
│   ├── server.js
│   ├── pdfGenerator.js
│   ├── ...
│
├── package.json
├── package-lock.json
└── README.md
```

---

## Installation & Running

### Prerequisites

- Node.js (recommended 18+)
- npm

### Installation

1. Install dependencies for both frontend and backend:

   ```bash
   cd project
   npm install
   cd ../backend
   npm install
   cd ..
   ```

2. Create environment files if needed:
   - `project/.env` - Frontend environment variables (e.g. VITE_API_URL)
   - `backend/.env` - Backend environment variables (e.g. DB_CONNECTION_STRING, API_KEY)

### Running in Development

1. Go to the project root:

   ```bash
   cd project-tax-return
   ```

2. Start both servers in parallel:

   ```bash
   cd project
   npm run start:all
   ```

   Or manually:

   ```bash
   # Terminal 1
   cd project
   npm run dev

   # Terminal 2
   cd backend
   npm start
   ```

3. The app will be available at:
   ```
   http://localhost:5173
   ```

### Building Frontend for Production

```bash
cd project
npm run build
```

---

## Sensitive Files

- Files such as `.env`, `node_modules`, `uploads`, `temp`, `pdfs`, `dist`, log files, and IDE/system folders are automatically excluded and not pushed to GitHub.
- Do not commit API keys, passwords, or any other sensitive information.

---

## Usage Example

- Fill out the form with your income and family details.
- Upload relevant documents (Form 106, receipts).
- Get your tax refund calculation, download a PDF report, or send it by email.

---

## Contributing

We welcome any contributions, feedback, or pull requests!  
For questions, please open an issue in the repository.
