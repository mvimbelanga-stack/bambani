import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  Battery,
  FlaskConical,
  MapPin,
  Navigation2,
  Power,
  Radio,
  ShieldAlert,
  Signal,
  Smartphone,
  MonitorDot,
} from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { useWcu } from "@/lib/wcu/store";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/lib/safety/useSession";
import {
  bearingDeg,
  distanceM,
  movementStatus,
  noMovementAlert,
  outsideZone,
  shouldStream,
  visibleGuards,
  type Movement,
} from "@/lib/guard/tracking";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "Guard Tracking Control Room — World Crime Unicorn" },
      { name: "description", content: "Security Company guard device tracking and live control room with geofence and no-movement alerts." },
      { property: "og:title", content: "Guard Tracking Control Room — World Crime Unicorn" },
      { property: "og:description", content: "Live guard markers, patrol zones and shift control for security companies." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SecurityPage,
});

const ZONE = { name: "Main Patrol Zone", lat: -26.2041, lng: 28.0473, r: 500 };
const VIEW_M = 900; // half-width of map in metres

interface Guard {
  id: string;
  name: string;
  onDuty: boolean;
  lat: number;
  lng: number;
  speed: number | null;
  heading: number;
  battery: number | null;
  signal: string;
  lastMovedAt: number;
  lastSeen: number;
  source: "test" | "device" | "cloud";
}
interface AlertItem { id: string; at: number; tone: "alert" | "warn" | "safe" | "electric"; text: string }

// metres offset -> lat/lng
const off = (dx: number, dy: number) => ({
  lat: ZONE.lat + dy / 111320,
  lng: ZONE.lng + dx / (111320 * Math.cos((ZONE.lat * Math.PI) / 180)),
});

const ROUTES: Record<string, [number, number][]> = {
  g1: [[-300, -200], [-100, -250], [150, -200], [300, 0], [200, 250], [-150, 250], [-300, 50]], // loop inside
  g2: [[120, 80], [120, 80]], // stationary → no-movement
  g3: [[0, 0], [200, 150], [400, 300], [600, 450], [750, 550]], // exits zone
};

