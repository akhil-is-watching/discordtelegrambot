import { apiFetch } from "@/lib/api/client";
import type { AuthUser } from "@/lib/api/types";

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
