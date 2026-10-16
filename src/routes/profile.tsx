import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  ChevronRight,
  FolderLock,
  Globe,
  Navigation,
  Radar,
  ShieldCheck,
  Siren,
  Users,
} from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { UnicornShield } from "@/components/wcu/UnicornShield";
import { ROLES, type Role } from "@/lib/wcu/data";
import { useWcu } from "@/lib/wcu/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile & Role Tools — World Crime Unicorn" },
      {
        name: "description",
        content:
          "Switch between Citizen, Patroller, Police and Security Company modes and open patrol, evidence, stats and SOS tools.",
      },
      { property: "og:title", content: "Profile & Role Tools — World Crime Unicorn" },
      {
        property: "og:description",
        content: "Role-based tools for citizens, patrollers, police and security companies.",
      },
    ],
  }),
  component: ProfileScreen,
});

const TOOLS = [
  { to: "/tools/patrol", label: "Patrol check-ins", icon: Navigation },
  { to: "/tools/evidence", label: "Evidence Vault", icon: FolderLock },
  { to: "/tools/stats", label: "Crime Stats", icon: BarChart3 },
  { to: "/tools/community", label: "Community", icon: Users },
  { to: "/tools/safe-zones", label: "Safe Zones", icon: ShieldCheck },
  { to: "/tools/sos", label: "Emergency SOS", icon: Siren },
] as const;

function ProfileScreen() {
  const { role, setRole, city, reports } = useWcu();
  const [alertsOn, setAlertsOn] = React.useState(true);
  const [shareLocation, setShareLocation] = React.useState(true);

  return (
    <AppShell>
      <ScreenHeader title="Profile" subtitle={city} />

      <div className="glass flex items-center gap-3 rounded-3xl p-4">
        <img
          src="/icon-192.png"
          alt="World Crime Unicorn Badge"
          width={56}
          height={56}
          className="h-14 w-14 shrink-0 rounded-2xl border border-neon/40 object-cover shadow-lg"
          referrerPolicy="no-referrer"
        />
        <div className="min-w-0">
          <p className="truncate font-display text-base font-bold">Community Hero</p>
          <p className="truncate text-xs text-muted-foreground">
            {reports.length} reports · Verified member
          </p>
        </div>
      </div>

      <h2 className="mt-6 mb-3 font-display text-sm font-bold tracking-widest text-muted-foreground">
        YOUR ROLE
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {ROLES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRole(r.id as Role)}
            className={cn(
              "rounded-2xl border bg-surface/70 p-3 text-left transition hover:border-neon/50",
              role === r.id ? "border-neon glow-neon bg-neon/10" : "border-border",
            )}
          >
            <span className="block text-sm font-semibold">{r.label}</span>
            <span className="mt-1 block text-[11px] text-muted-foreground">{r.blurb}</span>
          </button>
        ))}
      </div>

      <h2 className="mt-6 mb-3 font-display text-sm font-bold tracking-widest text-muted-foreground">
        TOOLS
      </h2>
      <div className="glass divide-y divide-border/70 overflow-hidden rounded-2xl">
        <Link to="/security" className="flex items-center gap-3 px-4 py-3">
          <Radar className="h-4.5 w-4.5 shrink-0 text-electric" />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">Guard Tracking & Control Room</span>
          <span className="rounded-full bg-electric/20 px-2 py-0.5 text-[10px] font-bold text-electric">Security</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
        {TOOLS.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex items-center gap-3 px-4 py-3">
            <Icon className="h-4.5 w-4.5 shrink-0 text-neon" />
            <span className="min-w-0 flex-1 truncate text-sm">{label}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>

      <h2 className="mt-6 mb-3 font-display text-sm font-bold tracking-widest text-muted-foreground">
        SETTINGS
      </h2>
      <div className="glass divide-y divide-border/70 overflow-hidden rounded-2xl">
        <Toggle
          icon={Bell}
          label="Push alerts"
          value={alertsOn}
          onChange={() => setAlertsOn((v) => !v)}
        />
        <Toggle
          icon={Globe}
          label="Share my location with patrols"
          value={shareLocation}
          onChange={() => setShareLocation((v) => !v)}
        />
      </div>
    </AppShell>
  );
}

function Toggle({
  icon: Icon,
  label,
  value,
  onChange,
}: {
  icon: typeof Bell;
  label: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <button onClick={onChange} className="flex w-full items-center gap-3 px-4 py-3 text-left">
      <Icon className="h-4.5 w-4.5 shrink-0 text-neon" />
      <span className="min-w-0 flex-1 truncate text-sm">{label}</span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          value ? "bg-electric" : "bg-surface-2",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-all",
            value ? "left-[1.4rem]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}
