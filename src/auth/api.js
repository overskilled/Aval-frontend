const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const TOKEN_KEY = "aval.token";
const ADMIN_TOKEN_KEY = "aval.adminToken";

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}
export function getAdminToken() {
  try { return localStorage.getItem(ADMIN_TOKEN_KEY); } catch { return null; }
}
export function setAdminToken(token) {
  try {
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
    else localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {}
}

class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request(path, { method = "GET", body, withAdminToken = false, headers = {} } = {}) {
  const finalHeaders = { "Content-Type": "application/json", ...headers };
  const token = getToken();
  if (token) finalHeaders.Authorization = `Bearer ${token}`;
  if (withAdminToken) {
    const adminTok = getAdminToken();
    if (adminTok) finalHeaders["X-Admin-Token"] = adminTok;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) ||
      `Request failed with status ${res.status}`;
    throw new ApiError(
      Array.isArray(message) ? message.join(", ") : String(message),
      res.status,
      data,
    );
  }
  return data;
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return text; }
}

export const api = {
  // Auth
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  me: () => request("/auth/me"),
  verifyEmail: (payload) => request("/auth/verify-email", { method: "POST", body: payload }),
  resendOtp: (payload) => request("/auth/resend-otp", { method: "POST", body: payload }),
  forgotPassword: (payload) => request("/auth/forgot-password", { method: "POST", body: payload }),
  resetPassword: (payload) => request("/auth/reset-password", { method: "POST", body: payload }),

  // Institutions
  getMyInstitution: () => request("/institutions/me"),
  upsertMyInstitution: (payload) => request("/institutions/me", { method: "PUT", body: payload }),

  // KYC
  getMyKyc: () => request("/kyc/me"),
  submitKyc: (payload) => request("/kyc", { method: "POST", body: payload }),

  // SKUs (manufacturer / government)
  listSkus: () => request("/skus"),
  createSku: (payload) => request("/skus", { method: "POST", body: payload }),
  getSku: (id) => request(`/skus/${id}`),
  updateSku: (id, payload) => request(`/skus/${id}`, { method: "PATCH", body: payload }),
  withdrawSku: (id) => request(`/skus/${id}`, { method: "DELETE" }),

  // Public verification — citizens scanning a QR.
  verifyCode: (token) => request("/verify", { method: "POST", body: { token } }),

  // Login OTP (2FA on every non-admin connection)
  verifyLoginOtp: ({ email, code }) =>
    request("/auth/verify-login-otp", {
      method: "POST",
      body: { email, code },
    }),

  // Batches
  listBatches: () => request("/batches"),
  createBatch: (payload) => request("/batches", { method: "POST", body: payload }),
  getBatch: (id) => request(`/batches/${id}`),
  generateBatch: (id) => request(`/batches/${id}/generate`, { method: "POST" }),
  // CSV stays a server-streamed download — small, simple, well-supported by
  // industrial label software.
  downloadBatchCsv: async (id) => {
    const token = getToken();
    const res = await fetch(`${API_URL}/batches/${id}/export.csv`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Download failed (${res.status})`);
    }
    const blob = await res.blob();
    triggerBlobDownload(blob, `batch-${id}.csv`);
  },
  // JSON for the client-side react-pdf renderer. Returns the full
  // reconstructed batch + codes payload.
  getBatchExport: (id) => request(`/batches/${id}/export.json`),

  // Workspaces
  listWorkspaces: () => request("/workspaces"),
  createWorkspace: (payload) => request("/workspaces", { method: "POST", body: payload }),
  getWorkspace: (id) => request(`/workspaces/${id}`),
  addMember: (id, payload) => request(`/workspaces/${id}/members`, { method: "POST", body: payload }),
  updateMember: (id, mid, payload) => request(`/workspaces/${id}/members/${mid}`, { method: "PATCH", body: payload }),
  removeMember: (id, mid) => request(`/workspaces/${id}/members/${mid}`, { method: "DELETE" }),
  listNotes: (id) => request(`/workspaces/${id}/notes`),
  createNote: (id, payload) => request(`/workspaces/${id}/notes`, { method: "POST", body: payload }),
  deleteNote: (id, noteId) => request(`/workspaces/${id}/notes/${noteId}`, { method: "DELETE" }),

  // Admin (requires X-Admin-Token + admin role)
  adminOverview: () => request("/admin/overview", { withAdminToken: true }),
  adminListUsers: () => request("/admin/users", { withAdminToken: true }),
  adminSetRole: (id, role) => request(`/admin/users/${id}/role`, { method: "PATCH", body: { role }, withAdminToken: true }),
  adminDeleteUser: (id) => request(`/admin/users/${id}`, { method: "DELETE", withAdminToken: true }),
  adminAuditLog: () => request("/admin/audit-log", { withAdminToken: true }),
  adminInstitutions: () => request("/admin/institutions", { withAdminToken: true }),
  adminListKyc: () => request("/admin/kyc", { withAdminToken: true }),
  adminGetKyc: (id) => request(`/admin/kyc/${id}`, { withAdminToken: true }),
  adminReviewKyc: (id, decision, rejectionReason) =>
    request(`/admin/kyc/${id}`, {
      method: "PATCH",
      body: { decision, rejectionReason },
      withAdminToken: true,
    }),

  adminListSkus: () => request("/admin/skus", { withAdminToken: true }),
  adminGetSku: (id) => request(`/admin/skus/${id}`, { withAdminToken: true }),
  adminReviewSku: (id, decision, rejectionReason) =>
    request(`/admin/skus/${id}`, {
      method: "PATCH",
      body: { decision, rejectionReason },
      withAdminToken: true,
    }),

  adminListBatches: () => request("/admin/batches", { withAdminToken: true }),
  adminGetBatch: (id) => request(`/admin/batches/${id}`, { withAdminToken: true }),
  adminReviewBatch: (id, decision, rejectionReason) =>
    request(`/admin/batches/${id}`, {
      method: "PATCH",
      body: { decision, rejectionReason },
      withAdminToken: true,
    }),
  adminDownloadBatchCsv: async (id) => {
    const token = getToken();
    const adminTok = getAdminToken();
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (adminTok) headers["X-Admin-Token"] = adminTok;
    const res = await fetch(`${API_URL}/admin/batches/${id}/export.csv`, { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Download failed (${res.status})`);
    }
    const blob = await res.blob();
    triggerBlobDownload(blob, `batch-${id}.csv`);
  },
  adminGetBatchExport: (id) =>
    request(`/admin/batches/${id}/export.json`, { withAdminToken: true }),
};

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export { ApiError };
