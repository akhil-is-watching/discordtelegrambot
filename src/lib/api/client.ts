import { getStoredToken } from "@/lib/auth/storage";
import { ApiError } from "@/lib/api/errors";

// Must be a literal `process.env.X` reference — Bun's client bundler only inlines
// literal references, not `import.meta.env` or indirect access through a variable.
// When the var isn't set at bundle time (no .env present), Bun leaves the raw
// `process.env...` expression in the client bundle, and `process` doesn't exist in
// the browser — so the whole expression must stay behind a `typeof process` guard
// (safe on undeclared globals) rather than referencing `process` directly.
const API_BASE_URL = typeof process !== "undefined" ? (process.env.BUN_PUBLIC_API_URL ?? "") : "";
const API_PREFIX = "/api/hub";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error: string;
}

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

/** Registered once by AuthProvider so any 401 anywhere triggers a logout. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler;
}

export interface ApiFetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { method = "GET", body, signal } = options;
  const isFormData = body instanceof FormData;

  const headers: Record<string, string> = {};
  if (!isFormData && body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const token = getStoredToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
      signal,
    });
  } catch {
    throw new ApiError("Could not reach the server. Check your connection and try again.", 0);
  }

  let envelope: ApiEnvelope<T> | null = null;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // fall through — envelope stays null, handled below
  }

  if (!envelope || !envelope.success || !response.ok) {
    const message = envelope?.error || response.statusText || "Request failed";
    if (response.status === 401) {
      unauthorizedHandler?.();
    }
    throw new ApiError(message, response.status);
  }

  return envelope.data;
}
