import { logger } from "./logger";

/**
 * The single door to the server.
 *
 * Everything goes through same-origin `/api/*` with cookie credentials: in
 * development Vite proxies to the API, in production Caddy serves both under
 * one origin. No token is ever read or stored by this code — the session lives
 * in HttpOnly cookies the browser attaches on its own.
 */

export interface ApiFieldError {
  path: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields: ApiFieldError[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Message for a given form field, when the server rejected it by name. */
  fieldError(path: string): string | undefined {
    return this.fields.find((field) => field.path === path)?.message;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  /** Set to false to treat a 401 as an answer instead of refreshing and replaying. */
  retryOnUnauthorised?: boolean;
}

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Trades the refresh cookie for a new access cookie.
 *
 * Concurrent callers share one in-flight request: a page that fires six queries
 * at once must not send six refreshes, which would rotate the token six times
 * and invalidate five of them.
 */
async function refreshSession(): Promise<boolean> {
  refreshInFlight ??= fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal, retryOnUnauthorised = true } = options;

  const response = await fetch(path, {
    method,
    credentials: "include",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    ...(signal ? { signal } : {}),
  });

  // An expired access token is normal, not an error: refresh once and replay.
  if (response.status === 401 && retryOnUnauthorised && !path.startsWith("/api/auth/")) {
    if (await refreshSession()) {
      return apiRequest<T>(path, { ...options, retryOnUnauthorised: false });
    }
  }

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = (payload as { error?: string } | null)?.error ?? `erreur ${response.status}`;
    const fields =
      (payload as { details?: { fields?: ApiFieldError[] } } | null)?.details?.fields ?? [];
    logger.debug("api error", method, path, response.status, message);
    throw new ApiError(response.status, message, fields);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => apiRequest<T>(path, signal ? { signal } : {}),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "DELETE", body }),
};

/** Builds `?a=1&b=2`, dropping empty values so filters stay optional. */
export function queryString(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}
