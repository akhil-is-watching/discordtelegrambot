import { apiFetch } from "@/lib/api/client";
import type { LlmModelOptionDto } from "@/lib/api/types";

export function getLlmModels(): Promise<LlmModelOptionDto[]> {
  return apiFetch<LlmModelOptionDto[]>("/x/settings/llm/models");
}
