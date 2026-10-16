import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Compass,
  Flame,
  Layers,
  Locate,
  MapPin,
  Navigation,
  Radio,
  Send,
  ShieldAlert,
  ShieldCheck,
  Siren,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { CrimeHeatmap } from "@/components/wcu/CrimeHeatmap";
import { MAP_PINS, type MapPin as BaseMapPin, type PinKind } from "@/lib/wcu/data";
import { useWcu } from "@/lib/wcu/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Live Crime Map — World Crime Unicorn" },
      { name: "description", content: "Real-time live crime map with GPS tracking, patrols, hotspots and safe zones." },
      { property: "og:title", content: "Live Crime Map — World Crime Unicorn" },
      { property: "og:description", content: "Real-time crime hotspots, moving patrols, and high-accuracy GPS tracking." },
    ],
  }),
  component: MapScreen,
});

interface ExtendedMapPin extends BaseMapPin {
  lat?: number;
  lng?: number;
  isLivePatrol?: boolean;
}

const FILTERS: { id: PinKind; label: string; dot: string }[] = [
  { id: "hotspot", label: "Crime Hotspots", dot: "bg-alert" },
  { id: "patrol", label: "Live Patrols", dot: "bg-electric" },
  { id: "safe", label: "Safe Zones", dot: "bg-safe" },
];

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function MapScreen() {
  const { reports, city } = useWcu();
  const navigate = useNavigate();
  const [on, setOn] = React.useState<PinKind[]>(["hotspot", "patrol", "safe"]);
  const [sel, setSel] = React.useState<ExtendedMapPin | null>(null);
  const [mapMode, setMapMode] = React.useState<"tactical" | "satellite" | "reports">("tactical");
  const [showHeatmap, setShowHeatmap] = React.useState(true);
  const [heatmapIntensity, setHeatmapIntensity] = React.useState(0.85);

  // Real-time High-Accuracy GPS State
  const [userPos, setUserPos] = React.useState<{
    lat: number;
    lng: number;
    acc: number;
    speed: number | null;
    heading: number | null;
  } | null>(null);
  const [locating, setLocating] = React.useState(false);
  const [radarSweep, setRadarSweep] = React.useState(true);

  // Moving patrol units simulation (real-time movement across the tactical grid)
  const [patrolUnits, setPatrolUnits] = React.useState([
    { id: "p5", x: 47, y: 44, heading: 45, dx: 0.4, dy: 0.3 },
    { id: "p6", x: 64, y: 20, heading: 190, dx: -0.3, dy: 0.4 },
    { id: "p-mobile-1", x: 28, y: 72, heading: 90, dx: 0.5, dy: -0.2 },
  ]);

  // Track real GPS location continuously
  React.useEffect(() => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocating(false);
        setUserPos({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          acc: Math.round(pos.coords.accuracy),
          speed: pos.coords.speed,
          heading: pos.coords.heading,
        });
      },
      (err) => {
        setLocating(false);
        console.warn("GPS tracking status:", err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Update real-time patrol positions every 2.5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setPatrolUnits((units) =>
        units.map((u) => {
          let nx = u.x + u.dx;
          let ny = u.y + u.dy;
          let ndx = u.dx;
          let ndy = u.dy;
          if (nx < 15 || nx > 85) ndx = -ndx;
          if (ny < 15 || ny > 85) ndy = -ndy;
          const nextHeading = Math.round((Math.atan2(ndy, ndx) * 180) / Math.PI + 90);
          return { ...u, x: nx, y: ny, dx: ndx, dy: ndy, heading: nextHeading };
        })
      );
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const triggerLocate = () => {
    setLocating(true);
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not supported on this device.");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setUserPos({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          acc: Math.round(pos.coords.accuracy),
          speed: pos.coords.speed,
          heading: pos.coords.heading,
        });
        toast.success(`Locked GPS: ±${Math.round(pos.coords.accuracy)}m accuracy`);
      },
      (err) => {
        setLocating(false);
        toast.error(`GPS Error: ${err.message}. Please allow location access.`);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Compile full set of pins (static + dynamic patrol + user submitted reports)
  const basePins: ExtendedMapPin[] = MAP_PINS.map((p) => {
    const livePatrol = patrolUnits.find((u) => u.id === p.id);
    if (livePatrol) {
      return {
        ...p,
        x: livePatrol.x,
        y: livePatrol.y,
        isLivePatrol: true,
        ago: "Real-time Active",
      };
    }
    return p;
  });

  // Additional live patrol unit
  const extraPatrol = patrolUnits.find((u) => u.id === "p-mobile-1");
  const livePatrols: ExtendedMapPin[] = extraPatrol
    ? [
        {
          id: "p-mobile-1",
          kind: "patrol",
          x: extraPatrol.x,
          y: extraPatrol.y,
          title: "Rapid Response Unit JHB-09",
          detail: "Active vehicle patrol · High visibility route",
          distanceKm: 1.4,
          ago: "Live (Moving)",
          isLivePatrol: true,
        },
      ]
    : [];

  const userReportPins: ExtendedMapPin[] = reports.map((r) => ({
    id: r.id,
    kind: "hotspot" as const,
    x: r.x,
    y: r.y,
    title: `Your report: ${r.category}`,
    detail: r.description || r.location,
    distanceKm: 0.1,
    ago: new Date(r.createdAt).toLocaleTimeString(),
    severity: "high" as const,
  }));

  const allPins = [...basePins, ...livePatrols, ...userReportPins].filter((p) => on.includes(p.kind));

  const dispatchPatrol = (pin: ExtendedMapPin) => {
    toast.success(`Dispatch signal sent to nearest patrol for: ${pin.title}`);
  };

  return (
    <AppShell>
      <ScreenHeader
        title="Live Crime Map"
        subtitle={userPos ? `GPS ±${userPos.acc}m · ${city}` : `Tracking live in ${city}`}
        back="/home"
        right={
          <button
            onClick={triggerLocate}
            disabled={locating}
            className="flex items-center gap-1.5 rounded-full border border-neon/50 bg-neon/15 px-3 py-1.5 text-xs font-semibold text-neon shadow-sm transition hover:bg-neon/25"
            aria-label="Refresh GPS"
          >
            <Locate className={cn("h-3.5 w-3.5", locating && "animate-spin")} />
            <span>{locating ? "Locking…" : "Locate Me"}</span>
          </button>
        }
      />

      {/* Top Filter & View Controls */}
      <div className="mb-3 flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() =>
                setOn((o) => (o.includes(f.id) ? o.filter((x) => x !== f.id) : [...o, f.id]))
              }
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition",
                on.includes(f.id)
                  ? "border-neon bg-neon/10 text-foreground"
                  : "border-border text-muted-foreground opacity-60"
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", f.dot)} /> {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowHeatmap((h) => !h)}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition",
              showHeatmap
                ? "border-alert bg-alert/20 text-alert shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                : "border-border bg-surface text-muted-foreground opacity-60"
            )}
            title="Toggle Real-Time Supabase Crime Heatmap"
          >
            <Flame className="h-3.5 w-3.5" />
            <span>Heatmap</span>
          </button>

          <button
            onClick={() =>
              setMapMode((m) =>
                m === "tactical" ? "satellite" : m === "satellite" ? "reports" : "tactical"
              )
            }
            className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Layers className="h-3.5 w-3.5 text-electric" />
            <span>
              {mapMode === "tactical"
                ? "Satellite"
                : mapMode === "satellite"
                  ? `Reports (${reports.length})`
                  : "Tactical"}
            </span>
          </button>
        </div>
      </div>

      {mapMode === "reports" ? (
        <div className="glass h-[470px] overflow-y-auto rounded-3xl border border-border/80 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div>
              <h2 className="font-display text-sm font-bold text-foreground">Real-Time Incident Register</h2>
              <p className="text-[11px] text-muted-foreground">{reports.length} live reports in {city}</p>
            </div>
            <button
              onClick={() => navigate({ to: "/report" })}
              className="flex items-center gap-1 rounded-xl bg-alert/20 border border-alert/30 px-2.5 py-1 text-xs font-semibold text-alert hover:bg-alert/30"
            >
              <Siren className="h-3.5 w-3.5" /> + New Report
            </button>
          </div>

          <div className="space-y-2.5">
            {reports.map((r) => {
              const distFromUser = userPos && r.lat && r.lng ? calcDistance(userPos.lat, userPos.lng, r.lat, r.lng) : null;
              return (
                <div key={r.id} className="rounded-2xl border border-border bg-surface-2/60 p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-alert/20 border border-alert/30 px-2 py-0.5 text-[10px] font-bold text-alert uppercase">
                        {r.category}
                      </span>
                      <span className="font-mono text-[10px] text-neon">{r.ref}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(r.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-foreground/90 font-medium">{r.description || "No additional description provided."}</p>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                    <span className="truncate max-w-[180px]">📍 {r.location}</span>
                    {distFromUser !== null ? (
                      <span className="font-mono text-neon font-semibold">{distFromUser} km from you</span>
                    ) : (
                      <span className="font-mono">Zone active</span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => {
                        setMapMode("tactical");
                        setSel({
                          id: r.id,
                          kind: "hotspot",
                          x: r.x,
                          y: r.y,
                          title: `${r.category} · ${r.ref}`,
                          detail: r.description,
                          distanceKm: distFromUser ?? 0.1,
                          ago: new Date(r.createdAt).toLocaleTimeString(),
                          severity: "high",
                        });
                      }}
                      className="flex-1 rounded-lg bg-surface border border-border py-1 text-center font-semibold text-[11px] hover:border-neon"
                    >
                      Locate on Radar
                    </button>
                    <button
                      onClick={() => toast.success(`Patrol unit dispatched to ${r.ref}`)}
                      className="flex-1 rounded-lg bg-electric/20 border border-electric/30 py-1 text-center font-semibold text-[11px] text-electric hover:bg-electric/30"
                    >
                      Dispatch Patrol
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Map Canvas / Viewer */
        <div className="glass relative h-[470px] overflow-hidden rounded-3xl border border-border/80 bg-slate-950 shadow-2xl">
          {/* Dynamic Crime Heatmap Density Layer */}
          <CrimeHeatmap userLocation={userPos} intensity={heatmapIntensity} visible={showHeatmap} />
          {mapMode === "satellite" ? (
          <div className="relative h-full w-full">
            <iframe
              title="Live Real Satellite Map"
              src={
                userPos
                  ? `https://maps.google.com/maps?q=${userPos.lat},${userPos.lng}&t=k&z=16&output=embed`
                  : `https://maps.google.com/maps?q=${encodeURIComponent(city)}&t=k&z=14&output=embed`
              }
              className="h-full w-full border-0 opacity-90"
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
          </div>
        ) : (
          <>
            {/* Tactical Radar Grid Background */}
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
                backgroundSize: "36px 36px",
              }}
            />

            {/* Radar Circular Concentric Range Rings */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
              <div className="h-48 w-48 rounded-full border border-neon/40" />
              <div className="absolute h-80 w-80 rounded-full border border-electric/30" />
              <div className="absolute h-[420px] w-[420px] rounded-full border border-violet/20" />
            </div>

            {/* Pulsating Radar Scanner Sweep */}
            {radarSweep && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-[430px] w-[430px] rounded-full border border-neon/10 animate-ping opacity-20" />
              </div>
            )}
          </>
        )}

        {/* Live User GPS Location Pin */}
        {userPos && (
          <div
            style={{ left: "50%", top: "50%" }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-20 flex flex-col items-center"
          >
            <div className="relative flex h-8 w-8 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-75" />
              <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-background bg-neon shadow-lg glow-neon" />
            </div>
            <div className="rounded-full bg-slate-900/90 px-2 py-0.5 text-[9px] font-bold text-neon backdrop-blur border border-neon/30 mt-0.5">
              YOU (±{userPos.acc}m)
            </div>
          </div>
        )}

        {/* Tactical Markers Overlay */}
        {allPins.map((p) => {
          const Icon =
            p.kind === "safe" ? ShieldCheck : p.kind === "patrol" ? Navigation : Siren;
          const isSelected = sel?.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSel(p)}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              className={cn(
                "absolute grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-background shadow-lg transition-transform active:scale-125 z-10",
                p.kind === "safe"
                  ? "bg-safe text-background glow-safe"
                  : p.kind === "patrol"
                    ? "bg-electric text-electric-foreground shadow-[0_0_12px_var(--electric)]"
                    : "bg-alert text-alert-foreground glow-alert",
                isSelected && "scale-125 ring-4 ring-neon ring-offset-2 ring-offset-background",
                p.isLivePatrol && "animate-pulse"
              )}
              aria-label={p.title}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}

        {/* Floating Quick Action Overlay */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-30">
          <Link
            to="/track-me"
            className="glow-neon flex items-center gap-1.5 rounded-full bg-neon px-3 py-1.5 text-xs font-bold text-background shadow-lg transition hover:scale-105"
          >
            <Radio className="h-3.5 w-3.5" /> Track Me
          </Link>
          <Link
            to="/security"
            className="flex items-center gap-1.5 rounded-full border border-electric/40 bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-electric backdrop-blur shadow transition hover:bg-slate-900"
          >
            <Compass className="h-3.5 w-3.5" /> Guards
          </Link>
        </div>

        {/* Live GPS Telemetry Overlay on bottom-left */}
        <div className="pointer-events-none absolute bottom-3 left-3 z-30 rounded-xl bg-slate-950/80 p-2 text-[10px] font-mono text-muted-foreground backdrop-blur border border-slate-800">
          <div className="flex items-center gap-1.5 text-neon font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-neon animate-pulse" />
            <span>REAL-TIME RADAR</span>
          </div>
          {userPos ? (
            <p className="mt-0.5 text-slate-300">
              {userPos.lat.toFixed(4)}, {userPos.lng.toFixed(4)}
            </p>
          ) : (
            <p className="mt-0.5 text-slate-400">Locking sensor stream…</p>
          )}
        </div>
      </div>
      )}

      {/* Selected Pin Details Card */}
      {sel ? (
        <div className="glass mt-3 animate-fade-in rounded-3xl p-4 border border-border">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                    sel.kind === "safe"
                      ? "bg-safe/20 text-safe"
                      : sel.kind === "patrol"
                        ? "bg-electric/20 text-electric"
                        : "bg-alert/20 text-alert"
                  )}
                >
                  {sel.kind}
                </span>
                <p className="text-xs text-muted-foreground">
                  {sel.distanceKm ? `${sel.distanceKm} km away · ` : ""}
                  {sel.ago}
                </p>
              </div>
              <p className="mt-1 font-display text-sm font-bold text-foreground">{sel.title}</p>
            </div>
            <button
              onClick={() => setSel(null)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-2 text-xs text-foreground/85 leading-relaxed">{sel.detail}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {sel.kind === "hotspot" && (
              <button
                onClick={() => dispatchPatrol(sel)}
                className="flex items-center gap-1.5 rounded-xl bg-electric/20 px-3 py-1.5 text-xs font-semibold text-electric border border-electric/30 hover:bg-electric/30 transition"
              >
                <Send className="h-3.5 w-3.5" /> Dispatch Patrol
              </button>
            )}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                sel.title + ", " + city
              )}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-2 transition"
            >
              <Navigation className="h-3.5 w-3.5 text-neon" /> Open Directions
            </a>
            <button
              onClick={() => navigate({ to: "/report" })}
              className="flex items-center gap-1.5 rounded-xl bg-alert/20 px-3 py-1.5 text-xs font-semibold text-alert border border-alert/30 hover:bg-alert/30 transition"
            >
              <ShieldAlert className="h-3.5 w-3.5" /> Report Incident Near Here
            </button>
          </div>
        </div>
      ) : null}

      {/* Prominent Quick Actions Grid (Red Report, Track Me, Patrol) */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Link
          to="/report"
          className="glow-alert flex flex-col items-center justify-center gap-1 rounded-2xl bg-alert py-3 px-2 text-center text-alert-foreground transition active:scale-95 shadow-md"
        >
          <Siren className="h-5 w-5" />
          <span className="font-display text-xs font-black tracking-wider uppercase">REPORT CRIME</span>
        </Link>
        <Link
          to="/track-me"
          className="glow-neon flex flex-col items-center justify-center gap-1 rounded-2xl border border-neon bg-neon/15 py-3 px-2 text-center text-neon transition active:scale-95"
        >
          <Radio className="h-5 w-5" />
          <span className="font-display text-xs font-bold tracking-wider uppercase">TRACK ME</span>
        </Link>
        <Link
          to="/tools/patrol"
          className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-electric/40 bg-electric/15 py-3 px-2 text-center text-electric transition active:scale-95"
        >
          <Navigation className="h-5 w-5" />
          <span className="font-display text-xs font-bold tracking-wider uppercase">PATROL</span>
        </Link>
      </div>
    </AppShell>
  );
}

