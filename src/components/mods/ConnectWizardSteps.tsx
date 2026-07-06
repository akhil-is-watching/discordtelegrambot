import { Check, KeyRound, Plug, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConnectWizardStep = "connect" | "handoff" | "authentication";

const STEPS: { id: ConnectWizardStep; label: string; icon: typeof Plug }[] = [
  { id: "connect", label: "Connect", icon: Plug },
  { id: "handoff", label: "Handoff", icon: Users },
  { id: "authentication", label: "Authentication", icon: KeyRound },
];

/** Step header for the multi-step "add channel" flow: Connect → Handoff → Authentication. */
export function ConnectWizardSteps({ current }: { current: ConnectWizardStep }) {
  const currentIndex = STEPS.findIndex(s => s.id === current);

  return (
    <div className="flex items-center gap-2 py-2">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={step.id} className="flex flex-1 items-center gap-2 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary bg-background text-primary",
                  !done && !active && "border-muted bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" /> : <Icon className="size-4" />}
              </div>
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("mb-5 h-px flex-1 border-t border-dashed", done ? "border-primary" : "border-muted")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
