import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Car, ChevronRight, UserSearch, X } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { AI_ALERTS, type AiAlert } from "@/lib/wcu/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "AI Alerts — World Crime Unicorn" },
      {
        name: "description",
        content:
          "AI-powered threat detection: suspicious vehicles, wanted person sightings and emerging crime patterns near you.",
      },
      { property: "og:title", content: "AI Alerts — World Crime Unicorn" },
      {
        property: "og:description",
        content: "Real-time AI intelligence on threats, vehicles and crime patterns in your area.",
      },
    ],
  }),
  component: AlertsScreen,
});

const toneRing: Record<string, string> = {
  alert: "border-alert/60 bg-alert/10",
  electric: "border-electric/60 bg-electric/10",
  violet: "border-violet/60 bg-violet/10",
};
const toneText: Record<string, string> = {
  alert: "text-alert",
  electric: "text-electric",
  violet: "text-violet",
};
const toneIcon: Record<string, typeof AlertTriangle> = {
  alert: AlertTriangle,
  electric: Car,
  violet: UserSearch,
};

function AlertsScreen() {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState<AiAlert | null>(null);

  return (
    <AppShell>
      <ScreenHeader title="AI Alerts" subtitle="Live intelligence feed" back="/home" />

      {/* Vicinity Realtime Banner */}
      <div className="glass mb-3 flex items-center justify-between rounded-2xl border border-neon/40 bg-surface-2/60 p-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-neon" />
          </span>
          <div>
            <span className="font-semibold text-foreground block">Vicinity Push Notification Mesh</span>
            <span className="text-[10px] text-muted-foreground">Supabase Realtime streaming active</span>
          </div>
        </div>
        <span className="rounded-full bg-neon/15 px-2 py-0.5 text-[10px] font-bold text-neon border border-neon/30">
          5 km Radius
        </span>
      </div>

      <div className="space-y-3">
        {AI_ALERTS.map((a) => {
          const Icon = toneIcon[a.tone] ?? AlertTriangle;
          return (
            <article key={a.id} className={cn("rounded-2xl border p-3", toneRing[a.tone])}>
              <div className="flex items-start gap-3">
                <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-background/40", toneText[a.tone])}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className={cn("min-w-0 truncate text-sm font-bold", toneText[a.tone])}>
                      {a.title}
                    </h2>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase",
                        toneRing[a.tone],
                        toneText[a.tone],
                      )}
                    >
                      {a.tone === "alert" ? "High" : a.tone === "electric" ? "Medium" : "Watch"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-foreground/85">{a.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{a.ago}</p>
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                {a.action === "map" ? (
                  <button
                    onClick={() => navigate({ to: "/map" })}
                    className="rounded-xl bg-background/50 px-3 py-1.5 text-xs font-semibold"
                  >
                    View on Map
                  </button>
                ) : null}
                <button
                  onClick={() => setOpen(a)}
                  className="flex items-center gap-1 rounded-xl bg-background/50 px-3 py-1.5 text-xs font-semibold"
                >
                  View Details <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 px-4 pb-24 backdrop-blur-sm">
          <div className="glass w-full max-w-md animate-fade-in rounded-3xl p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
              <h2 className={cn("min-w-0 truncate font-display text-base font-bold", toneText[open.tone])}>
                {open.title}
              </h2>
              <button onClick={() => setOpen(null)} className="shrink-0 text-muted-foreground" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-foreground/85">{open.body}</p>
            <dl className="mt-4 space-y-2">
              {open.meta?.map((m) => (
                <div key={m.label} className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 text-xs">
                  <dt className="text-muted-foreground">{m.label}</dt>
                  <dd className="truncate font-semibold">{m.value}</dd>
                </div>
              ))}
            </dl>
            <button
              onClick={() => navigate({ to: "/map" })}
              className="mt-4 w-full rounded-2xl bg-electric py-3 text-sm font-semibold text-electric-foreground"
            >
              Open on live map
            </button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
