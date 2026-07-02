import { useEffect, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  deletePromptDraft,
  generatePrompt,
  getPrompt,
  getPromptDraft,
  publishPrompt,
  putPromptDraft,
  resetPrompt,
} from "@/lib/api/moderator";
import { ApiError } from "@/lib/api/errors";
import type { PromptStudioState } from "@/lib/api/types";
import type { ModDetailContext } from "@/pages/mods/useModDetail";

function splitPointer(pointer: string): { label: string; body: string } {
  const idx = pointer.indexOf(":");
  if (idx === -1) return { label: "", body: pointer };
  return { label: pointer.slice(0, idx), body: pointer.slice(idx + 1).trim() };
}

export function PromptSubTab() {
  const ctx = useOutletContext<ModDetailContext>();
  const botId = ctx.botId;

  const [state, setState] = useState<PromptStudioState | null>(null);
  const [draftPrompt, setDraftPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [aiRequest, setAiRequest] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<{ summary: string; blockedNote?: string } | null>(null);

  const [savingDraft, setSavingDraft] = useState(false);
  const [activating, setActivating] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botId]);

  function load() {
    setLoading(true);
    setError(null);
    getPrompt(botId)
      .then(async res => {
        setState(res);
        if (res.hasDraft) {
          const draft = await getPromptDraft(botId);
          setDraftPrompt(draft.draftPrompt ?? "");
        }
      })
      .catch(err => setError(err instanceof ApiError ? err.message : "Could not load Prompt Studio."))
      .finally(() => setLoading(false));
  }

  async function handleGenerate() {
    if (!aiRequest.trim()) return;
    setGenerating(true);
    setGenerateResult(null);
    try {
      const result = await generatePrompt(botId, aiRequest);
      setDraftPrompt(result.draftPrompt);
      setGenerateResult({ summary: result.summary, blockedNote: result.blockedNote });
      setState(prev =>
        prev ? { ...prev, pointers: result.pointers, hasDraft: true, draftUpdatedAt: new Date().toISOString() } : prev,
      );
      setAiRequest("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not generate a prompt.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveDraft() {
    if (!draftPrompt.trim()) return;
    setSavingDraft(true);
    try {
      const result = await putPromptDraft(botId, draftPrompt);
      setState(result);
      toast.success("Draft saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save draft.");
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleActivate() {
    setActivating(true);
    try {
      if (draftPrompt.trim()) {
        await putPromptDraft(botId, draftPrompt);
      }
      const result = await publishPrompt(botId);
      setState(result);
      setDraftPrompt("");
      setGenerateResult(null);
      toast.success("Prompt is now live");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not activate the prompt.");
    } finally {
      setActivating(false);
    }
  }

  async function handleDiscard() {
    setDiscarding(true);
    try {
      const result = await deletePromptDraft(botId);
      setState(result);
      setDraftPrompt("");
      setGenerateResult(null);
      toast.success("Draft discarded");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not discard draft.");
    } finally {
      setDiscarding(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    try {
      const result = await resetPrompt(botId);
      setState(result);
      setDraftPrompt("");
      setGenerateResult(null);
      setResetOpen(false);
      toast.success("Reset to default prompt");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not reset the prompt.");
    } finally {
      setResetting(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (error || !state) {
    return <p className="text-destructive text-sm">{error ?? "Could not load Prompt Studio."}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Prompt Studio</h2>
          <p className="text-muted-foreground text-sm">
            Describe how the bot should behave in plain language, or edit the full prompt directly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{state.studioModel}</Badge>
          <Badge variant={state.useCustomPrompt ? "success" : "outline"}>
            {state.useCustomPrompt ? "Custom active" : "Using default"}
          </Badge>
          {state.hasDraft && <Badge variant="warning">Draft pending</Badge>}
        </div>
      </div>

      {!state.llmEnabled && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-500">
          No LLM configured — Prompt Studio generation is disabled until an API key is set.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_1.05fr_0.85fr]">
        <div className="flex max-h-[720px] flex-col gap-2 overflow-y-auto rounded-xl border p-4">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Instruction pointers</p>
          <ol className="flex flex-col gap-2">
            {state.pointers.map((pointer, i) => {
              const { label, body } = splitPointer(pointer);
              return (
                <li key={i} className="rounded-lg border p-3 text-sm">
                  <span className="text-primary mr-2 font-mono text-xs">{i + 1}.</span>
                  {label ? (
                    <>
                      <span className="font-medium">{label}:</span> {body}
                    </>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 rounded-xl border p-4">
            <p className="text-sm font-medium">Describe what you want changed</p>
            <Textarea
              rows={5}
              value={aiRequest}
              onChange={e => setAiRequest(e.target.value)}
              placeholder="e.g. Be more concise, and always mention our Discord support channel when someone asks for help."
              disabled={!state.llmEnabled}
            />
            <Button
              onClick={handleGenerate}
              disabled={!state.llmEnabled || generating || !aiRequest.trim()}
              className="self-start"
            >
              {generating ? "Generating…" : "Generate with AI"}
            </Button>

            {generateResult && (
              <div className="mt-2 flex flex-col gap-2">
                <div className="rounded-lg border p-3 text-sm">
                  <p className="text-muted-foreground mb-1 text-xs font-medium">What changed</p>
                  {generateResult.summary}
                </div>
                {generateResult.blockedNote && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-500">
                    <p className="mb-1 text-xs font-medium">Could not change (use Settings instead)</p>
                    {generateResult.blockedNote}
                  </div>
                )}
              </div>
            )}
          </div>

          <details className="rounded-xl border p-4">
            <summary className="cursor-pointer text-sm font-medium">Advanced: edit full prompt</summary>
            <div className="mt-3 flex flex-col gap-2">
              <Textarea
                rows={14}
                value={draftPrompt}
                onChange={e => setDraftPrompt(e.target.value)}
                className="font-mono text-xs"
                placeholder={state.hasDraft ? "" : "No draft yet — generate one above or start typing."}
              />
              <Button
                variant="secondary"
                size="sm"
                className="self-start"
                disabled={!draftPrompt.trim() || savingDraft}
                onClick={handleSaveDraft}
              >
                {savingDraft ? "Saving…" : "Save Draft"}
              </Button>
            </div>
          </details>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border p-4">
          <p className="text-sm font-medium">Save & use</p>
          <Button
            className="rounded-full"
            disabled={activating || (!draftPrompt.trim() && !state.hasDraft)}
            onClick={handleActivate}
          >
            {activating ? "Activating…" : "Save & use for community"}
          </Button>
          {(state.hasDraft || draftPrompt.trim()) && (
            <Button variant="outline" disabled={discarding} onClick={handleDiscard}>
              {discarding ? "Discarding…" : "Discard draft"}
            </Button>
          )}
          {state.hasSavedCustom && (
            <Button variant="destructive" onClick={() => setResetOpen(true)}>
              Reset to default
            </Button>
          )}
          {state.savedAt && (
            <p className="text-muted-foreground text-xs">
              Custom prompt saved: {new Date(state.savedAt).toLocaleString()}
            </p>
          )}

          <div className="mt-2 border-t pt-3">
            <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
              Cannot change here
            </p>
            <ul className="text-muted-foreground flex flex-col gap-1.5 text-xs">
              {state.lockedSettings.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="text-muted-foreground mt-2 text-xs">
              These require the Settings tab, env config, or code — not the prompt editor.
            </p>
          </div>
        </div>
      </div>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset to the built-in default prompt?</DialogTitle>
            <DialogDescription>Your custom prompt will be removed. This can't be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={resetting} onClick={handleReset}>
              {resetting ? "Resetting…" : "Reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
