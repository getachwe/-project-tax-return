export type AuthResponse = { access_token?: string } & Record<string, unknown>;

const BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:4000";

function getAuthHeader(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiSignIn(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiSignUp(email: string, password: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiResendConfirmation(email: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/auth/resend-confirmation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiResetPassword(email: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(await res.text());
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

