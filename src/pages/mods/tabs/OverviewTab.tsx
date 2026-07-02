import { useNavigate, useOutletContext } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PromptTestSandbox } from "@/components/mods/PromptTestSandbox";
import type { ModDetailContext } from "@/pages/mods/useModDetail";

export function OverviewTab() {
  const ctx = useOutletContext<ModDetailContext>();
  const navigate = useNavigate();
  const bot = ctx.bot!;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="State" value={bot.published ? "Live" : "Draft"} />
          <Stat label="Model" value={bot.selectedModel} />
          <Stat label="Version" value={bot.publishedVersion ? `v${bot.publishedVersion}` : "Unpublished"} />
          <Stat label="Channels" value={String(ctx.integrations.length)} />
        </CardContent>
        {bot.hasUnpublishedChanges && (
          <CardContent className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-2">
              <Badge variant="warning">Unpublished changes</Badge>
              <span className="text-muted-foreground text-sm">Publish to apply your latest edits.</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate(`/mods/${bot._id}/train/settings`)}>
              Review changes
            </Button>
          </CardContent>
        )}
      </Card>

      <PromptTestSandbox botId={bot._id} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="truncate text-sm font-medium">{value}</span>
    </div>
  );
}
