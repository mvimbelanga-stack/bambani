import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, Clock, MapPin, Navigation, Route as RouteIcon, ScanFace, Siren } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { PATROL_CHECKINS, ROLES } from "@/lib/wcu/data";
import { useWcu } from "@/lib/wcu/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tools/patrol")({
  head: () => ({
    meta: [
      { title: "Patrol Tools — World Crime Unicorn" },
      {
        name: "description",
        content: "Patrol routes, timed check-ins and shift progress for patrollers and security teams.",
      },
      { property: "og:title", content: "Patrol Tools — World Crime Unicorn" },
      {
        property: "og:description",
        content: "Navigation, check-ins and mission updates for active patrol shifts.",
      },
    ],
  }),
  component: PatrolTools,
});

const ROUTE_BY_ROLE: Record<string, string> = {
  citizen: "Neighbourhood walk · self check-ins",
  patroller: "Shift JHB-07 · Day route",
  police: "Sector 4 response route",
  security: "Client sites · contract route",
};

function PatrolTools() {
  const { role } = useWcu();
  const [done, setDone] = React.useState<string[]>(
    PATROL_CHECKINS.filter((c) => c.status === "Complete").map((c) => c.id),
  );
  const [onShift, setOnShift] = React.useState(true);
  const [gpsTag, setGpsTag] = React.useState<string | null>(null);
  const progress = Math.round((done.length / PATROL_CHECKINS.length) * 100);
  const roleLabel = ROLES.find((r) => r.id === role)?.label ?? "Citizen";

  const handleToggleCheckin = (id: string, pointName: string) => {
    const isNowDone = !done.includes(id);
    if (isNowDone) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
            setGpsTag(coords);
            toast.success(`Check-in verified at ${pointName} [GPS: ${coords}]`);
          },
          () => {
            toast.success(`Check-in logged for ${pointName}`);
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } else {
        toast.success(`Check-in logged for ${pointName}`);
      }
      setDone((d) => [...d, id]);
    } else {
      setDone((d) => d.filter((x) => x !== id));
      toast("Check-in unchecked");
    }
  };

  return (
    <AppShell>
      <ScreenHeader
        title="Patrol Tools"
        subtitle={`${roleLabel} · ${ROUTE_BY_ROLE[role ?? "citizen"]}`}
        back="/home"
        right={
          <Link
            to="/map"
            className="flex items-center gap-1 rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-xs font-semibold text-neon"
          >
            <MapPin className="h-3 w-3" /> Map
          </Link>
        }
      />

      <button
        onClick={() => {
          const next = !onShift;
          setOnShift(next);
          toast(next ? "Shift started" : "Shift ended");
        }}
        className={cn(
          "mb-4 w-full rounded-2xl border py-3 text-sm font-bold shadow transition active:scale-[0.99]",
          onShift ? "border-safe/60 bg-safe/10 text-safe glow-safe" : "border-border text-muted-foreground",
        )}
      >
        {onShift ? "● ON DUTY — Tap to end shift" : "○ OFF DUTY — Tap to start shift"}
      </button>

      {/* Quick Action Bar for Patroller */}
      <div className="mb-4 grid grid-cols-3 gap-2 text-xs">
        <Link
          to="/clock-in"
          className="flex items-center justify-center gap-1.5 rounded-2xl border border-neon/30 bg-surface-2/60 py-2.5 font-semibold text-neon transition hover:border-neon"
        >
          <ScanFace className="h-4 w-4" /> Clock In
        </Link>
        <Link
          to="/map"
          className="flex items-center justify-center gap-1.5 rounded-2xl border border-electric/30 bg-surface-2/60 py-2.5 font-semibold text-electric transition hover:border-electric"
        >
          <MapPin className="h-4 w-4" /> Live Map
        </Link>
        <Link
          to="/report"
          className="flex items-center justify-center gap-1.5 rounded-2xl border border-alert/30 bg-surface-2/60 py-2.5 font-semibold text-alert transition hover:border-alert"
        >
          <Siren className="h-4 w-4" /> Alert
        </Link>
      </div>

      <div className="glass rounded-3xl p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Route progress</p>
            <p className="text-xs text-muted-foreground">
              {done.length} of {PATROL_CHECKINS.length} check-ins complete {gpsTag ? `· GPS tagged` : ""}
            </p>
          </div>
          <span className="shrink-0 font-display text-xl font-bold text-neon">{progress}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-gradient-to-r from-neon to-electric" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="glass flex items-center gap-2 rounded-2xl p-3 text-sm">
          <RouteIcon className="h-4.5 w-4.5 shrink-0 text-electric" />
          <span className="min-w-0 truncate">14.2 km covered</span>
        </div>
        <div className="glass flex items-center gap-2 rounded-2xl p-3 text-sm">
          <Clock className="h-4.5 w-4.5 shrink-0 text-electric" />
          <span className="min-w-0 truncate">4h 20m on shift</span>
        </div>
      </div>

      <h2 className="mt-6 mb-3 font-display text-sm font-bold tracking-widest text-muted-foreground">
        CHECK-IN POINTS (TAP TO VERIFY GPS)
      </h2>
      <ul className="glass divide-y divide-border/70 overflow-hidden rounded-2xl">
        {PATROL_CHECKINS.map((c) => {
          const complete = done.includes(c.id);
          return (
            <li key={c.id}>
              <button
                onClick={() => handleToggleCheckin(c.id, c.point)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-2/60"
              >
                {complete ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-safe glow-safe" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <span className="min-w-0 flex-1">
                  <span className={cn("block truncate text-sm font-medium", complete && "text-muted-foreground line-through")}>
                    {c.point}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">{c.time}</span>
                </span>
                <Navigation className="h-4 w-4 shrink-0 text-neon" />
              </button>
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}

