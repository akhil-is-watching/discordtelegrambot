import { apiFetch } from "@/lib/api/client";
import type { BotResponseDto, CreateBotInput, PaginatedBotsDto, UpdateBotInput } from "@/lib/api/types";

export function listBots(params: { limit?: number; cursor?: string } = {}): Promise<PaginatedBotsDto> {
  const search = new URLSearchParams();
  if (params.limit) search.set("limit", String(params.limit));
  if (params.cursor) search.set("cursor", params.cursor);
  const qs = search.toString();
  return apiFetch<PaginatedBotsDto>(`/bots${qs ? `?${qs}` : ""}`);
}

export function getBot(botId: string): Promise<BotResponseDto> {
  return apiFetch<BotResponseDto>(`/bots/${botId}`);
}

export function createBot(input: CreateBotInput): Promise<BotResponseDto> {
  return apiFetch<BotResponseDto>("/bots", { method: "POST", body: input });
}

export function updateBot(botId: string, input: UpdateBotInput): Promise<BotResponseDto> {
  return apiFetch<BotResponseDto>(`/bots/${botId}`, { method: "PATCH", body: input });
}

export function publishBot(botId: string): Promise<BotResponseDto> {
  return apiFetch<BotResponseDto>(`/bots/${botId}/publish`, { method: "POST" });
}

export function discardDraft(botId: string): Promise<BotResponseDto> {
  return apiFetch<BotResponseDto>(`/bots/${botId}/discard-draft`, { method: "POST" });
}

export function deleteBot(botId: string): Promise<{ deleted: true }> {
  return apiFetch<{ deleted: true }>(`/bots/${botId}`, { method: "DELETE" });
}
