import { Boxes, MessageCircle, RotateCw, Send, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";
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
import { AddChannelModal } from "@/components/mods/AddChannelModal";
import { ChannelConnectModal } from "@/components/mods/ChannelConnectModal";
import { ChannelHandoffModal } from "@/components/mods/ChannelHandoffModal";
import { deleteIntegration, retryWebhook } from "@/lib/api/integrations";
import { ApiError } from "@/lib/api/errors";
import type { Platform, SafeIntegration, WebhookStatus } from "@/lib/api/types";
import type { ModDetailContext } from "@/pages/mods/useModDetail";

const CHANNEL_ICONS: Record<Platform, typeof Send> = {
  telegram: Send,
  discord: MessageCircle,
};

function statusBadgeVariant(status: WebhookStatus): "success" | "warning" | "destructive" {
  if (status === "active") return "success";
  if (status === "failed") return "destructive";
  return "warning";
}

export function ChannelsTab() {
  const ctx = useOutletContext<ModDetailContext>();
  const [addChannelOpen, setAddChannelOpen] = useState(false);
  const [handoffChannel, setHandoffChannel] = useState<Platform | null>(null);
  const [editHandoffChannel, setEditHandoffChannel] = useState<Platform | null>(null);
  const [connectingChannel, setConnectingChannel] = useState<Platform | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SafeIntegration | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);

  const bot = ctx.bot!;
  const connected = ctx.integrations;
  const connectedPlatforms = new Set(connected.map(i => i.platform));

  async function handleRetry(integration: SafeIntegration) {
    setRetrying(integration._id);
    try {
      await retryWebhook(bot._id, integration._id);
      toast.success("Webhook re-registered");
      ctx.refetchIntegrations();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not retry webhook.");
    } finally {
      setRetrying(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteIntegration(bot._id, pendingDelete._id);
      toast.success("Disconnected");
      setPendingDelete(null);
      ctx.refetchIntegrations();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not disconnect.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {connected.length === 0 ? (
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border p-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
            <Boxes className="size-6" />
          </div>
          <h2 className="text-lg font-semibold">No Channels Connected Yet</h2>
          <p className="text-muted-foreground text-sm">
            Deploy your mod to Telegram or Discord so it can start responding to users and handling conversations in
            real time.
          </p>
          {bot.published ? (
            <Button className="rounded-full" onClick={() => setAddChannelOpen(true)}>
              + Add Channel
            </Button>
          ) : (
            <p className="text-muted-foreground text-xs">Publish your Mod first to connect a channel.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {connected.map(integration => {
            const Icon = CHANNEL_ICONS[integration.platform];
            return (
              <div key={integration._id} className="flex items-center justify-between rounded-xl border p-4">
                <div className="flex items-center gap-3">
                  <Icon className="size-5" />
                  <div>
                    <span className="font-medium capitalize">{integration.platform}</span>
                    {integration.platformUsername && (
                      <span className="text-muted-foreground ml-2 text-sm">@{integration.platformUsername}</span>
                    )}
                    {integration.webhookStatus === "failed" && integration.webhookError && (
                      <p className="text-destructive text-xs">{integration.webhookError}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusBadgeVariant(integration.webhookStatus)}>{integration.webhookStatus}</Badge>
                  {integration.webhookStatus === "failed" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={retrying === integration._id}
                      onClick={() => handleRetry(integration)}
                    >
                      <RotateCw className="size-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Edit team & handoff"
                    onClick={() => setEditHandoffChannel(integration.platform)}
                  >
                    <Users className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setPendingDelete(integration)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {bot.published && connectedPlatforms.size < 2 && (
            <Button variant="outline" className="w-fit rounded-full" onClick={() => setAddChannelOpen(true)}>
              + Add Channel
            </Button>
          )}
        </div>
      )}

      <AddChannelModal
        open={addChannelOpen}
        onOpenChange={setAddChannelOpen}
        connectedPlatforms={connectedPlatforms}
        onPickChannel={platform => {
          setAddChannelOpen(false);
          setHandoffChannel(platform);
        }}
      />

      {handoffChannel && (
        <ChannelHandoffModal
          botId={bot._id}
          channelId={handoffChannel}
          onBack={() => {
            setHandoffChannel(null);
            setAddChannelOpen(true);
          }}
          onOpenChange={open => {
            if (!open) setHandoffChannel(null);
          }}
          onContinue={() => {
            setConnectingChannel(handoffChannel);
            setHandoffChannel(null);
          }}
        />
      )}

      {editHandoffChannel && (
        <ChannelHandoffModal
          botId={bot._id}
          channelId={editHandoffChannel}
          mode="edit"
          onOpenChange={open => {
            if (!open) setEditHandoffChannel(null);
          }}
          onContinue={() => {
            toast.success("Handoff settings saved");
            setEditHandoffChannel(null);
          }}
        />
      )}

      {connectingChannel && (
        <ChannelConnectModal
          botId={bot._id}
          channelId={connectingChannel}
          onBack={() => {
            setHandoffChannel(connectingChannel);
            setConnectingChannel(null);
          }}
          onOpenChange={open => {
            if (!open) setConnectingChannel(null);
          }}
          onConnected={() => {
            ctx.refetchIntegrations();
          }}
        />
      )}

      <Dialog open={pendingDelete !== null} onOpenChange={open => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect {pendingDelete?.platform}?</DialogTitle>
            <DialogDescription>
              Your Mod will stop responding on this channel until you reconnect it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={deleting} onClick={confirmDelete}>
              {deleting ? "Disconnecting…" : "Disconnect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
