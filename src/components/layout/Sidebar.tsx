import {
  Blocks,
  CreditCard,
  LayoutGrid,
  LogOut,
  Megaphone,
  MessageSquare,
  PanelLeft,
  PieChart,
  RefreshCcw,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  Zap,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/useAuth";
import type { NavId } from "@/App";

interface NavItem {
  id: NavId;
  label: string;
  icon: typeof LayoutGrid;
  route: string;
}

const OUTREACH_NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid, route: "/dashboard" },
  { id: "leads", label: "Leads", icon: ShieldCheck, route: "/leads" },
  { id: "inbox", label: "Inbox", icon: MessageSquare, route: "/inbox" },
  { id: "campaign", label: "Campaign", icon: Megaphone, route: "/campaign" },
  { id: "dm-auto-reply", label: "DM Auto-Reply", icon: RefreshCcw, route: "/dm-auto-reply" },
  { id: "x-accounts", label: "X Accounts", icon: SlidersHorizontal, route: "/x-accounts" },
];

const AGENTS_NAV: NavItem[] = [{ id: "mods", label: "Mods", icon: UserRound, route: "/mods" }];

const FOOTER_NAV: NavItem[] = [
  { id: "billing", label: "Billing", icon: CreditCard, route: "/billing" },
  { id: "usage", label: "Usage", icon: PieChart, route: "/usage" },
  { id: "settings", label: "Settings", icon: Settings, route: "/settings" },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.route}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
        active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white/90",
      )}
    >
      <Icon className="size-4" />
      {item.label}
    </Link>
  );
}

function initialsFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function isActive(route: string): boolean {
    return location.pathname === route || location.pathname.startsWith(`${route}/`);
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-[#0b0b12] px-3 py-4 text-white">
      <div className="mb-6 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-indigo-500">
            <Blocks className="size-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-wide">NOAH.AI</span>
        </div>
        <PanelLeft className="size-4 text-white/40" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <p className="px-3 pb-2 text-xs text-white/40">X Outreach</p>
        <nav className="flex flex-col gap-1">
          {OUTREACH_NAV.map(item => (
            <NavLink key={item.id} item={item} active={isActive(item.route)} />
          ))}
        </nav>

        <p className="px-3 pt-5 pb-2 text-xs text-white/40">Agents</p>
        <nav className="flex flex-col gap-1">
          {AGENTS_NAV.map(item => (
            <NavLink key={item.id} item={item} active={isActive(item.route)} />
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-1 border-t border-white/10 pt-3">
        {FOOTER_NAV.map(item => (
          <NavLink key={item.id} item={item} active={isActive(item.route)} />
        ))}

        <button
          type="button"
          className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          <Zap className="size-4" />
          Upgrade Plan
        </button>

        {user && (
          <div className="mt-3 flex items-center gap-2.5 rounded-lg px-2 py-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
              {initialsFromEmail(user.email)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.email}</p>
              <p className="truncate text-xs text-white/40">Signed in</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 text-white/40 transition-colors hover:text-white"
              aria-label="Log out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
