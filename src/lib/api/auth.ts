import { apiFetch } from "@/lib/api/client";
import type { AuthResponse, AuthUser } from "@/lib/api/types";

export function register(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", { method: "POST", body: { email, password } });
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", { method: "POST", body: { email, password } });
}

export function getMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/me");
}

export function updateOnboarding(input: {
  workspaceName: string;
  website?: string;
  teamSize?: string;
  userRole?: string;
  userGoal?: string;
}): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>("/auth/onboarding", { method: "PATCH", body: input });
}
