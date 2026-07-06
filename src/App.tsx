import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { WalletProviders } from "@/lib/wallet-auth/WalletProviders";
import { WalletLoginPage } from "@/pages/auth/WalletLoginPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { ModsListPage } from "@/pages/mods/ModsListPage";
import { ModDetailPage } from "@/pages/mods/ModDetailPage";
import { OverviewTab } from "@/pages/mods/tabs/OverviewTab";
import { ChannelsTab } from "@/pages/mods/tabs/ChannelsTab";
import { TrainTab } from "@/pages/mods/tabs/TrainTab";
import { SettingsSubTab } from "@/pages/mods/tabs/train/SettingsSubTab";
import { KnowledgeSubTab } from "@/pages/mods/tabs/train/KnowledgeSubTab";
import { PromptSubTab } from "@/pages/mods/tabs/train/PromptSubTab";
import "./index.css";

export type NavId =
  | "dashboard"
  | "leads"
  | "inbox"
  | "campaign"
  | "dm-auto-reply"
  | "x-accounts"
  | "mods"
  | "billing"
  | "usage"
  | "settings";

const NAV_LABELS: Record<Exclude<NavId, "mods">, string> = {
  dashboard: "Dashboard",
  leads: "Leads",
  inbox: "Inbox",
  campaign: "Campaign",
  "dm-auto-reply": "DM Auto-Reply",
  "x-accounts": "X Accounts",
  billing: "Billing",
  usage: "Usage",
  settings: "Settings",
};

export function App() {
  return (
    <WalletProviders>
      <BrowserRouter>
        <AuthProvider>
          <Toaster position="top-right" richColors />
          <Routes>
            <Route path="/login" element={<WalletLoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route index element={<Navigate to="/mods" replace />} />

                {(Object.keys(NAV_LABELS) as (keyof typeof NAV_LABELS)[]).map(id => (
                  <Route key={id} path={id} element={<PlaceholderPage title={NAV_LABELS[id]} />} />
                ))}

                <Route path="mods" element={<ModsListPage />} />
                <Route path="mods/:botId" element={<ModDetailPage />}>
                  <Route index element={<Navigate to="overview" replace />} />
                  <Route path="overview" element={<OverviewTab />} />
                  <Route path="channels" element={<ChannelsTab />} />
                  <Route path="train" element={<TrainTab />}>
                    <Route index element={<Navigate to="settings" replace />} />
                    <Route path="settings" element={<SettingsSubTab />} />
                    <Route path="knowledge" element={<KnowledgeSubTab />} />
                    <Route path="prompt" element={<PromptSubTab />} />
                  </Route>
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/mods" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </WalletProviders>
  );
}

export default App;