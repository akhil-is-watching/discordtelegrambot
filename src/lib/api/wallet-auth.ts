import { ApiError } from "@/lib/api/errors";

// Same host as the hub API (see client.ts) — different service, different path prefix.
const NOAH_AUTH_BASE_URL = "https://gcp-stage.plena.finance";
const NOAH_AUTH_PREFIX = "/studio/user/auth";

export type WalletChain = "SOLANA" | "EVM";

export interface WalletNonce {
  nonce: string;
  expiresAt: number;
}

export interface WalletLoginResult {
  accessToken: string;
  refreshToken?: string;
}

interface NoahAuthEnvelope<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

async function noahAuthFetch<T>(
  path: string,
  options: { method?: "GET" | "POST"; body?: unknown } = {},
): Promise<T> {
  const { method = "GET", body } = options;

  let response: Response;
  try {
    response = await fetch(`${NOAH_AUTH_BASE_URL}${NOAH_AUTH_PREFIX}${path}`, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Could not reach the wallet auth service. Check your connection and try again.", 0);
  }

  let envelope: NoahAuthEnvelope<T> | null = null;
  try {
    envelope = (await response.json()) as NoahAuthEnvelope<T>;
  } catch {
    // fall through — envelope stays null, handled below
  }

  if (!envelope || !envelope.success || envelope.data === null || !response.ok) {
    const message = envelope?.error || response.statusText || "Wallet auth request failed";
    throw new ApiError(message, response.status);
  }

  return envelope.data;
}

/**
 * Fetches a login nonce for an already-registered wallet. 404s with
 * `"walletAddress doesnt exits"` when the wallet has never signed up on trynoah.ai.
 */
export function getWalletNonce(walletAddress: string, chain: WalletChain): Promise<WalletNonce> {
  const params = new URLSearchParams({ walletAddress, chain });
  return noahAuthFetch<WalletNonce>(`/nonce?${params.toString()}`);
}

export function loginWithWallet(input: {
  walletAddress: string;
  signature: string;
  chain: WalletChain;
  issuedAt: string;
}): Promise<WalletLoginResult> {
  return noahAuthFetch<WalletLoginResult>("/login?platform=NOAH", { method: "POST", body: input });
}
