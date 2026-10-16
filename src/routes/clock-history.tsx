import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { type ClockInEvent, loadClockIns } from "@/lib/clockin/events";

export const Route = createFileRoute("/clock-history")({
  head: () => ({
    meta: [
      { title: "Clock-In History — World Crime Unicorn" },
      { name: "description", content: "Past verified shift clock-ins with liveness score and GPS location." },
      { property: "og:title", content: "Clock-In History — World Crime Unicorn" },
      { property: "og:description", content: "Every verified patrol clock-in saved on this device." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: History,
});

function History() {
  const [items, setItems] = React.useState<ClockInEvent[]>([]);
  React.useEffect(() => setItems(loadClockIns()), []);

  return (
    <AppShell>
      <ScreenHeader title="Clock-In History" subtitle={`${items.length} saved on this device`} back="/clock-in" />
      {items.length === 0 ? (
        <div className="glass rounded-3xl p-6 text-center text-sm text-muted-foreground">
          No clock-ins yet. <Link to="/clock-in" className="text-neon underline">Clock in now</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((e) => (
            <li key={e.timestamp} className="glass rounded-2xl p-4 text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-semibold">{new Date(e.timestamp).toLocaleString()}</span>
                <span className="shrink-0 text-safe">Liveness {e.livenessScore.toFixed(2)}</span>
              </div>
              <a
                href={`https://maps.google.com/?q=${e.location.latitude},${e.location.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex items-center gap-1.5 text-xs text-neon"
              >
                <MapPin className="h-3.5 w-3.5" />
                {e.location.latitude.toFixed(5)}, {e.location.longitude.toFixed(5)} · ±{Math.round(e.location.accuracy)} m
              </a>
              <p className="mt-1 truncate text-[11px] text-muted-foreground">
                {e.userId} · IP {e.ipAddress}
              </p>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
