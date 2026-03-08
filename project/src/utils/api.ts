export type AuthResponse = { access_token?: string } & Record<string, unknown>;

// Prefer env var when provided. If running Vite dev server (port 5173),
// default to the local backend at http://localhost:4000. In production, use relative /api.
const isBrowser = typeof window !== "undefined";
const isLocalHost = isBrowser &&
  (location.hostname === "localhost" || location.hostname === "127.0.0.1");
const BASE_URL = (import.meta as any).env?.VITE_API_URL || (isLocalHost ? "http://localhost:4000" : "");

function getAuthHeader(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const ERROR_MESSAGES: Record<string, string> = {
  "User already registered": "האימייל כבר רשום. נסה להתחבר במקום",
  "Invalid login credentials": "אימייל או סיסמה שגויים. אם הרגע נרשמת – אשר קודם את המייל (בדוק גם בספאם)",
  "Email not confirmed": "אנא אשר את האימייל (בדוק תיבת הדואר וגם בספאם)",
};

async function parseApiError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const j = JSON.parse(text);
    const err = j?.error || text;
    return ERROR_MESSAGES[err] || err;
  } catch {
    return text;
  }
}

export async function apiSignIn(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await parseApiError(res));
  return res.json();
}

export async function apiSignUp(email: string, password: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await parseApiError(res));
  return res.json();
}

export async function apiResendConfirmation(email: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/auth/resend-confirmation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(await parseApiError(res));
  return res.json();
}

export async function apiResetPassword(email: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(await parseApiError(res));
  return res.json();
}

export async function apiGetProfile(token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/profile`, {
    headers: { ...getAuthHeader(token) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiUpdateProfile(token: string, firstName?: string, lastName?: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader(token) },
    body: JSON.stringify({ firstName, lastName }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiExportMyData(token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/export/my-data`, {
    headers: { ...getAuthHeader(token) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiDeleteMyData(token: string, deleteAccount = false): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/delete/my-data?deleteAccount=${deleteAccount}`, {
    method: "DELETE",
    headers: { ...getAuthHeader(token) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Google OAuth API
export async function apiGoogleSignIn(): Promise<{ url: string }> {
  const res = await fetch(`${BASE_URL}/api/auth/google`, {
    method: "GET",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiGoogleCallback(code: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/google/callback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}


// Reports API
export type ReportItem = {
  id: string;
  file_name: string;
  year: number | null;
  created_at: string;
  taxData?: Record<string, unknown>;
  calculationResult?: Record<string, unknown>;
};

export async function apiGetReports(
  token: string,
  opts: { year?: number; q?: string; page?: number; pageSize?: number } = {}
): Promise<{ items: ReportItem[]; total: number; page: number; pageSize: number }> {
  const params = new URLSearchParams();
  if (opts.year) params.set("year", String(opts.year));
  if (opts.q) params.set("q", opts.q);
  if (opts.page) params.set("page", String(opts.page));
  if (opts.pageSize) params.set("pageSize", String(opts.pageSize));
  const res = await fetch(`${BASE_URL}/api/reports?${params.toString()}`, {
    headers: { ...getAuthHeader(token) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiCreateReport(
  token: string,
  payload: { taxData: any; calculationResult?: any; fileName?: string; year?: number }
): Promise<ReportItem> {
  const res = await fetch(`${BASE_URL}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader(token) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiGetReportDownloadUrl(token: string, id: string): Promise<{ url: string }> {
  const res = await fetch(`${BASE_URL}/api/reports/${id}/download`, {
    headers: { ...getAuthHeader(token) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiGetReportViewUrl(token: string, id: string): Promise<{ url: string }> {
  const res = await fetch(`${BASE_URL}/api/reports/${id}/view`, {
    headers: { ...getAuthHeader(token) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiDeleteReport(token: string, id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE_URL}/api/reports/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeader(token) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Process 106 file upload
export async function apiProcess106(file: File): Promise<{
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  missingFields?: string[];
}> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/api/process-106`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Send tax return email
export async function apiSendTaxReturnEmail(
  token: string,
  taxData: any,
  email: string,
  reportId?: string
): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE_URL}/api/send-tax-return-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(token),
    },
    body: JSON.stringify({ taxData, email, reportId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Calculate tax
export async function apiCalculateTax(taxData: any): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/calculate-tax`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(taxData),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Generate PDF
export async function apiGeneratePdf(
  token: string,
  taxData: any,
  saveToStorage = false
): Promise<{ blob: Blob; reportId?: string }> {
  const res = await fetch(`${BASE_URL}/api/generate-pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(token),
    },
    body: JSON.stringify({ ...taxData, saveToStorage }),
  });
  if (!res.ok) throw new Error(await res.text());
  const blob = await res.blob();
  const reportId = res.headers.get("X-Report-ID") || undefined;
  return { blob, reportId };
}
