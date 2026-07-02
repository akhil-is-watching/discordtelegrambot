import { apiFetch } from "@/lib/api/client";
import type {
  CreateIntegrationInput,
  CreateIntegrationResponseDto,
  HandoffConfigInput,
  SafeIntegration,
} from "@/lib/api/types";

export function listIntegrations(botId: string): Promise<SafeIntegration[]> {
  return apiFetch<SafeIntegration[]>(`/bots/${botId}/integrations`);
}

export function createIntegration(
  botId: string,
  input: CreateIntegrationInput,
): Promise<CreateIntegrationResponseDto> {
  return apiFetch<CreateIntegrationResponseDto>(`/bots/${botId}/integrations`, { method: "POST", body: input });
}

export function retryWebhook(botId: string, integrationId: string): Promise<SafeIntegration> {
  return apiFetch<SafeIntegration>(`/bots/${botId}/integrations/${integrationId}/webhook`, { method: "POST" });
}

export function updateHandoffConfig(
  botId: string,
  integrationId: string,
  input: HandoffConfigInput,
): Promise<SafeIntegration> {
  return apiFetch<SafeIntegration>(`/bots/${botId}/integrations/${integrationId}/handoff-config`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteIntegration(botId: string, integrationId: string): Promise<{ deleted: true }> {
  return apiFetch<{ deleted: true }>(`/bots/${botId}/integrations/${integrationId}`, { method: "DELETE" });
}
