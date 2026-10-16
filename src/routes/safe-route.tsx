import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Volume2 } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { MAP_PINS } from "@/lib/wcu/data";

export const Route = createFileRoute("/safe-route")({
  head: () => ({
    meta: [
      { title: "Guardian Safe Route — World Crime Unicorn" },
      { name: "description", content: "Route home through patrolled, well-lit, low-incident streets with spoken guidance." },
      { property: "og:title", content: "Guardian Route — World Crime Unicorn" },
      { property: "og:description", content: "Safer walking and driving routes based on live incident data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SafeRoute,
});

type P = { x: number; y: number };
const START: P = { x: 10, y: 90 };
const END: P = { x: 90, y: 10 };

function danger(p: P) {
  return MAP_PINS.filter((m) => m.kind === "hotspot").reduce((s, m) => s + Math.max(0, 22 - Math.hypot(m.x - p.x, m.y - p.y)), 0);
}

/** Bend the straight line away from hotspots by testing offset control points. */
function guardianPath(): P[] {
  let best: P[] = [];
  let bestScore = Infinity;
  for (let off = -40; off <= 40; off += 5) {
    const c = { x: 50 + off, y: 50 + off };
    const pts = Array.from({ length: 21 }, (_, i) => {
      const t = i / 20;
      return { x: (1 - t) ** 2 * START.x + 2 * (1 - t) * t * c.x + t * t * END.x, y: (1 - t) ** 2 * START.y + 2 * (1 - t) * t * c.y + t * t * END.y };
    });
    const score = pts.reduce((s, p) => s + danger(p), 0) + Math.abs(off) * 0.5;
    if (score < bestScore) { bestScore = score; best = pts; }
  }
  return best;
}

function SafeRoute() {
  const path = React.useMemo(guardianPath, []);
  const d = (pts: P[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
  const speak = () => {
    const u = new SpeechSynthesisUtterance("Guardian route started. Approaching a highly patrolled zone. Continue straight along the well lit corridor.");
    speechSynthesis.speak(u);
  };
  return (
    <AppShell>
      <ScreenHeader title="Guardian Route" subtitle="Safest path, not fastest" back="/home" />
      <div className="glass relative aspect-square overflow-hidden rounded-3xl">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <path d={d([START, END])} stroke="var(--muted-foreground)" strokeDasharray="2 2" strokeWidth="0.8" fill="none" />
          <path d={d(path)} stroke="var(--safe)" strokeWidth="1.8" fill="none" style={{ filter: "drop-shadow(0 0 2px var(--safe))" }} />
          {MAP_PINS.map((m) => (
            <circle key={m.id} cx={m.x} cy={m.y} r={m.kind === "hotspot" ? 4 : 2}
              fill={m.kind === "hotspot" ? "var(--alert)" : m.kind === "patrol" ? "var(--electric)" : "var(--safe)"} opacity={m.kind === "hotspot" ? 0.5 : 0.9} />
          ))}
          <circle cx={START.x} cy={START.y} r="2.5" fill="var(--neon)" />
          <circle cx={END.x} cy={END.y} r="2.5" fill="var(--foreground)" />
        </svg>
      </div>
      <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
        <span className="text-safe">━ Guardian Route</span><span>┅ Standard route</span><span className="text-alert">● Hotspot</span>
      </div>
      <p className="mt-3 text-sm">Avoids active incident hotspots · about 3 min longer.</p>
      <button onClick={speak} className="glow-neon mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-neon bg-neon/15 py-3 font-bold text-neon">
        <Volume2 className="h-4 w-4" /> Start with voice guide
      </button>
    </AppShell>
  );
}
