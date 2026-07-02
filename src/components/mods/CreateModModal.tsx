import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createBot } from "@/lib/api/bots";
import { ApiError } from "@/lib/api/errors";
import { getLlmModels } from "@/lib/api/settings";
import type { LlmModelOptionDto } from "@/lib/api/types";

export function CreateModModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [models, setModels] = useState<LlmModelOptionDto[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setModelsLoading(true);
    getLlmModels()
      .then(list => setModels(list))
      .catch(() => setModels([]))
      .finally(() => setModelsLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setSelectedModel("");
      setError(null);
    }
  }, [open]);

  async function handleSubmit() {
    setError(null);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!selectedModel) {
      setError("Choose a model.");
      return;
    }
    setSubmitting(true);
    try {
      const bot = await createBot({
        name: name.trim(),
        description: description.trim() || undefined,
        selectedModel,
        botType: "moderator",
      });
      toast.success(`${bot.name} created`);
      onOpenChange(false);
      navigate(`/mods/${bot._id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create Mod. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-1 flex size-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
            <UserRound className="size-5" />
          </div>
          <DialogTitle>Create a Mod</DialogTitle>
          <DialogDescription>Set up a new moderator bot for Telegram or Discord.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="mod-name">Name</Label>
          <Input id="mod-name" value={name} onChange={e => setName(e.target.value)} placeholder="Community Mod" />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="mod-description">Description (optional)</Label>
          <Textarea
            id="mod-description"
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What is this Mod for?"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="mod-model">Model</Label>
          <Select value={selectedModel} onValueChange={setSelectedModel} disabled={modelsLoading}>
            <SelectTrigger id="mod-model">
              <SelectValue placeholder={modelsLoading ? "Loading models…" : "Choose a model"} />
            </SelectTrigger>
            <SelectContent>
              {models.map(model => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" className="rounded-full" disabled={submitting} onClick={handleSubmit}>
            {submitting ? "Creating…" : "Create Mod"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
