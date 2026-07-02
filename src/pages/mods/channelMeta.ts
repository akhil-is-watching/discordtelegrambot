import type { Platform } from "@/lib/api/types";

export interface ChannelMeta {
  id: Platform;
  label: string;
  description: string;
}

export const CHANNEL_META: Record<Platform, ChannelMeta> = {
  telegram: {
    id: "telegram",
    label: "Telegram",
    description: "Engage with your audience in real time.",
  },
  discord: {
    id: "discord",
    label: "Discord",
    description: "Connect your agent to Discord servers and direct messages.",
  },
};
