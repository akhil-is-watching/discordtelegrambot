import { MoreVertical, Plus, Trash2, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateModModal } from "@/components/mods/CreateModModal";
import { deleteBot, listBots } from "@/lib/api/bots";
import { ApiError } from "@/lib/api/errors";
import type { BotResponseDto } from "@/lib/api/types";

export function ModsListPage() {
  const [bots, setBots] = useState<BotResponseDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<BotResponseDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setError(null);
    listBots({ limit: 100 })
      .then(res => setBots(res.data))
      .catch(err => setError(err instanceof ApiError ? err.message : "Could not load Mods."));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Refresh the list whenever the create modal closes, in case a Mod was created.
  useEffect(() => {
    if (!createOpen) load();
  }, [createOpen, load]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteBot(pendingDelete._id);
      toast.success(`${pendingDelete.name} deleted`);
      setPendingDelete(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete Mod.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mods</h1>
        <Button className="rounded-full" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Create Mod
        </Button>
      </div>

      {error && (
        <div className="flex flex-col items-start gap-3 rounded-xl border p-6">
          <p className="text-destructive text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={load}>
            Retry
          </Button>
        </div>
      )}

      {!error && bots === null && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      )}

      {!error && bots !== null && bots.length === 0 && (
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border p-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
            <UserRound className="size-6" />
          </div>
          <h2 className="text-lg font-semibold">Create your first Mod</h2>
          <p className="text-muted-foreground text-sm">
            A Mod is a moderator bot you can connect to Telegram or Discord to answer questions and keep your
            community in check.
          </p>
          <Button className="rounded-full" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Create Mod
          </Button>
        </div>
      )}

      {!error && bots !== null && bots.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bots.map(bot => (
            <div
              key={bot._id}
              className="group relative flex flex-col items-start gap-3 rounded-xl border bg-card p-5 text-left transition-colors hover:bg-accent"
            >
              <Link to={`/mods/${bot._id}`} className="absolute inset-0" aria-label={bot.name} />
              <div className="flex w-full items-start justify-between">
                <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                  <UserRound className="size-5" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative z-10 size-7"
                      onClick={e => e.stopPropagation()}
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="relative z-10">
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={e => {
                        e.stopPropagation();
                        setPendingDelete(bot);
                      }}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{bot.name}</span>
                  <Badge variant={bot.published ? "success" : "outline"}>{bot.published ? "Live" : "Draft"}</Badge>
                </div>
                <p className="text-muted-foreground text-xs">
                  Last updated: {new Date(bot.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateModModal open={createOpen} onOpenChange={setCreateOpen} />

      <Dialog open={pendingDelete !== null} onOpenChange={open => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {pendingDelete?.name}?</DialogTitle>
            <DialogDescription>
              This permanently deletes the Mod and disconnects any connected Telegram or Discord channels. This
              can't be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={deleting} onClick={confirmDelete}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
