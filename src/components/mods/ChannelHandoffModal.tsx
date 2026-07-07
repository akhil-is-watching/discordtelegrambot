import { Plus, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getModeratorHome, updateConfig, updatePlatformHandoff } from "@/lib/api/moderator";
import { ApiError } from "@/lib/api/errors";
import type { Platform, TeamMember } from "@/lib/api/types";
import { CHANNEL_META } from "@/pages/mods/channelMeta";
import { ConnectWizardSteps } from "@/components/mods/ConnectWizardSteps";

const HANDOFF_SUGGESTIONS = ["Escalate technical issues", "Transfer refund requests", "Handle enterprise leads"];

function emptyMember(): TeamMember {
  return { username: "", ignoreForReplies: true };
}

export function ChannelHandoffModal({
  botId,
  channelId,
  mode = "wizard",
  onBack,
  onOpenChange,
  onContinue,
}: {
  botId: string;
  channelId: Platform;
  /** "wizard" (default): part of the add-channel flow, shows the step header + Back button.
   * "edit": standalone editor for an already-connected channel. */
  mode?: "wizard" | "edit";
  onBack?: () => void;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
}) {
  const platform = CHANNEL_META[channelId];
  const usernamePrefix = channelId === "telegram" ? "@" : "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [handoffInstructions, setHandoffInstructions] = useState("");
  const [escalationUsername, setEscalationUsername] = useState("");

  useEffect(() => {
    setLoading(true);
    getModeratorHome(botId, channelId)
      .then(res => {
        setTeamMembers(res.config.teamMembers.length ? res.config.teamMembers : [emptyMember()]);
        const handoff = res.handoff[channelId];
        setHandoffInstructions(handoff.handoffInstructions);
        setEscalationUsername(handoff.escalationUsername);
      })
      .catch(err => setError(err instanceof ApiError ? err.message : "Could not load handoff settings."))
      .finally(() => setLoading(false));
  }, [botId, channelId]);

  function updateMember(index: number, patch: Partial<TeamMember>) {
    setTeamMembers(prev => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }

  function addMember() {
    setTeamMembers(prev => [...prev, emptyMember()]);
  }

  function removeMember(index: number) {
    setTeamMembers(prev => prev.filter((_, i) => i !== index));
  }

  function applySuggestion(index: number, suggestion: string) {
    const current = teamMembers[index]?.handoffInstructions?.trim() ?? "";
    if (current.split(",").map(s => s.trim()).includes(suggestion)) return;
    const next = current ? `${current}, ${suggestion}` : suggestion;
    updateMember(index, { handoffInstructions: next });
  }

  async function handleContinue() {
    setSaving(true);
    setError(null);
    try {
      await Promise.all([
        updateConfig(botId, { teamMembers: teamMembers.filter(m => m.username.trim()) }),
        updatePlatformHandoff(botId, channelId, { handoffInstructions, escalationUsername }),
      ]);
      onContinue();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not save handoff settings.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
            <Users className="size-5" />
          </div>
          <DialogTitle>{platform.label}</DialogTitle>
          <DialogDescription>{platform.description}</DialogDescription>
        </DialogHeader>

        {mode === "wizard" && <ConnectWizardSteps current="handoff" />}

        <div className="flex flex-col gap-1">
          <h3 className="font-semibold">Team & Handoffs on {platform.label}</h3>
          <p className="text-muted-foreground text-sm">
            Each person: their {platform.label} username, what they handle, and whether the bot ignores them.
          </p>
        </div>

        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <>
            <div className="flex flex-col gap-4">
              {teamMembers.map((member, i) => (
                <div key={i} className="flex flex-col gap-3 rounded-xl border p-4">
                  <div className="flex items-end gap-2">
                    <div className="flex flex-1 flex-col gap-2">
                      <Label htmlFor={`member-username-${i}`}>Username</Label>
                      <Input
                        id={`member-username-${i}`}
                        placeholder={`${usernamePrefix}username`}
                        value={member.username}
                        onChange={e => updateMember(i, { username: e.target.value })}
                      />
                    </div>
                    {teamMembers.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeMember(i)}>
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>

                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox
                      checked={member.ignoreForReplies !== false}
                      onCheckedChange={checked => updateMember(i, { ignoreForReplies: checked === true })}
                      className="mt-0.5"
                    />
                    <span className="flex flex-col">
                      <span className="font-medium">Ignore</span>
                      <span className="text-muted-foreground text-xs">
                        Messages from this team member will be ignored and won't trigger AI responses.
                      </span>
                    </span>
                  </label>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`member-instructions-${i}`}>Handoff Instructions</Label>
                    <p className="text-muted-foreground text-xs">
                      Describe the types of conversations this team member should handle (e.g. billing, sales,
                      partnerships, technical support).
                    </p>
                    <Textarea
                      id={`member-instructions-${i}`}
                      rows={3}
                      value={member.handoffInstructions ?? ""}
                      onChange={e => updateMember(i, { handoffInstructions: e.target.value })}
                    />
                    <div className="flex flex-wrap gap-2">
                      {HANDOFF_SUGGESTIONS.map(suggestion => (
                        <Button
                          key={suggestion}
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => applySuggestion(i, suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button type="button" variant="outline" className="w-fit rounded-full" onClick={addMember}>
              <Plus className="size-4" />
              Add Person
            </Button>

            <Separator />

            <div className="flex flex-col gap-2">
              <Label htmlFor="handoff-instructions">Handoff instructions</Label>
              <p className="text-muted-foreground text-sm">
                General routing rules for {platform.label} (e.g. investments, partnerships, support) — on top
                of any per-person notes above.
              </p>
              <Textarea
                id="handoff-instructions"
                rows={4}
                value={handoffInstructions}
                onChange={e => setHandoffInstructions(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="fallback-username">Fallback (AI Unsure)</Label>
              <p className="text-muted-foreground text-sm">
                Who the bot DMs when it doesn't know the answer and no team member above fits.
              </p>
              <Input
                id="fallback-username"
                placeholder={`Enter ${platform.label.toLowerCase()} username...`}
                value={escalationUsername}
                onChange={e => setEscalationUsername(e.target.value)}
              />
            </div>
          </>
        )}

        {error && <p className="text-destructive text-sm">{error}</p>}

        <DialogFooter>
          {mode === "wizard" ? (
            <Button type="button" variant="ghost" onClick={onBack}>
              Back
            </Button>
          ) : (
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
          <Button type="button" className="rounded-full" disabled={loading || saving} onClick={handleContinue}>
            {saving ? "Saving…" : mode === "wizard" ? "Save & Continue" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
