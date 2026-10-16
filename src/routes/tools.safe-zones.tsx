import { createFileRoute, Link } from "@tanstack/react-router";
import { Navigation, ShieldCheck } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { MAP_PINS } from "@/lib/wcu/data";

export const Route = createFileRoute("/tools/safe-zones")({
  head: () => ({
    meta: [
      { title: "Safe Zones — World Crime Unicorn" },
      {
        name: "description",
        content: "Find the safest places near you: clinics, schools, police stations and guarded zones.",
      },
      { property: "og:title", content: "Safe Zones — World Crime Unicorn" },
      {
        property: "og:description",
        content: "Nearby clinics, police stations and guarded safe points, sorted by distance.",
      },
    ],
  }),
  component: SafeZones,
});

function SafeZones() {
  const zones = MAP_PINS.filter((p) => p.kind === "safe").sort((a, b) => a.distanceKm - b.distanceKm);

  return (
    <AppShell>
      <ScreenHeader title="Safe Zones" subtitle="Nearest first" back="/home" />

      <ul className="space-y-3">
        {zones.map((z) => (
          <li key={z.id} className="glass flex items-start gap-3 rounded-2xl p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-safe/20 text-safe">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{z.title}</p>
              <p className="text-xs text-muted-foreground">{z.detail}</p>
              <p className="mt-1 text-[11px] text-neon">
                {z.distanceKm.toFixed(1)} km · {z.ago}
              </p>
            </div>
            <Link
              to="/map"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-electric/20 text-electric"
              aria-label={`Show ${z.title} on the map`}
            >
              <Navigation className="h-4 w-4" />
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
