import { Outlet, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ModDetailContext } from "@/pages/mods/useModDetail";

const SUB_TABS = [
  { value: "settings", label: "Settings" },
  { value: "knowledge", label: "Knowledge" },
  { value: "prompt", label: "Prompt" },
];

export function TrainTab() {
  const ctx = useOutletContext<ModDetailContext>();
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = SUB_TABS.find(t => location.pathname.endsWith(`/${t.value}`))?.value ?? "settings";

  return (
    <div className="flex flex-col gap-6">
      <Tabs value={activeTab} onValueChange={v => navigate(`/mods/${ctx.botId}/train/${v}`)} className="gap-0">
        <TabsList>
          {SUB_TABS.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="px-1 pr-5">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Outlet context={ctx} />
    </div>
  );
}
