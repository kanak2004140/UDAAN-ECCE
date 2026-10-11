import { clearSession } from "@/lib/auth/session";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions<TBody = unknown> {
  method?: HttpMethod;
  body?: TBody;
  headers?: Record<string, string>;
  params?: QueryParams;
  authToken?: string;
}

export class ApiError extends Error {
  status: number;
  statusText: string;
  details?: unknown;

  constructor(message: string, status: number, statusText: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.details = details;
  }
}

interface ValidationItem {
  type?: string;
  loc?: unknown[];
  msg?: string;
  ctx?: { min_length?: number; max_length?: number };
}

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  email: "Email",
  password: "Password",
  date_of_birth: "Birthday",
  role: "Role",
};

/** FastAPI reports a rejected request as a list of problems; turn it into one plain sentence. */
function describeValidationErrors(items: ValidationItem[]): string {
  const sentences = items.map((item) => {
    const field = String(item.loc?.[item.loc.length - 1] ?? "");
    const label = FIELD_LABELS[field] ?? "That";
    if (item.type === "string_too_short" && item.ctx?.min_length) {
      return `${label} must be at least ${item.ctx.min_length} characters.`;
    }
    if (item.type === "string_too_long" && item.ctx?.max_length) {
      return `${label} must be at most ${item.ctx.max_length} characters.`;
    }
    if (field === "email") return "Please enter a valid email address.";
    return `${label}: ${(item.msg ?? "is not valid").replace(/^Value error, /, "")}`;
  });
  return Array.from(new Set(sentences)).join(" ");
}

function messageFromDetails(details: unknown, fallback: string): string {
  if (typeof details !== "object" || details === null || !("detail" in details)) return fallback;
  const detail = (details as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return describeValidationErrors(detail as ValidationItem[]) || fallback;
  return fallback;
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";
}

function getStoredAuthToken(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage.getItem("ecce_access_token") ?? undefined;
}

function buildUrl(path: string, params?: QueryParams): string {
  const baseUrl = getBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(normalizedPath, `${baseUrl}/`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return parseResponse<T>(response);
  }

  let details: unknown = undefined;
  const contentType = response.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      details = await response.json();
    } else {
      details = await response.text();
    }
  } catch {
    details = undefined;
  }

  const message = messageFromDetails(details, response.statusText || "Request failed");

  throw new ApiError(message, response.status, response.statusText, details);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = "GET",
    body,
    headers = {},
    params,
    authToken = getStoredAuthToken(),
  } = options;

  const requestHeaders: Record<string, string> = { ...headers };

  if (authToken) {
    requestHeaders.Authorization = `Bearer ${authToken}`;
  }

  const hasBody = body !== undefined && body !== null && method !== "GET" && method !== "DELETE";

  if (hasBody && !(body instanceof FormData) && !requestHeaders["Content-Type"]) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(buildUrl(path, params), {
    method,
    headers: requestHeaders,
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  // The saved sign-in was refused (expired, or the account is gone): forget it,
  // so the app stops sending a dead token and shows the signed-out state.
  if (response.status === 401 && authToken && authToken === getStoredAuthToken()) {
    clearSession();
  }

  return handleResponse<T>(response);
}

export const api = {
  get<T>(path: string, options: Omit<RequestOptions, "method" | "body"> = {}) {
    return apiRequest<T>(path, { ...options, method: "GET" });
  },

  post<T>(path: string, body?: unknown, options: Omit<RequestOptions, "method" | "body"> = {}) {
    return apiRequest<T>(path, { ...options, method: "POST", body });
  },

  put<T>(path: string, body?: unknown, options: Omit<RequestOptions, "method" | "body"> = {}) {
    return apiRequest<T>(path, { ...options, method: "PUT", body });
  },

  patch<T>(path: string, body?: unknown, options: Omit<RequestOptions, "method" | "body"> = {}) {
    return apiRequest<T>(path, { ...options, method: "PATCH", body });
  },

  delete<T>(path: string, options: Omit<RequestOptions, "method" | "body"> = {}) {
    return apiRequest<T>(path, { ...options, method: "DELETE" });
  },
};

export default api;