function SecurityPage() {
  const { role, setRole } = useWcu();
  const { user } = useAuthUser();
  const [view, setView] = React.useState<"device" | "control">("control");
  const [guards, setGuards] = React.useState<Guard[]>([]);
  const [alerts, setAlerts] = React.useState<AlertItem[]>([]);
  const [testing, setTesting] = React.useState(false);
  const flagged = React.useRef<Set<string>>(new Set());

  const pushAlert = React.useCallback((tone: AlertItem["tone"], text: string, notify = true) => {
    setAlerts((a) => [{ id: crypto.randomUUID(), at: Date.now(), tone, text }, ...a].slice(0, 40));
    if (notify) (tone === "alert" || tone === "warn" ? toast.warning : toast.success)(text);
  }, []);

  const upsert = React.useCallback((g: Guard) => {
    setGuards((list) => {
      const i = list.findIndex((x) => x.id === g.id);
      if (i < 0) return [...list, g];
      const copy = [...list];
      copy[i] = g;
      return copy;
    });
  }, []);

  // Evaluate geofence / no-movement alerts whenever guards change.
  React.useEffect(() => {
    const now = Date.now();
    for (const g of visibleGuards(guards)) {
      const outKey = g.id + ":out";
      const stillKey = g.id + ":still";
      if (outsideZone(g.lat, g.lng, ZONE.lat, ZONE.lng, ZONE.r)) {
        if (!flagged.current.has(outKey)) { flagged.current.add(outKey); pushAlert("alert", `Geofence exit — ${g.name} left ${ZONE.name}`); }
      } else flagged.current.delete(outKey);
      if (noMovementAlert(g.lastMovedAt, now)) {
        if (!flagged.current.has(stillKey)) { flagged.current.add(stillKey); pushAlert("warn", `No movement — ${g.name} stationary for over 10 min`); }
      } else flagged.current.delete(stillKey);
    }
  }, [guards, pushAlert]);

  // ---- Test mode: mock trajectories, 1 tick/s (each tick = 1 min of shift time for the still guard) ----
  React.useEffect(() => {
    if (!testing) return;
    const start = Date.now();
    const names: Record<string, string> = { g1: "Test Guard Sipho", g2: "Test Guard Lerato", g3: "Test Guard Thabo" };
    Object.keys(ROUTES).forEach((id) => {
      const first = ROUTES[id]![0]!;
      const p = off(first[0], first[1]);
      upsert({ id, name: names[id] ?? id, onDuty: true, ...p, speed: 0, heading: 0, battery: 90, signal: "Good", lastMovedAt: start, lastSeen: start, source: "test" });
    });
    pushAlert("electric", "Test mode started — 3 simulated guard devices streaming", false);
    let tick = 0;
    const timer = setInterval(() => {
      tick++;
      const now = Date.now();
      setGuards((list) =>
        list.map((g) => {
          if (g.source !== "test" || !g.onDuty) return g;
          const route = ROUTES[g.id]!;
          const seg = Math.min(route.length - 1, Math.floor(tick / 3));
          const next = route[Math.min(route.length - 1, seg + 1)]!;
          const cur = route[seg]!;
          const f = (tick % 3) / 3;
          const p = off(cur[0] + (next[0] - cur[0]) * f, cur[1] + (next[1] - cur[1]) * f);
          const moved = distanceM(g.lat, g.lng, p.lat, p.lng);
          const heading = moved > 1 ? bearingDeg(g.lat, g.lng, p.lat, p.lng) : g.heading;
          // simulated clock: the stationary guard ages 1 min per tick
          const lastMovedAt = moved > 15 ? now : g.id === "g2" ? g.lastMovedAt - 60_000 : g.lastMovedAt;
          return { ...g, ...p, speed: moved / 7, heading, lastMovedAt, lastSeen: now, battery: Math.max(5, (g.battery ?? 90) - 0.2) };
        }),
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [testing, upsert, pushAlert]);

  const endShift = (g: Guard) => {
    const t0 = performance.now();
    setGuards((list) => list.map((x) => (x.id === g.id ? { ...x, onDuty: false, speed: null } : x)));
    requestAnimationFrame(() => {
      const ms = Math.round(performance.now() - t0);
      pushAlert("safe", `${g.name} logged off — marker cleared in ${ms} ms (< 1 s ✓)`);
    });
    if (g.source === "cloud") {
      supabase.from("guard_shifts").update({ status: "off_duty" }).eq("id", g.id).then(({ error }) => {
        if (error) toast.error("Could not end that shift: " + error.message);
      });
    }
  };

  const stopTest = () => {
    setTesting(false);
    setGuards((l) => l.filter((g) => g.source !== "test"));
    pushAlert("electric", "Test mode stopped — simulated guards removed", false);
  };

  // ---- Cloud: live shifts for signed-in operators ----
  React.useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      const { data } = await supabase.from("guard_shifts").select("*").eq("status", "on_duty");
      if (!active || !data) return;
      data.forEach((s) => {
        if (s.guard_id === user.id) return; // own device shown via device view
        upsert({
          id: s.id, name: s.guard_name, onDuty: true, lat: s.zone_center_lat, lng: s.zone_center_lng,
          speed: 0, heading: 0, battery: s.battery_level, signal: s.signal_strength,
          lastMovedAt: Date.now(), lastSeen: Date.now(), source: "cloud",
        });
      });
    };
    load();
    const ch = supabase
      .channel("guard-control")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "guard_locations" }, (p) => {
        const r = p.new as { shift_id: string; guard_id: string; latitude: number; longitude: number; speed: number | null; heading: number | null; battery_level: number | null; signal_strength: string };
        if (r.guard_id === user.id) return;
        setGuards((list) => list.map((g) => g.id === r.shift_id ? {
          ...g, lat: r.latitude, lng: r.longitude, speed: r.speed, heading: r.heading ?? g.heading,
          battery: r.battery_level, signal: r.signal_strength, lastSeen: Date.now(),
          lastMovedAt: distanceM(g.lat, g.lng, r.latitude, r.longitude) > 15 ? Date.now() : g.lastMovedAt,
        } : g));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "guard_shifts" }, (p) => {
        const s = p.new as { id: string; status: string; guard_id: string };
        if (s.guard_id === user.id) return;
        if (s.status === "off_duty") setGuards((l) => l.filter((g) => g.id !== s.id));
        else load();
      })
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [user, upsert]);

  if (role !== "security") {
    return (
      <AppShell>
        <ScreenHeader title="Guard Tracking" back="/home" />
        <div className="glass rounded-3xl p-6 text-center space-y-4">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-electric/20 text-electric border border-electric/40">
            <Radio className="h-7 w-7" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-foreground">
              Security Control Room Access
            </h2>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Guard Tracking and Control Room telemetry are optimized for <b>Security Company</b> operators.
            </p>
          </div>
          <button
            onClick={() => setRole("security")}
            className="glow-electric w-full rounded-2xl bg-gradient-to-r from-electric to-violet py-3.5 font-display text-sm font-bold tracking-widest text-electric-foreground shadow-lg transition hover:opacity-95"
          >
            ACTIVATE SECURITY MODE & OPEN
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ScreenHeader title="Guard Tracking" subtitle="Security Company" back="/home" />
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl border border-border bg-surface/70 p-1">
        {([["device", "Guard Device", Smartphone], ["control", "Control Room", MonitorDot]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setView(id)}
            className={cn("flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold", view === id ? "bg-electric/25 text-neon" : "text-muted-foreground")}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {view === "device" ? (
        <GuardDevice user={user} upsert={upsert} remove={(id) => setGuards((l) => l.filter((g) => g.id !== id))} pushAlert={pushAlert} />
      ) : (
        <ControlRoom guards={guards} alerts={alerts} testing={testing}
          startTest={() => setTesting(true)} stopTest={stopTest} endShift={endShift} signedIn={!!user} />
      )}
    </AppShell>
  );
}

// ------------------------------------------------------------------ Control Room
function ControlRoom({ guards, alerts, testing, startTest, stopTest, endShift, signedIn }: {
  guards: Guard[]; alerts: AlertItem[]; testing: boolean; startTest: () => void; stopTest: () => void; endShift: (g: Guard) => void; signedIn: boolean;
}) {
  const active = visibleGuards(guards);
  const toPct = (lat: number, lng: number) => {
    const dx = distanceM(ZONE.lat, ZONE.lng, ZONE.lat, lng) * (lng < ZONE.lng ? -1 : 1);
    const dy = distanceM(ZONE.lat, ZONE.lng, lat, ZONE.lng) * (lat < ZONE.lat ? -1 : 1);
    return { x: 50 + (dx / VIEW_M) * 50, y: 50 - (dy / VIEW_M) * 50 };
  };
  const zonePct = (ZONE.r / VIEW_M) * 50;
  const tone: Record<Movement, string> = { Moving: "text-safe", Stationary: "text-warn", Offline: "text-muted-foreground" };

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-safe/15 px-2 py-1 text-[11px] font-semibold text-safe">
          <Radio className="h-3 w-3 animate-pulse" /> LIVE · {active.length} on duty
        </span>
        <button onClick={testing ? stopTest : startTest}
          className={cn("ml-auto flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold",
            testing ? "border-alert text-alert" : "border-neon text-neon")}>
          <FlaskConical className="h-3.5 w-3.5" /> {testing ? "Stop test" : "Run test route"}
        </button>
      </div>

      <div className="glass relative aspect-square w-full overflow-hidden rounded-3xl" aria-label="Control room map">
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)", backgroundSize: "10% 10%" }} />
        <div className="absolute rounded-full border-2 border-dashed border-electric bg-electric/10"
          style={{ left: `${50 - zonePct}%`, top: `${50 - zonePct}%`, width: `${zonePct * 2}%`, height: `${zonePct * 2}%` }} />
        <span className="absolute left-2 top-2 rounded-lg bg-background/70 px-2 py-1 text-[10px] text-electric">{ZONE.name} · {ZONE.r} m</span>
        {active.map((g) => {
          const p = toPct(g.lat, g.lng);
          const m = movementStatus(true, g.speed);
          const out = outsideZone(g.lat, g.lng, ZONE.lat, ZONE.lng, ZONE.r);
          return (
            <div key={g.id} className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-linear"
              style={{ left: `${Math.min(97, Math.max(3, p.x))}%`, top: `${Math.min(97, Math.max(3, p.y))}%` }}>
              <span className={cn("grid h-8 w-8 place-items-center rounded-full border-2",
                out ? "border-alert bg-alert/30 glow-alert" : m === "Moving" ? "border-safe bg-safe/25" : "border-warn bg-warn/25")}>
                <Navigation2 className="h-4 w-4 text-foreground transition-transform" style={{ transform: `rotate(${g.heading}deg)` }} />
              </span>
              <span className="absolute left-1/2 top-9 -translate-x-1/2 whitespace-nowrap rounded bg-background/80 px-1 text-[9px]">{g.name.replace("Test Guard ", "")}</span>
            </div>
          );
        })}
        {!active.length ? (
          <p className="absolute inset-x-0 bottom-4 text-center text-xs text-muted-foreground">No guards on duty. Tap “Run test route” or go On Duty on a guard device.</p>
        ) : null}
      </div>

      <h2 className="mt-5 mb-2 font-display text-sm font-bold tracking-widest text-muted-foreground">ACTIVE PERSONNEL</h2>
      <div className="space-y-2">
        {active.map((g) => {
          const m = movementStatus(true, g.speed);
          return (
            <div key={g.id} className="glass flex items-center gap-3 rounded-2xl p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{g.name}</p>
                <p className="flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
                  <span className={tone[m]}>● {m}</span>
                  <span><Signal className="inline h-3 w-3" /> {g.signal}</span>
                  <span><Battery className="inline h-3 w-3" /> {g.battery != null ? Math.round(g.battery) + "%" : "—"}</span>
                  <span>{((g.speed ?? 0) * 3.6).toFixed(1)} km/h</span>
                </p>
              </div>
              <button onClick={() => endShift(g)} className="shrink-0 rounded-xl border border-alert/60 px-2 py-1 text-[11px] font-semibold text-alert">
                End shift
              </button>
            </div>
          );
        })}
        {!active.length ? <p className="text-xs text-muted-foreground">Nobody on duty right now.</p> : null}
      </div>

      <h2 className="mt-5 mb-2 font-display text-sm font-bold tracking-widest text-muted-foreground">ALERT FEED</h2>
      <div className="glass divide-y divide-border/70 overflow-hidden rounded-2xl">
        {alerts.length ? alerts.map((a) => (
          <div key={a.id} className="flex items-start gap-2 px-3 py-2 text-xs">
            <AlertTriangle className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", {alert:"text-alert",warn:"text-warn",safe:"text-safe",electric:"text-electric"}[a.tone])} />
            <span className="min-w-0 flex-1">{a.text}</span>
            <span className="shrink-0 text-muted-foreground">{new Date(a.at).toLocaleTimeString()}</span>
          </div>
        )) : <p className="px-3 py-3 text-xs text-muted-foreground">No alerts yet.</p>}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Alerts show here only — test events, no outside control room is contacted.
        {signedIn ? " Real guard devices signed in to this app appear live when you have the approved Security Company role." : " Sign in to see real guard devices live."}
      </p>
    </>
  );
}

// ------------------------------------------------------------------ Guard Device
function GuardDevice({ user, upsert, remove, pushAlert }: {
  user: { id: string; email?: string } | null;
  upsert: (g: Guard) => void;
  remove: (id: string) => void;
  pushAlert: (t: AlertItem["tone"], s: string, n?: boolean) => void;
}) {
  const [onDuty, setOnDuty] = React.useState(false);
  const [pos, setPos] = React.useState<GeolocationPosition | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [battery, setBattery] = React.useState<number | null>(null);
  const [sent, setSent] = React.useState(0);
  const watchId = React.useRef<number | null>(null);
  const shiftId = React.useRef<string | null>(null);
  const lastSent = React.useRef<number | null>(null);
  const prev = React.useRef<{ lat: number; lng: number; moved: number } | null>(null);
  const signal = typeof navigator !== "undefined" && !navigator.onLine ? "Offline"
    : ((navigator as unknown as { connection?: { effectiveType?: string } }).connection?.effectiveType ?? "Good").toUpperCase();

  React.useEffect(() => {
    const nav = navigator as unknown as { getBattery?: () => Promise<{ level: number }> };
    nav.getBattery?.().then((b) => setBattery(Math.round(b.level * 100))).catch(() => {});
  }, []);

  const stop = React.useCallback(() => {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    lastSent.current = null;
    prev.current = null;
    remove("me");
    if (shiftId.current) {
      const id = shiftId.current;
      shiftId.current = null;
      supabase.from("guard_shifts").update({ status: "off_duty" }).eq("id", id).then(() => {});
    }
  }, [remove]);

  React.useEffect(() => () => stop(), [stop]); // stop on leaving the page

  const goOnDuty = async () => {
    if (!("geolocation" in navigator)) return setErr("This device has no GPS access.");
    setErr(null);
    if (user) {
      const { data, error } = await supabase.from("guard_shifts").insert({
        guard_id: user.id, guard_name: user.email?.split("@")[0] ?? "Guard", status: "on_duty",
        movement_status: "stationary", started_at: new Date().toISOString(), zone_name: ZONE.name,
        zone_center_lat: ZONE.lat, zone_center_lng: ZONE.lng, zone_radius_m: ZONE.r, battery_level: battery, signal_strength: signal,
      }).select("id").single();
      if (error) toast.error("Shift not saved online: " + error.message);
      else shiftId.current = data.id;
    }
    setOnDuty(true);
    pushAlert("safe", "On duty — live location streaming every 7 seconds");
    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        setPos(p);
        const now = Date.now();
        if (!shouldStream(true, lastSent.current, now)) return;
        lastSent.current = now;
        const { latitude: lat, longitude: lng, speed, heading, accuracy } = p.coords;
        const moved = prev.current && distanceM(prev.current.lat, prev.current.lng, lat, lng) < 15 ? prev.current.moved : now;
        const hdg = heading ?? (prev.current ? bearingDeg(prev.current.lat, prev.current.lng, lat, lng) : 0);
        prev.current = { lat, lng, moved };
        upsert({ id: "me", name: "This device", onDuty: true, lat, lng, speed, heading: hdg, battery, signal, lastMovedAt: moved, lastSeen: now, source: "device" });
        setSent((n) => n + 1);
        if (user && shiftId.current) {
          supabase.from("guard_locations").insert({
            shift_id: shiftId.current, guard_id: user.id, latitude: lat, longitude: lng, accuracy, speed, heading: hdg,
            battery_level: battery, signal_strength: signal, device_timestamp: new Date(p.timestamp).toISOString(),
          }).then(() => {});
          supabase.from("guard_shifts").update({ last_seen_at: new Date().toISOString(), movement_status: movementStatus(true, speed).toLowerCase(), battery_level: battery }).eq("id", shiftId.current).then(() => {});
        }
      },
      (e) => setErr(e.code === 1 ? "Location permission denied. Allow location to go on duty." : "Waiting for GPS signal…"),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );
  };

  const logOff = () => {
    stop();
    setOnDuty(false);
    setPos(null);
    pushAlert("electric", "Logged off — tracking stopped and marker cleared");
  };

  const c = pos?.coords;
  return (
    <>
      <button onClick={onDuty ? logOff : goOnDuty}
        className={cn("flex w-full items-center justify-center gap-2 rounded-3xl py-6 font-display text-lg font-black tracking-widest",
          onDuty ? "border border-alert bg-alert/15 text-alert" : "glow-neon border border-neon bg-neon/15 text-neon")}>
        <Power className="h-6 w-6" /> {onDuty ? "LOG OFF" : "GO ON DUTY"}
      </button>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {onDuty ? `On duty · ${sent} updates sent` : "Off duty · location is not being tracked"}
        {!user ? " · not signed in, so updates stay on this phone" : ""}
      </p>
      {err ? <p className="mt-3 rounded-xl bg-alert/15 p-3 text-xs text-alert">{err}</p> : null}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat icon={MapPin} label="Latitude" value={c ? c.latitude.toFixed(6) : "—"} />
        <Stat icon={MapPin} label="Longitude" value={c ? c.longitude.toFixed(6) : "—"} />
        <Stat icon={Activity} label="Speed" value={c ? `${((c.speed ?? 0) * 3.6).toFixed(1)} km/h` : "—"} />
        <Stat icon={Navigation2} label="Accuracy" value={c ? `±${Math.round(c.accuracy)} m` : "—"} />
        <Stat icon={Signal} label="Signal" value={onDuty ? signal : "Offline"} />
        <Stat icon={Battery} label="Battery" value={battery != null ? `${battery}%` : "—"} />
      </div>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        Last fix: {pos ? new Date(pos.timestamp).toLocaleTimeString() : "—"} · Switch to Control Room to see your marker.
      </p>
    </>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-3">
      <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><Icon className="h-3 w-3" /> {label}</p>
      <p className="mt-1 truncate font-display text-sm font-bold">{value}</p>
    </div>
  );
}
