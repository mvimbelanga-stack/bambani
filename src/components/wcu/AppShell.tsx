import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Home, MapPin, Signal, User, Wifi, BatteryFull } from "lucide-react";
import { cn } from "@/lib/utils";
import { AI_ALERTS } from "@/lib/wcu/data";
import { VicinityNotifications } from "./VicinityNotifications";

function StatusBar() {
  const [time, setTime] = React.useState("9:41");
  React.useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: false }),
      );
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center justify-between px-5 pt-3 pb-1 text-[11px] font-medium text-foreground/80">
      <span className="tabular-nums">{time}</span>
      <span className="flex items-center gap-1.5">
        <Signal className="h-3.5 w-3.5" />
        <Wifi className="h-3.5 w-3.5" />
        <BatteryFull className="h-3.5 w-3.5" />
      </span>
    </div>
  );
}

const NAV = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/map", label: "Map", icon: MapPin },
  { to: "/alerts", label: "Alerts", icon: Bell, badge: AI_ALERTS.length },
  { to: "/profile", label: "Profile", icon: User },
] as const;

function BottomNav() {
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md items-stretch justify-around rounded-t-3xl border-t px-2 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
      {NAV.map(({ to, label, icon: Icon, ...rest }) => {
        const badge = "badge" in rest ? (rest.badge as number) : undefined;
        return (
          <Link
            key={to}
            to={to}
            className="group relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 text-[11px] text-muted-foreground transition-colors data-[status=active]:text-neon"
            activeProps={{ className: "text-neon" }}
          >
            <span className="relative">
              <Icon className="h-5 w-5" />
              {badge ? (
                <span className="absolute -top-1.5 -right-2 grid h-4 min-w-4 place-items-center rounded-full bg-alert px-1 text-[10px] font-bold text-alert-foreground">
                  {badge}
                </span>
              ) : null}
            </span>
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative min-h-screen bg-background">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(120% 60% at 50% 0%, color-mix(in oklab, var(--electric) 18%, transparent), transparent 60%)",
        }}
      />
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col">
        <StatusBar />
        <VicinityNotifications />
        <main key={pathname} className={cn("flex-1 px-4 pb-28 animate-fade-in", className)}>
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  back,
  right,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        {back ? (
          <Link
            to={back}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-surface text-foreground"
            aria-label="Go back"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ) : null}
        <div className="min-w-0">
          <h1 className="truncate font-display text-lg font-bold tracking-wide">{title}</h1>
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {right}
    </header>
  );
}
