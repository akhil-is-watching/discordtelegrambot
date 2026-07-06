import { AlertTriangle, ArrowLeft, Check, Copy, ExternalLink, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createIntegration } from "@/lib/api/integrations";
import { ApiError } from "@/lib/api/errors";
import type { CreateIntegrationResponseDto, Platform, WebhookStatus } from "@/lib/api/types";
import { CHANNEL_META } from "@/pages/mods/channelMeta";
import { ConnectWizardSteps } from "@/components/mods/ConnectWizardSteps";

const CHANNEL_ICONS: Record<Platform, typeof Send> = {
  telegram: Send,
  discord: MessageCircle,
};

const DISCORD_COMMAND_PATTERN = /^[\w-]{1,32}$/;

function statusBadgeVariant(status: WebhookStatus): "success" | "warning" | "destructive" {
  if (status === "active") return "success";
  if (status === "failed") return "destructive";
  return "warning";
}

export function ChannelConnectModal({
  botId,
  channelId,
  onBack,
  onOpenChange,
  onConnected,
}: {
  botId: string;
  channelId: Platform;
  onBack: () => void;
  onOpenChange: (open: boolean) => void;
  onConnected: () => void;
}) {
  const config = CHANNEL_META[channelId];
  const Icon = CHANNEL_ICONS[channelId];

  const [botToken, setBotToken] = useState("");
  const [discordPublicKey, setDiscordPublicKey] = useState("");
  const [discordGuildId, setDiscordGuildId] = useState("");
  const [discordCommand, setDiscordCommand] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateIntegrationResponseDto | null>(null);
  const [copied, setCopied] = useState(false);

  const canSubmit =
    botToken.trim().length > 0 && (channelId === "telegram" || discordPublicKey.trim().length > 0);

  async function handleCopy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleSubmit() {
    setError(null);

    if (channelId === "discord" && discordCommand.trim() && !DISCORD_COMMAND_PATTERN.test(discordCommand.trim())) {
      setError("Slash command must be 1-32 characters: letters, numbers, - and _ only.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createIntegration(botId, {
        platform: channelId,
        botToken: botToken.trim(),
        ...(channelId === "discord"
          ? {
              discordPublicKey: discordPublicKey.trim(),
              discordGuildId: discordGuildId.trim() || undefined,
              discordCommand: discordCommand.trim() || undefined,
            }
          : {}),
      });
      setResult(created);
      onConnected();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not connect. Check the bot token and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Icon className="size-5" />
            </div>
            <DialogTitle>{config.label} connected</DialogTitle>
            <DialogDescription>
              {result.platformUsername ? `Connected as @${result.platformUsername}.` : "Your channel is set up."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Status</span>
            <Badge variant={statusBadgeVariant(result.webhookStatus)}>{result.webhookStatus}</Badge>
            {result.webhookStatus === "failed" && result.webhookError && (
              <span className="text-destructive text-xs">{result.webhookError}</span>
            )}
          </div>

          {channelId === "discord" && (
            <>
              <div className="flex flex-col gap-2">
                <Label>Interactions Endpoint URL</Label>
                <div className="flex items-center gap-2">
                  <Input readOnly value={result.webhookUrl} className="truncate" />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleCopy(result.webhookUrl)}
                    className="shrink-0"
                  >
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  Paste this into your Discord app's Developer Portal under "Interactions Endpoint URL". You won't
                  be able to view it again after closing this dialog.
                </p>
              </div>
              {result.discordInviteUrl && (
                <a
                  href={result.discordInviteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary flex items-center gap-1.5 text-sm hover:underline"
                >
                  Invite bot to your server
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </>
          )}

          <DialogFooter>
            <Button type="button" className="rounded-full" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
            <Icon className="size-5" />
          </div>
          <DialogTitle>{config.label}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <ConnectWizardSteps current="authentication" />

        <div className="flex flex-col gap-2">
          <Label htmlFor="bot-token">Bot Token</Label>
          <Input
            id="bot-token"
            placeholder="Enter Bot Token here..."
            value={botToken}
            onChange={e => setBotToken(e.target.value)}
          />
        </div>

        {channelId === "discord" && (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="discord-public-key">Public Key</Label>
              <Input
                id="discord-public-key"
                placeholder="Discord application public key"
                value={discordPublicKey}
                onChange={e => setDiscordPublicKey(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="discord-guild-id">Server (Guild) ID — optional</Label>
              <Input
                id="discord-guild-id"
                placeholder="Leave blank for all servers"
                value={discordGuildId}
                onChange={e => setDiscordGuildId(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Blank registers the slash command globally (~1 hour to propagate). Fill in one server's ID for
                instant registration there.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="discord-command">Slash Command — optional</Label>
              <Input
                id="discord-command"
                placeholder="ask"
                value={discordCommand}
                onChange={e => setDiscordCommand(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="rounded-xl border p-4">
          <p className="mb-2 font-medium">
            {channelId === "telegram" ? "How to get your bot token" : "How to get your credentials"}
          </p>
          <ol className="flex flex-col gap-1.5">
            {channelId === "telegram" ? (
              <>
                <li className="text-muted-foreground flex gap-2 text-sm">
                  <span>1.</span>
                  <span>Open Telegram and create a bot using @BotFather. Copy the bot token.</span>
                </li>
                <li className="text-muted-foreground flex gap-2 text-sm">
                  <span>2.</span>
                  <span>Paste the bot token above and save. We register the webhook with Telegram for you.</span>
                </li>
              </>
            ) : (
              <>
                <li className="text-muted-foreground flex gap-2 text-sm">
                  <span>1.</span>
                  <span>
                    In the Discord Developer Portal, create an application and a bot. Copy the bot token and the
                    application's Public Key.
                  </span>
                </li>
                <li className="text-muted-foreground flex gap-2 text-sm">
                  <span>2.</span>
                  <span>
                    Save here first — we'll give you a URL to paste back into the Developer Portal's "Interactions
                    Endpoint URL" field.
                  </span>
                </li>
              </>
            )}
          </ol>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onBack}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Button type="button" className="rounded-full" disabled={!canSubmit || submitting} onClick={handleSubmit}>
            {submitting ? "Connecting…" : "Save & Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
