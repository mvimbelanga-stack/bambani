import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  Brain,
  ChevronDown,
  FolderLock,
  HardHat,
  MapPin,
  MessageCircle,
  Navigation,
  Radar,
  ScanFace,
  ShieldCheck,
  Siren,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/wcu/AppShell";
import { UnicornShield } from "@/components/wcu/UnicornShield";
import { CITIES, ROLES } from "@/lib/wcu/data";
import { useWcu } from "@/lib/wcu/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Dashboard — World Crime Unicorn" },
      {
        name: "description",
        content:
          "Your crime-fighting dashboard: one-tap crime reporting, live map, AI alerts, patrol tools and safe zones.",
      },
      { property: "og:title", content: "Dashboard — World Crime Unicorn" },
      {
        property: "og:description",
        content: "One-tap crime reporting, live maps and AI alerts for your neighbourhood.",
      },
    ],
  }),
  component: HomeScreen,
});

const ACTIONS = [
  { to: "/sound-alert", label: "SoundAlert", icon: Siren, tone: "alert", roles: ["citizen", "patroller", "police", "security"] },
  { to: "/clock-in", label: "Clock In", icon: ScanFace, tone: "neon", roles: ["patroller", "security"] },
  { to: "/security", label: "Guard Tracking", icon: Radar, tone: "electric", roles: ["security"] },
  { to: "/mine", label: "MINE Safety", icon: HardHat, tone: "warn", roles: ["citizen", "patroller", "police", "security"] },
  { to: "/map", label: "Live Map", icon: MapPin, tone: "electric", roles: ["citizen", "patroller", "police", "security"] },
  { to: "/tools/community", label: "Global Chat", icon: MessageCircle, tone: "neon", roles: ["citizen", "patroller", "police", "security"] },
  { to: "/alerts", label: "AI Alerts", icon: Brain, tone: "violet", roles: ["citizen", "patroller", "police", "security"] },
  { to: "/tools/patrol", label: "Patrol Tools", icon: Navigation, tone: "neon", roles: ["patroller", "security"] },
  { to: "/tools/safe-zones", label: "Safe Zones", icon: ShieldCheck, tone: "safe", roles: ["citizen"] },
  { to: "/tools/sos", label: "Emergency SOS", icon: Siren, tone: "alert", roles: ["citizen", "patroller"] },
  { to: "/tools/evidence", label: "Evidence Vault", icon: FolderLock, tone: "violet", roles: ["police", "security"] },
  { to: "/tools/stats", label: "Crime Stats", icon: BarChart3, tone: "neon", roles: ["police", "security"] },
] as const;

const toneClass: Record<string, string> = {
  electric: "bg-electric/20 text-electric",
  violet: "bg-violet/20 text-violet",
  neon: "bg-neon/20 text-neon",
  safe: "bg-safe/20 text-safe",
  alert: "bg-alert/20 text-alert",
  warn: "bg-warn/20 text-warn",
};

function HomeScreen() {
  const { city, setCity, role, reports } = useWcu();
  const navigate = useNavigate();
  const [switching, setSwitching] = React.useState(false);
  const roleLabel = ROLES.find((r) => r.id === role)?.label ?? "Citizen";
  const activeRole = role ?? "citizen";
  const forRole = ACTIONS.filter((a) => (a.roles as readonly string[]).includes(activeRole));
  const others = ACTIONS.filter((a) => !(a.roles as readonly string[]).includes(activeRole));

  return (
    <AppShell>
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 pt-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Good day,</p>
          <h1 className="truncate font-display text-xl font-bold tracking-wide">Community Hero</h1>
          <p className="text-xs text-neon">Together we are safer · {roleLabel} mode</p>
        </div>
        <Link
          to="/profile"
          className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-neon/40 shadow-sm transition hover:scale-105"
          aria-label="Open profile"
        >
          <img
            src="/icon-192.png"
            alt="World Crime Unicorn Avatar"
            width={44}
            height={44}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </Link>
      </header>

      <button
        onClick={() => setSwitching((v) => !v)}
        className="mt-3 flex w-full items-center gap-2 rounded-2xl border border-border bg-surface/70 px-3 py-2 text-left text-sm"
      >
        <MapPin className="h-4 w-4 shrink-0 text-neon" />
        <span className="min-w-0 flex-1 truncate">{city}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", switching && "rotate-180")} />
      </button>

      {switching ? (
        <ul className="glass mt-2 animate-fade-in space-y-1 rounded-2xl p-2">
          {CITIES.map((c) => (
            <li key={c}>
              <button
                onClick={() => {
                  setCity(c);
                  setSwitching(false);
                }}
                className={cn(
                  "w-full truncate rounded-xl px-3 py-2 text-left text-sm",
                  c === city ? "bg-electric/20 text-neon" : "hover:bg-surface-2",
                )}
              >
                {c}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-7 flex flex-col items-center">
        <button
          onClick={() => navigate({ to: "/report" })}
          className="relative grid h-44 w-44 place-items-center rounded-full"
          aria-label="Report a crime"
        >
          <span className="animate-pulse-ring absolute inset-0 rounded-full border-2 border-alert" />
          <span className="glow-alert absolute inset-3 rounded-full bg-gradient-to-b from-alert to-[oklch(0.42_0.2_18)]" />
          <span className="relative flex flex-col items-center gap-1 text-alert-foreground">
            <Bell className="h-7 w-7" />
            <span className="font-display text-base font-black tracking-widest">REPORT</span>
            <span className="font-display text-base font-black tracking-widest">CRIME</span>
            <span className="text-[11px] opacity-90">Tap to alert</span>
          </span>
        </button>
        <Link
          to="/track-me"
          className="glow-neon mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-neon bg-neon/15 py-3 font-display text-sm font-bold tracking-widest text-neon"
        >
          <Navigation className="h-4 w-4" /> TRACK ME
        </Link>
        {reports.length ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {reports.length} report{reports.length > 1 ? "s" : ""} submitted from this device
          </p>
        ) : null}
      </div>

      <h2 className="mt-8 mb-3 font-display text-sm font-bold tracking-widest text-muted-foreground">
        {roleLabel.toUpperCase()} TOOLS
      </h2>
      <ActionGrid actions={forRole} featured />

      {others.length ? (
        <>
          <h2 className="mt-6 mb-3 font-display text-sm font-bold tracking-widest text-muted-foreground">
            MORE
          </h2>
          <ActionGrid actions={others} />
        </>
      ) : null}
    </AppShell>
  );
}

type Action = (typeof ACTIONS)[number];

function ActionGrid({ actions, featured }: { actions: Action[]; featured?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map(({ to, label, icon: Icon, tone }) => (
        <Link
          key={to}
          to={to}
          className={cn(
            "glass flex items-center gap-3 rounded-2xl p-3 transition-transform active:scale-[0.98]",
            featured && "border-neon/50",
          )}
        >
          <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", toneClass[tone])}>
            <Icon className="h-5 w-5" />
          </span>
          <span className="min-w-0 text-sm font-semibold">{label}</span>
        </Link>
      ))}
    </div>
  );
}
