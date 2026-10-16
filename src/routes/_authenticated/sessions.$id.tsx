import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { accuracyLabel, scopeLabel } from "@/lib/safety/constants";

export const Route = createFileRoute("/_authenticated/sessions/$id")({
  head: () => ({ meta: [{ title: "Live session — World Crime Unicorn" }, { name: "description", content: "Secure live location map." }] }),
  component: SessionView,
});

type Point = { lat: number; lng: number; accuracy: number | null; speed: number | null; recorded_at: string };

function SessionView() {
  const { id } = Route.useParams();
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [now, setNow] = React.useState(Date.now());
  const [latest, setLatest] = React.useState<Point | null>(null);
  const [sharing, setSharing] = React.useState(false);
  const [geoError, setGeoError] = React.useState<string | null>(null);
  const [viewerEmail, setViewerEmail] = React.useState("");
  const lastSent = React.useRef(0);

  const session = useQuery({
    queryKey: ["session", id],
    queryFn: async () => (await supabase.from("location_sessions").select("*").eq("id", id).maybeSingle()).data,
  });
  const s = session.data;
  const owner = s?.owner_id === user.id;
  const live = !!s && !s.ended_at && !s.anonymised && new Date(s.planned_end_at).getTime() > now;

  const viewers = useQuery({
    queryKey: ["viewers", id],
    enabled: owner,
    queryFn: async () => (await supabase.from("session_viewers").select("viewer_id").eq("session_id", id)).data ?? [],
  });

  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // load last point, log the view, and subscribe to updates
  React.useEffect(() => {
    if (!s) return;
    supabase.rpc("log_location_view", { _sid: id });
    supabase.from("location_updates").select("*").eq("session_id", id).order("recorded_at", { ascending: false }).limit(1)
      .then(({ data }) => data?.[0] && setLatest(data[0]));
    const ch = supabase
      .channel(`loc-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "location_updates", filter: `session_id=eq.${id}` }, (p) => setLatest(p.new as Point))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "location_sessions", filter: `id=eq.${id}` }, () => qc.invalidateQueries({ queryKey: ["session", id] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [s?.id, id, qc]);

  // owner: share device location while live
  React.useEffect(() => {
    if (!owner || !live || !sharing) return;
    if (!("geolocation" in navigator)) { setGeoError("This device can't share its location."); return; }
    const w = navigator.geolocation.watchPosition(
      async (pos) => {
        setGeoError(null);
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, speed: pos.coords.speed, recorded_at: new Date().toISOString() };
        setLatest(p);
        if (Date.now() - lastSent.current < 8000) return;
        lastSent.current = Date.now();
        await supabase.from("location_updates").insert({ session_id: id, lat: p.lat, lng: p.lng, accuracy: p.accuracy, speed: p.speed });
      },
      (err) => {
        setSharing(false);
        setGeoError(err.code === 1
          ? "Location permission was blocked. Open your browser's site settings, allow Location, then tap Share again."
          : "We couldn't get your location. Move somewhere with a clearer sky view and retry.");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(w);
  }, [owner, live, sharing, id]);

  const stop = async () => {
    setSharing(false);
    const { error } = await supabase.from("location_sessions").update({ ended_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Sharing stopped — viewers no longer have access");
    await qc.invalidateQueries({ queryKey: ["session", id] });
  };

  const addViewer = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.rpc("add_session_viewer", { _sid: id, _email: viewerEmail });
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data) {
      toast.error("No account found with that email");
      return;
    }
    toast.success("Viewer added");
    setViewerEmail("");
    await qc.invalidateQueries({ queryKey: ["viewers", id] });
  };

  const removeViewer = async (vid: string) => {
    await supabase.from("session_viewers").delete().eq("session_id", id).eq("viewer_id", vid);
    qc.invalidateQueries({ queryKey: ["viewers", id] });
  };

  if (session.isLoading) return <AppShell><p className="p-6 text-sm">Loading…</p></AppShell>;
  if (!s) return (
    <AppShell>
      <ScreenHeader title="Session unavailable" />
      <p className="text-sm text-muted-foreground">This session has ended or you no longer have access.</p>
      <Link to="/sessions" className="mt-4 inline-block text-neon">Back to sessions</Link>
    </AppShell>
  );

  const remaining = Math.max(0, new Date(s.planned_end_at).getTime() - now);
  const acc = accuracyLabel(latest?.accuracy);
  const d = latest ? Math.max(0.002, (latest.accuracy ?? 100) / 111000 * 3) : 0;
  const mapSrc = latest
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${latest.lng - d},${latest.lat - d},${latest.lng + d},${latest.lat + d}&layer=mapnik&marker=${latest.lat},${latest.lng}`
    : null;

  return (
    <AppShell>
      <ScreenHeader title={s.purpose} subtitle={scopeLabel(s.scope)} />
      {live ? (
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-safe/60 bg-safe/10 p-3">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-safe" />
          <div className="flex-1 text-xs">
            <p className="font-semibold">Live location sharing is active</p>
            <p className="text-muted-foreground">Ends {new Date(s.planned_end_at).toLocaleTimeString()} · {Math.floor(remaining / 60000)}m {Math.floor((remaining % 60000) / 1000)}s left</p>
          </div>
          {owner && <button onClick={stop} className="min-h-12 rounded-xl bg-alert px-4 text-xs font-bold text-alert-foreground">STOP</button>}
        </div>
      ) : (
        <p className="mb-3 rounded-2xl border border-border p-3 text-xs text-muted-foreground">This session has ended. Viewers can no longer see it.</p>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-border">
        {mapSrc ? (
          <>
            <iframe title="Live location map" src={mapSrc} className="h-72 w-full bg-surface-2" />
            <div className="pointer-events-none absolute top-1/2 left-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-electric/70 bg-electric/15" />
          </>
        ) : (
          <div className="grid h-72 place-items-center text-sm text-muted-foreground">No location yet</div>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className={acc.tone}>{acc.text}</span>
        {latest && <span className="text-muted-foreground">Updated {new Date(latest.recorded_at).toLocaleTimeString()}{latest.speed != null ? ` · ${(latest.speed * 3.6).toFixed(0)} km/h` : ""}</span>}
      </div>

      {owner && live && (
        <>
          {!sharing ? (
            <div className="glass mt-4 rounded-2xl p-4 text-sm">
              <p className="mb-3">We'll ask your device for its location so your viewers can see where you are. It's only used while this session runs.</p>
              <button onClick={() => setSharing(true)} className="min-h-12 w-full rounded-2xl bg-electric font-bold text-electric-foreground">
                {geoError ? "Retry" : "Share my location"}
              </button>
            </div>
          ) : <p className="mt-3 text-xs text-safe">Sending your position every few seconds.</p>}
          {geoError && <p className="mt-2 text-xs text-alert">{geoError}</p>}

          <h2 className="mt-6 mb-2 font-display text-sm font-bold tracking-widest text-muted-foreground">VIEWERS</h2>
          <form onSubmit={addViewer} className="flex gap-2">
            <input type="email" required value={viewerEmail} onChange={(e) => setViewerEmail(e.target.value)} placeholder="Trusted person's email" className="min-w-0 flex-1 rounded-2xl border border-border bg-surface-2/60 px-3 text-sm" />
            <button className="min-h-12 rounded-2xl border border-neon px-4 text-sm text-neon">Add</button>
          </form>
          <p className="mt-1 text-[11px] text-muted-foreground">They need an account. Every time they view your location it's logged.</p>
          {viewers.data?.map((v) => (
            <div key={v.viewer_id} className="mt-2 flex items-center justify-between rounded-xl border border-border p-2 text-xs">
              <span className="truncate">Viewer {v.viewer_id.slice(0, 8)}</span>
              <button onClick={() => removeViewer(v.viewer_id)} className="text-alert">Remove</button>
            </div>
          ))}
        </>
      )}
    </AppShell>
  );
}
