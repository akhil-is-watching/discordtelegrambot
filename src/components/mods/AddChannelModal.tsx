import { Boxes, ChevronRight, MessageCircle, Send } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConnectWizardSteps } from "@/components/mods/ConnectWizardSteps";
import { CHANNEL_META } from "@/pages/mods/channelMeta";
import type { Platform } from "@/lib/api/types";

const CHANNEL_ICONS: Record<Platform, typeof Send> = {
  telegram: Send,
  discord: MessageCircle,
};

export function AddChannelModal({
  open,
  onOpenChange,
  onPickChannel,
  connectedPlatforms,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPickChannel: (channelId: Platform) => void;
  connectedPlatforms: Set<Platform>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
            <Boxes className="size-5" />
          </div>
          <DialogTitle>Channels</DialogTitle>
          <DialogDescription>
            Deploy your mod to Telegram or Discord so it can start responding to users and handling conversations in
            real time.
          </DialogDescription>
        </DialogHeader>

        <ConnectWizardSteps current="connect" />

        <div className="flex flex-col gap-3">
          {(Object.keys(CHANNEL_META) as Platform[]).map(id => {
            const config = CHANNEL_META[id];
            const Icon = CHANNEL_ICONS[id];
            const connected = connectedPlatforms.has(id);
            return (
              <button
                key={id}
                type="button"
                disabled={connected}
                onClick={() => onPickChannel(id)}
                className="flex items-center justify-between rounded-xl border p-4 text-left transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <Icon className="size-5" />
                  <div>
                    <p className="font-medium">
                      {config.label}
                      {connected && <span className="text-muted-foreground ml-2 text-xs">Connected</span>}
                    </p>
                    <p className="text-muted-foreground text-sm">{config.description}</p>
                  </div>
                </div>
                <ChevronRight className="text-muted-foreground size-4" />
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
