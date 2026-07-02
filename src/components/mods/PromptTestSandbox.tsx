import { Send, Trash2, UserPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  clearTestUserMessages,
  createTestUser,
  deleteTestUser,
  getTest,
  resetTestSandbox,
  sendTestMessage,
} from "@/lib/api/moderator";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import type { PromptTestState, TestMessage } from "@/lib/api/types";

function ChatBubble({ message }: { message: TestMessage }) {
  const isUser = message.role === "user";
  const isModeration = message.role === "system";
  const action = message.meta?.action;

  return (
    <div className={cn("flex", isUser ? "justify-end" : isModeration ? "justify-center" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-3 py-2 text-sm",
          isUser && "bg-primary text-primary-foreground",
          !isUser && !isModeration && "bg-accent",
          isModeration && "border border-destructive/30 bg-destructive/10 text-center text-xs",
        )}
      >
        <div className="mb-1 flex items-center gap-1.5 text-xs opacity-70">
          <span>{isUser ? "User" : isModeration ? "System" : "Bot"}</span>
          {action && (
            <Badge variant="outline" className="h-4 px-1.5 py-0 text-[10px]">
              {action}
            </Badge>
          )}
        </div>
        <p className="whitespace-pre-wrap">{message.text}</p>
        {message.meta?.sideEffects && message.meta.sideEffects.length > 0 && (
          <ul className="mt-1.5 flex flex-col gap-0.5 text-xs opacity-80">
            {message.meta.sideEffects.map((fx, i) => (
              <li key={i}>• {fx}</li>
            ))}
          </ul>
        )}
        {message.meta?.decision && (
          <details className="mt-1.5">
            <summary className="cursor-pointer text-xs opacity-60">Decision JSON</summary>
            <pre className="mt-1 max-w-full overflow-x-auto rounded bg-black/20 p-2 text-[10px]">
              {JSON.stringify(message.meta.decision, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

export function PromptTestSandbox({ botId }: { botId: string }) {
  const [state, setState] = useState<PromptTestState | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newUserName, setNewUserName] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  function load(preserveActive = true) {
    setError(null);
    getTest(botId)
      .then(res => {
        setState({ ...res, testWarnings: res.testWarnings ?? {} });
        if (!preserveActive || !activeUserId) {
          setActiveUserId(res.users[0]?.id ?? null);
        }
      })
      .catch(err => setError(err instanceof ApiError ? err.message : "Could not load the sandbox."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setLoading(true);
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state, activeUserId]);

  async function handleAddUser() {
    const trimmed = newUserName.trim();
    if (!trimmed) return;
    try {
      const user = await createTestUser(botId, trimmed, trimmed.replace(/^@/, ""));
      setNewUserName("");
      load(false);
      setActiveUserId(user.id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not add test user.");
    }
  }

  async function handleDeleteUser(userId: string) {
    try {
      await deleteTestUser(botId, userId);
      setActiveUserId(null);
      load(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete test user.");
    }
  }

  async function handleClearChat() {
    if (!activeUserId) return;
    try {
      await clearTestUserMessages(botId, activeUserId);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not clear chat.");
    }
  }

  async function handleResetAll() {
    try {
      await resetTestSandbox(botId);
      load(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not reset the sandbox.");
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || !activeUserId) return;
    setSending(true);
    setInput("");
    try {
      await sendTestMessage(botId, activeUserId, text);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not send message.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-[520px] w-full" />;
  }

  if (error || !state) {
    return <p className="text-destructive text-sm">{error ?? "Could not load the sandbox."}</p>;
  }

  const activeUser = state.users.find(u => u.id === activeUserId) ?? null;
  const thread = activeUserId ? (state.threads[activeUserId] ?? []) : [];
  const warnings = activeUserId ? (state.testWarnings[activeUserId] ?? 0) : 0;
  const llmEnabled = state.settings.llmEnabled;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h3 className="text-sm font-semibold">Try your Mod</h3>
            <p className="text-muted-foreground text-xs">
              {state.settings.botName} · {state.settings.tone} ·{" "}
              {state.settings.engagementMode ? "engagement on" : "engagement off"}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleResetAll}>
            Reset all
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]" style={{ minHeight: 480 }}>
          <aside className="flex flex-col gap-2 border-r p-3">
            <p className="text-muted-foreground px-1 text-xs font-medium">Test users</p>
            <div className="flex flex-col gap-1">
              {state.users.map(user => (
                <div key={user.id} className="group flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveUserId(user.id)}
                    className={cn(
                      "flex flex-1 items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm",
                      user.id === activeUserId ? "bg-primary/10 text-foreground" : "hover:bg-accent",
                    )}
                  >
                    <span className="truncate">{user.displayName}</span>
                    {(state.testWarnings[user.id] ?? 0) > 0 && (
                      <Badge variant="destructive" className="h-4 px-1.5 py-0 text-[10px]">
                        {state.testWarnings[user.id]}
                      </Badge>
                    )}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 opacity-0 group-hover:opacity-100"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-1 flex items-center gap-1">
              <Input
                placeholder="@username"
                value={newUserName}
                onChange={e => setNewUserName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddUser()}
                className="h-8 text-sm"
              />
              <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={handleAddUser}>
                <UserPlus className="size-4" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="mt-auto" onClick={handleClearChat} disabled={!activeUserId}>
              Clear chat
            </Button>
          </aside>

          <section className="flex flex-col">
            <div className="flex items-center justify-between border-b px-4 py-2 text-sm">
              <span>
                Chatting as <strong>{activeUser?.displayName ?? "—"}</strong>
              </span>
              {warnings > 0 && <span className="text-destructive text-xs">{warnings} warning(s)</span>}
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {thread.length === 0 && (
                <p className="text-muted-foreground text-center text-sm">
                  Send a message to see how the bot responds…
                </p>
              )}
              {thread.map(message => (
                <ChatBubble key={message.id} message={message} />
              ))}
              {sending && <p className="text-muted-foreground text-xs">thinking…</p>}
              <div ref={chatEndRef} />
            </div>
            <div className="flex items-center gap-2 border-t p-3">
              <Input
                placeholder={llmEnabled ? "Type a message…" : "Configure an LLM to enable testing"}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                disabled={!llmEnabled || !activeUserId || sending}
              />
              <Button
                size="icon"
                disabled={!llmEnabled || !activeUserId || !input.trim() || sending}
                onClick={handleSend}
              >
                <Send className="size-4" />
              </Button>
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}
