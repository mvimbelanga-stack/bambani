import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Navigation, ShieldCheck, Radar, ScanFace } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { CrisisBroadcastPanel } from "@/components/control-room/CrisisBroadcastPanel";
import { MAP_PINS } from "@/lib/wcu/data";
import { MAX_GPS_ACCURACY_M, MIN_LIVENESS, loadClockIns } from "@/lib/clockin/events";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/control-room")({
  head: () => ({
    meta: [
      { title: "Control Room Dashboard — World Crime Unicorn" },
      { name: "description", content: "Four-panel control room: safe routes, biometric distress feeds, offline mesh and escort relays." },
      { property: "og:title", content: "Control Room — World Crime Unicorn" },
      { property: "og:description", content: "Monitor routes, liveness checks, mesh network and escort views in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ControlRoom,
});

function Panel({ title, badge, tone, icon: Icon, to, children }: {
  title: string; badge: string; tone: string; icon: typeof Radar; to: string; children: React.ReactNode;
}) {
  return (
    <section className="glass flex flex-col rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-border pb-2">
        <h2 className={cn("flex items-center gap-2 text-sm font-semibold uppercase tracking-wide", tone)}>
          <Icon className="h-4 w-4" />{title}
        </h2>
        <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[10px] text-muted-foreground">{badge}</span>
      </div>
      <div className="flex-1 text-sm">{children}</div>
      <Link to={to} className="mt-3 text-xs font-semibold text-neon">Open →</Link>
    </section>
  );
}

function ControlRoom() {
  const [clockIns, setClockIns] = React.useState<ReturnType<typeof loadClockIns>>([]);
  const [online, setOnline] = React.useState(true);
  React.useEffect(() => {
    setClockIns(loadClockIns().slice(0, 4));
    setOnline(navigator.onLine);
  }, []);
  const routes = MAP_PINS.filter((p) => p.kind !== "hotspot").slice(0, 4);

  return (
    <AppShell>
      <ScreenHeader title="Control Room" subtitle="Live operations dashboard" back="/home" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Safe-Routing Overlays" badge={`GPS < ${MAX_GPS_ACCURACY_M}m`} tone="text-safe" icon={Navigation} to="/safe-route">
          <div className="grid-map relative h-32 rounded-xl bg-background">
            {MAP_PINS.slice(0, 10).map((p) => (
              <span key={p.id} className={cn("absolute h-2 w-2 rounded-full",
                p.kind === "hotspot" ? "bg-alert" : p.kind === "patrol" ? "bg-electric" : "bg-safe")}
                style={{ left: `${p.x}%`, top: `${p.y}%` }} />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{routes.length} patrollers & safe havens on active routes</p>
        </Panel>

        <Panel title="Biometric & Distress" badge={`Liveness ≥ ${MIN_LIVENESS}`} tone="text-alert" icon={ShieldCheck} to="/safe-mode">
          {clockIns.length ? (
            <ul className="space-y-1">
              {clockIns.map((c) => (
                <li key={c.timestamp} className="flex justify-between text-xs">
                  <span>{new Date(c.timestamp).toLocaleTimeString()}</span>
                  <span className={c.livenessScore >= MIN_LIVENESS ? "text-safe" : "text-alert"}>{c.livenessScore.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-xs text-muted-foreground">No clock-ins on this device yet.</p>}
        </Panel>

        <Panel title="Offline Mesh Topology" badge="WebRTC + BLE (demo)" tone="text-neon" icon={Radar} to="/mesh">
          <p className={online ? "text-electric" : "text-safe"}>{online ? "Cellular network OK" : "Peer-to-peer mode"}</p>
          <p className="mt-1 text-xs text-muted-foreground">4 relay devices within 900 m (simulated)</p>
        </Panel>

        <Panel title="Escort HUD Relays" badge="HTTPS verified" tone="text-violet" icon={ScanFace} to="/escort">
          <ul className="space-y-1 text-xs">
            {routes.map((m) => (
              <li key={m.id} className="flex justify-between">
                <span>{m.kind === "patrol" ? "Patroller" : "Safe haven"}</span><span>{m.distanceKm} km</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Feeds are simulated until a real control room is connected.</p>
    </AppShell>
  );
}
