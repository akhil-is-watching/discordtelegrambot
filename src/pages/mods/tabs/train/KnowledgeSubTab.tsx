import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getCompanyDoc, putCompanyDoc } from "@/lib/api/moderator";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import type { ModDetailContext } from "@/pages/mods/useModDetail";

export function KnowledgeSubTab() {
  const ctx = useOutletContext<ModDetailContext>();
  const botId = ctx.botId;

  const [content, setContent] = useState("");
  const [maxLength, setMaxLength] = useState(400_000);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    getCompanyDoc(botId)
      .then(res => {
        setContent(res.content);
        setMaxLength(res.maxLength);
        setUpdatedAt(res.updatedAt);
      })
      .catch(err => setError(err instanceof ApiError ? err.message : "Could not load the knowledge doc."))
      .finally(() => setLoading(false));
  }, [botId]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await putCompanyDoc(botId, content);
      setContent(res.content);
      setUpdatedAt(res.updatedAt);
      toast.success("Document saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save the document.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const nearLimit = content.length > maxLength * 0.95;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle>Knowledge</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Paste product info, policies, FAQs, and anything the bot should answer from directly.
          </p>
        </div>
        {updatedAt && (
          <p className="text-muted-foreground text-xs whitespace-nowrap">
            Last saved: {new Date(updatedAt).toLocaleString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {error && <p className="text-destructive text-sm">{error}</p>}
        <Textarea
          rows={20}
          value={content}
          onChange={e => setContent(e.target.value.slice(0, maxLength))}
          placeholder="Paste company info: products, policies, FAQs, support contacts, community rules..."
          className="font-mono text-sm"
        />
        <div className="flex items-center justify-between">
          <span className={cn("text-xs", nearLimit ? "text-amber-500" : "text-muted-foreground")}>
            {content.length.toLocaleString()} / {maxLength.toLocaleString()}
          </span>
          <Button disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : "Save Document"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
