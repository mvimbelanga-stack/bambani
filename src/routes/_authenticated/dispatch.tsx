import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Crosshair, Loader2, Radar, Search, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { accuracyLabel, roleLabel, scopeLabel } from "@/lib/safety/constants";
import { MAX_GPS_ACCURACY_M, gpsAcceptable } from "@/lib/clockin/events";
import { STREAM_INTERVAL_MS, shouldStream } from "@/lib/guard/tracking";
import {
  identifierKind,
  isDispatchRole,
  mapsUrl,
  type DispatchResult,
  type Reading,
} from "@/lib/dispatch/lookup";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dispatch")({
  head: () => ({
    meta: [
      { title: "Dispatch Terminal — World Crime Unicorn" },
      {
        name: "description",
        content: "Live device telemetry behind an accuracy gate, plus a consent-checked fleet directory.",
      },
      { property: "og:title", content: "Dispatch Terminal — World Crime Unicorn" },
      {
        property: "og:description",
        content: "Watch your own device's signal and find only the people who chose to share with you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DispatchTerminal,
});

const isLive = (s: { ended_at: string | null; planned_end_at: string; anonymised: boolean }) =>
  !s.ended_at && !s.anonymised && new Date(s.planned_end_at) > new Date();

const cell = "rounded-xl border border-border bg-surface-2/60 px-3 py-2";

function DispatchTerminal() {
  const { user } = Route.useRouteContext();

  const [reading, setReading] = React.useState<Reading | null>(null);
  const [tracking, setTracking] = React.useState(false);
  const [gpsError, setGpsError] = React.useState<string | null>(null);
  const [accepted, setAccepted] = React.useState(0);
  const [dropped, setDropped] = React.useState(0);
  const [sessionId, setSessionId] = React.useState<string | null>(null);

  const [query, setQuery] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<DispatchResult | null>(null);
  const [refused, setRefused] = React.useState<string | null>(null);

  const watchRef = React.useRef<number | null>(null);
  const sessionRef = React.useRef<string | null>(null);
  const lastSentRef = React.useRef<number | null>(null);

  const roles = useQuery({
    queryKey: ["my-roles", user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("status", "approved");
      return (data ?? []).map((r) => r.role);
    },
  });
  const canLookUp = isDispatchRole(roles.data ?? []);

  const sessions = useQuery({
    queryKey: ["sessions"],
    queryFn: async () =>
      (await supabase.from("location_sessions").select("*").order("started_at", { ascending: false })).data ?? [],
  });
  const mine = (sessions.data ?? []).filter((s) => s.owner_id === user.id && isLive(s));

  const pickSession = (id: string | null) => {
    setSessionId(id);
    sessionRef.current = id;
    lastSentRef.current = null;
  };

  const onPosition = React.useCallback((pos: GeolocationPosition) => {
    const { latitude: lat, longitude: lng, accuracy, speed } = pos.coords;
    if (!gpsAcceptable(accuracy)) {
      setDropped((d) => d + 1);
      return;
    }
    setReading({ lat, lng, accuracy, at: new Date(pos.timestamp).toISOString() });
    setAccepted((a) => a + 1);

    const sid = sessionRef.current;
    if (!sid) return;
    const now = Date.now();
    if (!shouldStream(true, lastSentRef.current, now)) return;
    lastSentRef.current = now;
    void supabase
      .from("location_updates")
      .insert({ session_id: sid, lat, lng, accuracy, speed: speed ?? null, recorded_at: new Date().toISOString() })
      .then(({ error }) => {
        if (error) toast.error(error.message);
      });
  }, []);

  const stop = React.useCallback(() => {
    if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    setTracking(false);
  }, []);

  const start = () => {
    setGpsError(null);
    if (!("geolocation" in navigator)) {
      setGpsError("This browser can't read a GPS signal.");
      return;
    }
    watchRef.current = navigator.geolocation.watchPosition(onPosition, (e) => setGpsError(e.message), {
      enableHighAccuracy: true,
      maximumAge: 5000,
    });
    setTracking(true);
  };

  React.useEffect(() => stop, [stop]);

  const kind = identifierKind(query);
  const canSearch = kind !== "invalid";

  const search = async () => {
    if (!canSearch) {
      setRefused("Enter a full email address, or a phone number with at least 7 digits.");
      return;
    }
    setBusy(true);
    setRefused(null);
    setResult(null);
    const { data, error } = await supabase.rpc("dispatch_locate", { _identifier: query.trim() });
    setBusy(false);
    if (error) {
      setRefused(error.message);
      return;
    }
    setResult((data as unknown as DispatchResult) ?? null);
  };

  return (
    <AppShell>
      <ScreenHeader title="Dispatch Terminal" subtitle="Device signal + fleet directory" back="/home" />

      <section className="glass rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-border pb-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-electric">
            <Smartphone className="h-4 w-4" />
            Device Hardware Matrix
          </h2>
          <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[10px] text-muted-foreground">
            GPS &lt; {MAX_GPS_ACCURACY_M}m
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={cell}>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Latitude</p>
            <p className="tabular-nums text-electric">{reading ? reading.lat.toFixed(5) : "—"}</p>
          </div>
          <div className={cell}>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Longitude</p>
            <p className="tabular-nums text-electric">{reading ? reading.lng.toFixed(5) : "—"}</p>
          </div>
          <div className={cell}>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Accuracy</p>
            <p className={cn(reading ? accuracyLabel(reading.accuracy).tone : "text-muted-foreground")}>
              {reading ? accuracyLabel(reading.accuracy).text : "No fix yet"}
            </p>
          </div>
          <div className={cell}>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Last fix</p>
            <p className="tabular-nums">{reading ? new Date(reading.at).toLocaleTimeString() : "—"}</p>
          </div>
        </div>

        <p className="mt-2 text-xs">
          <span className={tracking ? "text-safe" : "text-muted-foreground"}>
            {tracking ? "TRACKING" : "IDLE"}
          </span>
          <span className="text-muted-foreground">
            {" "}
            · {accepted} fix{accepted === 1 ? "" : "es"} kept · {dropped} dropped as too rough
          </span>
        </p>

        {gpsError ? <p className="mt-2 text-xs text-alert">{gpsError}</p> : null}

        <div className="mt-3 space-y-2">
          {mine.length ? (
            <select
              value={sessionId ?? ""}
              onChange={(e) => pickSession(e.target.value || null)}
              className="w-full rounded-xl border border-border bg-surface-2/60 px-3 py-3 text-sm"
            >
              <option value="">Monitor only — don't upload</option>
              {mine.map((s) => (
                <option key={s.id} value={s.id}>
                  Upload to “{s.purpose}”
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nothing is uploaded unless you are sharing a live session.{" "}
              <Link to="/sessions" className="text-neon">
                Start one
              </Link>{" "}
              to let chosen people follow this device.
            </p>
          )}

          {sessionId ? (
            <p className="text-[11px] text-safe">
              Uploading one point every {Math.round(STREAM_INTERVAL_MS / 1000)} seconds while the signal stays under{" "}
              {MAX_GPS_ACCURACY_M} m.
            </p>
          ) : null}

          <button
            onClick={tracking ? stop : start}
            className={cn(
              "min-h-12 w-full rounded-2xl px-4 font-display text-sm font-bold tracking-widest",
              tracking
                ? "border border-alert/60 text-alert"
                : "glow-electric bg-gradient-to-r from-electric to-violet text-electric-foreground",
            )}
          >
            {tracking ? "STOP TRACKING" : "START TRACKING"}
          </button>
        </div>
      </section>

      <section className="glass mt-4 rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-border pb-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neon">
            <Radar className="h-4 w-4" />
            Fleet Directory Finder
          </h2>
          <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[10px] text-muted-foreground">Consent checked</span>
        </div>

        {roles.isPending ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking your access…
          </p>
        ) : canLookUp ? (
          <>
            <p className="text-xs text-muted-foreground">
              Signed in as {roleLabel((roles.data ?? [])[0] ?? "dispatcher")}. You only ever see a position someone
              shared with you, or a guard on a shift you cover.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                placeholder="Email address or phone number"
                className="min-w-0 flex-1 rounded-xl border border-border bg-surface-2/60 px-3 py-3 text-sm"
              />
              <button
                onClick={search}
                disabled={busy}
                className="grid min-h-12 w-12 shrink-0 place-items-center rounded-xl border border-neon/60 text-neon disabled:opacity-50"
                aria-label="Search the directory"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </button>
            </div>
            {query && !canSearch ? (
              <p className="mt-2 text-[11px] text-warn">That doesn't look like an email address or a full phone number yet.</p>
            ) : null}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            The directory is open to dispatcher, official and security-company accounts.{" "}
            <Link to="/profile" className="text-neon">
              Request a role
            </Link>{" "}
            to use it.
          </p>
        )}

        {refused ? (
          <p className="mt-3 rounded-xl border border-alert/40 bg-alert/10 p-3 text-xs text-alert">{refused}</p>
        ) : null}

        {result ? (
          <div className="mt-3 rounded-2xl border border-safe/40 bg-surface-2/40 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{result.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {[result.email, result.phone].filter(Boolean).join(" · ") || "No contact on file"}
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-safe/20 px-2 py-0.5 text-[10px] text-safe">
                {result.scope ? scopeLabel(result.scope) : "Live"}
              </span>
            </div>

            {result.lat != null && result.lng != null ? (
              <>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className={cell}>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Latitude</p>
                    <p className="tabular-nums text-electric">{result.lat.toFixed(5)}</p>
                  </div>
                  <div className={cell}>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Longitude</p>
                    <p className="tabular-nums text-electric">{result.lng.toFixed(5)}</p>
                  </div>
                </div>
                <p className={cn("mt-2 text-xs", accuracyLabel(result.accuracy).tone)}>
                  {accuracyLabel(result.accuracy).text}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {result.source}
                  {result.zone ? ` · ${result.zone}` : ""}
                  {result.recorded_at ? ` · updated ${new Date(result.recorded_at).toLocaleTimeString()}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-3">
                  <a
                    href={mapsUrl(result.lat, result.lng)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-neon"
                  >
                    Open in Google Maps →
                  </a>
                  {result.session_id ? (
                    <Link to="/sessions/$id" params={{ id: result.session_id }} className="text-xs font-semibold text-electric">
                      Open session →
                    </Link>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="mt-2 text-xs text-warn">They're sharing, but no position has arrived yet.</p>
            )}
          </div>
        ) : null}

        <p className="mt-3 flex items-start gap-2 text-[11px] text-muted-foreground">
          <Crosshair className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Every search is written to the audit trail, including the ones that are refused.
        </p>
      </section>
    </AppShell>
  );
}
