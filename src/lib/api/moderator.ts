import { apiFetch } from "@/lib/api/client";
import type {
  CompanyDocState,
  ModerationRuleDef,
  ModeratorConfig,
  ModeratorHomeResponse,
  Platform,
  PlatformHandoffConfig,
  PromptGenerateResult,
  PromptStudioState,
  PromptTestState,
  SendMessageResult,
  TestMessage,
  TestUser,
  UpdateModeratorConfigInput,
  UpdatePlatformHandoffInput,
} from "@/lib/api/types";

const base = (botId: string) => `/bots/${botId}/moderator`;

// ---- Config + rules ----

export function getModeratorHome(botId: string, platform?: Platform): Promise<ModeratorHomeResponse> {
  const query = platform ? `?platform=${platform}` : "";
  return apiFetch<ModeratorHomeResponse>(`${base(botId)}${query}`);
}

export function updateConfig(
  botId: string,
  input: UpdateModeratorConfigInput,
): Promise<{ config: ModeratorConfig }> {
  return apiFetch<{ config: ModeratorConfig }>(`${base(botId)}/config`, { method: "PATCH", body: input });
}

export function updatePlatformHandoff(
  botId: string,
  platform: Platform,
  input: UpdatePlatformHandoffInput,
): Promise<{ handoff: { telegram: PlatformHandoffConfig; discord: PlatformHandoffConfig } }> {
  return apiFetch(`${base(botId)}/handoff/${platform}`, { method: "PATCH", body: input });
}

export function getRules(botId: string): Promise<ModerationRuleDef[]> {
  return apiFetch<ModerationRuleDef[]>(`${base(botId)}/rules`);
}

// ---- Company doc ----

export function getCompanyDoc(botId: string): Promise<CompanyDocState> {
  return apiFetch<CompanyDocState>(`${base(botId)}/company-doc`);
}

export function putCompanyDoc(botId: string, content: string): Promise<CompanyDocState> {
  return apiFetch<CompanyDocState>(`${base(botId)}/company-doc`, { method: "PUT", body: { content } });
}

// ---- Prompt studio ----

export function getPrompt(botId: string): Promise<PromptStudioState> {
  return apiFetch<PromptStudioState>(`${base(botId)}/prompt`);
}

export function getPromptDraft(botId: string): Promise<{ draftPrompt: string | null }> {
  return apiFetch<{ draftPrompt: string | null }>(`${base(botId)}/prompt/draft`);
}

export function generatePrompt(botId: string, request: string): Promise<PromptGenerateResult> {
  return apiFetch<PromptGenerateResult>(`${base(botId)}/prompt/generate`, { method: "POST", body: { request } });
}

export function putPromptDraft(botId: string, prompt: string, pointers?: string[]): Promise<PromptStudioState> {
  return apiFetch<PromptStudioState>(`${base(botId)}/prompt/draft`, { method: "PUT", body: { prompt, pointers } });
}

export function putPromptPointers(botId: string, pointers: string[]): Promise<PromptStudioState> {
  return apiFetch<PromptStudioState>(`${base(botId)}/prompt/pointers`, { method: "PUT", body: { pointers } });
}

export function publishPrompt(botId: string): Promise<PromptStudioState> {
  return apiFetch<PromptStudioState>(`${base(botId)}/prompt/publish`, { method: "POST" });
}

export function deletePromptDraft(botId: string): Promise<PromptStudioState> {
  return apiFetch<PromptStudioState>(`${base(botId)}/prompt/draft`, { method: "DELETE" });
}

export function resetPrompt(botId: string): Promise<PromptStudioState> {
  return apiFetch<PromptStudioState>(`${base(botId)}/prompt/reset`, { method: "POST" });
}

// ---- Prompt test sandbox ----

export function getTest(botId: string): Promise<PromptTestState> {
  return apiFetch<PromptTestState>(`${base(botId)}/test`);
}

export function createTestUser(botId: string, displayName: string, username?: string): Promise<TestUser> {
  return apiFetch<TestUser>(`${base(botId)}/test/users`, { method: "POST", body: { displayName, username } });
}

export function deleteTestUser(botId: string, userId: string): Promise<void> {
  return apiFetch<void>(`${base(botId)}/test/users/${userId}`, { method: "DELETE" });
}

export function getTestUserMessages(botId: string, userId: string): Promise<{ thread: TestMessage[]; warnings: number }> {
  return apiFetch<{ thread: TestMessage[]; warnings: number }>(`${base(botId)}/test/users/${userId}/messages`);
}

export function sendTestMessage(botId: string, userId: string, text: string): Promise<SendMessageResult> {
  return apiFetch<SendMessageResult>(`${base(botId)}/test/users/${userId}/messages`, {
    method: "POST",
    body: { text },
  });
}

export function clearTestUserMessages(botId: string, userId: string): Promise<TestMessage[]> {
  return apiFetch<TestMessage[]>(`${base(botId)}/test/users/${userId}/messages`, { method: "DELETE" });
}

export function resetTestSandbox(botId: string): Promise<PromptTestState> {
  return apiFetch<PromptTestState>(`${base(botId)}/test`, { method: "DELETE" });
}
