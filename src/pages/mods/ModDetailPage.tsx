import { MessageCircle, Pencil, Rocket, Send } from "lucide-react";
import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { publishBot, updateBot } from "@/lib/api/bots";
import { ApiError } from "@/lib/api/errors";
import { useModDetail } from "@/pages/mods/useModDetail";

const TOP_TABS = [
  { value: "overview", label: "Overview" },
  { value: "train", label: "Train" },
  { value: "channels", label: "Channels" },
];

export function ModDetailPage() {
  const { botId } = useParams<{ botId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const ctx = useModDetail(botId!);
  const [publishing, setPublishing] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  if (ctx.loading) {
    return (
      <div className="flex flex-col gap-4 p-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (ctx.error || !ctx.bot) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <p className="text-destructive text-sm">{ctx.error ?? "Mod not found."}</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/mods")}>
          Back to Mods
        </Button>
      </div>
    );
  }

  const bot = ctx.bot;
  const activeTab = TOP_TABS.find(t => location.pathname.includes(`/${t.value}`))?.value ?? "overview";

  async function handlePublish() {
    setPublishing(true);
    try {
      await publishBot(bot!._id);
      toast.success("Published");
      ctx.refetchBot();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not publish.");
    } finally {
      setPublishing(false);
    }
  }

  function startRename() {
    setNameDraft(bot!.name);
    setRenaming(true);
  }

  async function saveRename() {
    setRenaming(false);
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === bot!.name) return;
    try {
      await updateBot(bot!._id, { name: trimmed });
      ctx.refetchBot();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not rename Mod.");
    }
  }

  const connectedTelegram = ctx.integrations.some(i => i.platform === "telegram");
  const connectedDiscord = ctx.integrations.some(i => i.platform === "discord");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between border-b px-8 py-6">
        <div>
          <div className="text-muted-foreground mb-2 text-sm">
            <Link to="/mods" className="hover:text-foreground">
              Mods
            </Link>{" "}
            <span className="mx-1">&gt;</span> <span className="text-foreground">{bot.name}</span>
          </div>
          <div className="flex items-center gap-2.5">
            {renaming ? (
              <Input
                autoFocus
                value={nameDraft}
                onChange={e => setNameDraft(e.target.value)}
                onBlur={saveRename}
                onKeyDown={e => {
                  if (e.key === "Enter") saveRename();
                  if (e.key === "Escape") setRenaming(false);
                }}
                className="h-8 max-w-64 text-2xl font-semibold"
              />
            ) : (
              <button type="button" className="group flex items-center gap-2" onClick={startRename}>
                <h1 className="text-2xl font-semibold">{bot.name}</h1>
                <Pencil className="text-muted-foreground size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            )}
            {bot.published ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-500">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Live
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
                Draft
              </span>
            )}
            {bot.published && bot.hasUnpublishedChanges && (
              <span className="text-muted-foreground text-xs">Unpublished changes</span>
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Last updated: {new Date(bot.updatedAt).toLocaleString()}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">Deployed Channels</span>
            <div className="flex items-center gap-2">
              <ChannelPill icon={Send} label="Telegram" connected={connectedTelegram} />
              <ChannelPill icon={MessageCircle} label="Discord" connected={connectedDiscord} />
            </div>
          </div>
          <Button size="sm" className="rounded-full" disabled={publishing} onClick={handlePublish}>
            <Rocket className="size-4" />
            {publishing ? "Publishing…" : "Publish"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={v => navigate(`/mods/${bot._id}/${v}`)} className="gap-0">
        <TabsList className="border-b px-8">
          {TOP_TABS.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex-1 overflow-y-auto p-8">
        <Outlet context={ctx} />
      </div>
    </div>
  );
}

function ChannelPill({
  icon: Icon,
  label,
  connected,
}: {
  icon: typeof Send;
  label: string;
  connected: boolean;
}) {
  return (
    <span
      className={
        connected
          ? "flex items-center gap-1.5 rounded-full border border-transparent bg-accent px-3 py-1 text-xs text-foreground"
          : "text-muted-foreground border-border/60 flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs"
      }
    >
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}
