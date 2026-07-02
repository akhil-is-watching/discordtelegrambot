import { useCallback, useEffect, useState } from "react";
import { getBot } from "@/lib/api/bots";
import { ApiError } from "@/lib/api/errors";
import { listIntegrations } from "@/lib/api/integrations";
import type { BotResponseDto, SafeIntegration } from "@/lib/api/types";

export interface ModDetailContext {
  botId: string;
  bot: BotResponseDto | null;
  integrations: SafeIntegration[];
  loading: boolean;
  error: string | null;
  refetchBot: () => void;
  refetchIntegrations: () => void;
}

export function useModDetail(botId: string): ModDetailContext {
  const [bot, setBot] = useState<BotResponseDto | null>(null);
  const [integrations, setIntegrations] = useState<SafeIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetchBot = useCallback(() => {
    getBot(botId)
      .then(setBot)
      .catch(err => setError(err instanceof ApiError ? err.message : "Could not load Mod."));
  }, [botId]);

  const refetchIntegrations = useCallback(() => {
    listIntegrations(botId)
      .then(setIntegrations)
      .catch(() => setIntegrations([]));
  }, [botId]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([getBot(botId), listIntegrations(botId)])
      .then(([botRes, integrationsRes]) => {
        setBot(botRes);
        setIntegrations(integrationsRes);
      })
      .catch(err => setError(err instanceof ApiError ? err.message : "Could not load Mod."))
      .finally(() => setLoading(false));
  }, [botId]);

  return { botId, bot, integrations, loading, error, refetchBot, refetchIntegrations };
}
