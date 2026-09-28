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

  const message =
    typeof details === "object" && details !== null && "detail" in details
      ? String((details as { detail?: unknown }).detail ?? response.statusText)
      : response.statusText || "Request failed";

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
