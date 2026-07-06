import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getModeratorHome, updateConfig } from "@/lib/api/moderator";
import { ApiError } from "@/lib/api/errors";
import type { BotTone, CustomModerationRule, ModerationRuleDef, ModeratorConfig, TeamMember } from "@/lib/api/types";
import type { ModDetailContext } from "@/pages/mods/useModDetail";

const TONES: { value: BotTone; label: string; hint: string }[] = [
  { value: "chill", label: "Chill", hint: "Relaxed and friendly, like a regular member hanging out." },
  { value: "professional", label: "Professional", hint: "Helpful and polished but still human." },
  { value: "degen", label: "Degen", hint: "High energy, crypto-native, playful." },
  { value: "minimal", label: "Minimal", hint: "Short and to the point, no fluff." },
];

let ruleIdCounter = 0;
function newRuleId() {
  ruleIdCounter += 1;
  return `custom_draft_${Date.now()}_${ruleIdCounter}`;
}

export function SettingsSubTab() {
  const ctx = useOutletContext<ModDetailContext>();
  const botId = ctx.botId;

  const [config, setConfig] = useState<ModeratorConfig | null>(null);
  const [savedConfig, setSavedConfig] = useState<ModeratorConfig | null>(null);
  const [rulesCatalog, setRulesCatalog] = useState<ModerationRuleDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    getModeratorHome(botId)
      .then(res => {
        setConfig(res.config);
        setSavedConfig(res.config);
        setRulesCatalog(res.rulesCatalog);
      })
      .catch(err => setError(err instanceof ApiError ? err.message : "Could not load settings."))
      .finally(() => setLoading(false));
  }, [botId]);

  const dirty = config && savedConfig && JSON.stringify(config) !== JSON.stringify(savedConfig);

  function patch(partial: Partial<ModeratorConfig>) {
    setConfig(prev => (prev ? { ...prev, ...partial } : prev));
  }

  function toggleRule(ruleId: string) {
    if (!config) return;
    const enabled = new Set(config.enabledModerationRules);
    if (enabled.has(ruleId)) enabled.delete(ruleId);
    else enabled.add(ruleId);
    patch({ enabledModerationRules: [...enabled] });
  }

  function updateCustomRule(index: number, patchRule: Partial<CustomModerationRule>) {
    if (!config) return;
    const next = config.customModerationRules.map((r, i) => (i === index ? { ...r, ...patchRule } : r));
    patch({ customModerationRules: next });
  }

  function addCustomRule() {
    if (!config) return;
    patch({
      customModerationRules: [
        ...config.customModerationRules,
        { id: newRuleId(), label: "", description: "", enabled: true },
      ],
    });
  }

  function removeCustomRule(index: number) {
    if (!config) return;
    patch({ customModerationRules: config.customModerationRules.filter((_, i) => i !== index) });
  }

  function updateTeamMember(index: number, patchMember: Partial<TeamMember>) {
    if (!config) return;
    const next = config.teamMembers.map((m, i) => (i === index ? { ...m, ...patchMember } : m));
    patch({ teamMembers: next });
  }

  function addTeamMember() {
    if (!config) return;
    patch({ teamMembers: [...config.teamMembers, { username: "", ignoreForReplies: true }] });
  }

  function removeTeamMember(index: number) {
    if (!config) return;
    patch({ teamMembers: config.teamMembers.filter((_, i) => i !== index) });
  }

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    try {
      const { botName: _botName, ...rest } = config;
      const { config: saved } = await updateConfig(botId, {
        ...rest,
        teamMembers: config.teamMembers.filter(m => m.username.trim()),
        customModerationRules: config.customModerationRules.filter(r => r.description.trim()),
      });
      setConfig(saved);
      setSavedConfig(saved);
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !config) {
    return <p className="text-destructive text-sm">{error ?? "Could not load settings."}</p>;
  }

  return (
    <div className="flex flex-col gap-6 pb-20">
      <Card>
        <CardHeader>
          <CardTitle>Identity & tone</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="community-name">Community name</Label>
              <Input
                id="community-name"
                value={config.communityName}
                onChange={e => patch({ communityName: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border p-4">
            <div>
              <p className="font-medium">Enhance engagement</p>
              <p className="text-muted-foreground text-sm">
                Reply to greetings and casual chatter to keep the community active.
              </p>
            </div>
            <Switch
              checked={config.engagementMode}
              onCheckedChange={checked => patch({ engagementMode: checked })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Tone</Label>
            <div className="flex flex-wrap gap-2">
              {TONES.map(tone => (
                <Button
                  key={tone.value}
                  type="button"
                  size="sm"
                  variant={config.tone === tone.value ? "default" : "outline"}
                  title={tone.hint}
                  onClick={() => patch({ tone: tone.value })}
                >
                  {tone.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Warnings & moderation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="max-warnings">Warnings before removal</Label>
              <Input
                id="max-warnings"
                type="number"
                min={1}
                max={10}
                value={config.maxWarnings}
                onChange={e => patch({ maxWarnings: Math.min(10, Math.max(1, Number(e.target.value) || 1)) })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="allowed-links">Allowed company links</Label>
              <Input
                id="allowed-links"
                placeholder="example.com, docs.example.com"
                value={config.allowedLinks}
                onChange={e => patch({ allowedLinks: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border p-4">
            <div>
              <p className="font-medium">Auto-remove on max warnings</p>
              <p className="text-muted-foreground text-sm">Ban users automatically once they hit the limit.</p>
            </div>
            <Switch
              checked={config.banUsersEnabled}
              onCheckedChange={checked => patch({ banUsersEnabled: checked })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Moderation rules</Label>
            <div className="flex flex-col gap-2">
              {rulesCatalog.map(rule => {
                const checked = config.enabledModerationRules.includes(rule.id);
                return (
                  <label
                    key={rule.id}
                    className={
                      checked
                        ? "flex items-start gap-3 rounded-xl border border-primary/40 bg-primary/5 p-3"
                        : "flex items-start gap-3 rounded-xl border p-3"
                    }
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggleRule(rule.id)} className="mt-0.5" />
                    <span className="flex flex-col">
                      <span className="text-sm font-medium">{rule.label}</span>
                      <span className="text-muted-foreground text-xs">{rule.promptLine}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Custom rules</Label>
              <Button type="button" size="sm" variant="ghost" onClick={addCustomRule}>
                <Plus className="size-4" />
                Add
              </Button>
            </div>
            {config.customModerationRules.length === 0 && (
              <p className="text-muted-foreground text-sm">No custom conditions yet.</p>
            )}
            <div className="flex flex-col gap-2">
              {config.customModerationRules.map((rule, i) => (
                <div key={rule.id} className="flex items-center gap-2 rounded-xl border p-2">
                  <Checkbox
                    checked={rule.enabled}
                    onCheckedChange={checked => updateCustomRule(i, { enabled: checked === true })}
                  />
                  <Input
                    placeholder="Label"
                    value={rule.label}
                    onChange={e => updateCustomRule(i, { label: e.target.value })}
                    className="w-40"
                  />
                  <Input
                    placeholder="Describe the condition to flag"
                    value={rule.description}
                    onChange={e => updateCustomRule(i, { description: e.target.value })}
                    className="flex-1"
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeCustomRule(i)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team & escalation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Team members</Label>
              <Button type="button" size="sm" variant="ghost" onClick={addTeamMember}>
                <Plus className="size-4" />
                Add
              </Button>
            </div>
            {config.teamMembers.length === 0 && (
              <p className="text-muted-foreground text-sm">No team members yet.</p>
            )}
            <div className="flex flex-col gap-2">
              {config.teamMembers.map((member, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-xl border p-2">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="username"
                      value={member.username}
                      onChange={e => updateTeamMember(i, { username: e.target.value })}
                      className="w-32"
                    />
                    <Input
                      placeholder="Role"
                      value={member.role ?? ""}
                      onChange={e => updateTeamMember(i, { role: e.target.value })}
                      className="w-32"
                    />
                    <Input
                      placeholder="Topics"
                      value={member.topics ?? ""}
                      onChange={e => updateTeamMember(i, { topics: e.target.value })}
                      className="flex-1"
                    />
                    <label className="flex shrink-0 items-center gap-1.5 text-xs whitespace-nowrap">
                      <Checkbox
                        checked={member.ignoreForReplies !== false}
                        onCheckedChange={checked => updateTeamMember(i, { ignoreForReplies: checked === true })}
                      />
                      Ignore
                    </label>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeTeamMember(i)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Handoff instructions for this person (e.g. billing, refunds)"
                    value={member.handoffInstructions ?? ""}
                    onChange={e => updateTeamMember(i, { handoffInstructions: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="escalation-username">Escalation contact</Label>
            <Input
              id="escalation-username"
              placeholder="username"
              value={config.escalationUsername}
              onChange={e => patch({ escalationUsername: e.target.value })}
            />
            <p className="text-muted-foreground text-xs">
              DM'd when the bot can't answer or a user wants to talk to a person.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="handoff-instructions">Handoff instructions</Label>
            <Textarea
              id="handoff-instructions"
              rows={6}
              value={config.handoffInstructions}
              onChange={e => patch({ handoffInstructions: e.target.value })}
              placeholder="Routing rules for who handles what (investments, partnerships, support, ...)"
            />
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 flex justify-end border-t bg-background/95 py-4 backdrop-blur">
        <Button disabled={!dirty || saving} onClick={handleSave}>
          {saving ? "Saving…" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
