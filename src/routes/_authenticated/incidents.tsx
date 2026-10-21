import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Lock, MapPin, Siren } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/incidents")({
  head: () => ({
    meta: [
      { title: "Sealed Incidents — World Crime Unicorn" },
      { name: "description", content: "Seal incident reports into a court-locked evidence record and see live crime alerts nearby." },
      { property: "og:title", content: "Sealed Incidents — World Crime Unicorn" },
      { property: "og:description", content: "Court-locked incident records and live crime alerts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Incidents,
});

type Alert = { id: string; title: string; description: string; latitude: number; longitude: number; timestamp: string };
type Sealed = { id: string; title: string; description: string; latitude: number; longitude: number; sealed_at: string };

// Public alerts carry an approximate (~1 km) position and no reporter identity.
const approx = (n: number) => Math.round(n * 100) / 100;
const mapsUrl = (lat: number, lng: number) => `https://www.google.com/maps?q=${lat},${lng}`;

function Incidents() {
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [sealed, setSealed] = React.useState<Sealed[]>([]);
  const [title, setTitle] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const channelRef = React.useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadSealed = React.useCallback(async () => {
    const { data } = await supabase
      .from("evidence_vault")
      .select("id,title,description,latitude,longitude,sealed_at")
      .order("sealed_at", { ascending: false })
      .limit(20);
    setSealed(data ?? []);
  }, []);

  React.useEffect(() => {
    loadSealed();
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
    const ch = supabase.channel("global-safety-alerts", { config: { broadcast: { self: true } } });
    ch.on("broadcast", { event: "new-crime-incident" }, ({ payload }) => {
      const a = payload as Alert;
      setAlerts((p) => [a, ...p].slice(0, 30));
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`Crime alert: ${a.title}`, { body: a.description, tag: a.id });
      }
    }).subscribe();
    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [loadSealed]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !desc.trim()) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { data: u } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from("evidence_vault")
          .insert({
            reporter_id: u.user!.id,
            title: title.trim(),
            description: desc.trim(),
            latitude: coords.latitude,
            longitude: coords.longitude,
            hardware_fingerprint: navigator.userAgent,
          })
          .select("id,sealed_at")
          .single();
        if (error || !data) { toast.error("Could not seal the report. Try again."); setBusy(false); return; }
        await channelRef.current?.send({
          type: "broadcast",
          event: "new-crime-incident",
          payload: { id: data.id, title: title.trim(), description: desc.trim(),
            latitude: approx(coords.latitude), longitude: approx(coords.longitude), timestamp: data.sealed_at },
        });
        toast.success("Report sealed and alert sent to app users");
        setTitle(""); setDesc(""); setBusy(false); loadSealed();
      },
      () => { toast.error("Location is needed to seal a report"); setBusy(false); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <AppShell>
      <ScreenHeader title="Sealed Incidents" subtitle="Court-locked records & live alerts" back="/home" />
      <form onSubmit={submit} className="glass space-y-3 rounded-2xl p-4">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-alert"><Lock className="h-4 w-4" />Seal an incident</h2>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="What happened?"
          className="w-full rounded-lg border border-border bg-background p-2.5 text-sm" />
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={5000} rows={3} placeholder="Details"
          className="w-full resize-none rounded-lg border border-border bg-background p-2.5 text-sm" />
        <button disabled={busy} className="w-full rounded-lg bg-alert py-2.5 text-sm font-bold text-alert-foreground disabled:opacity-60">
          {busy ? "Sealing…" : "Seal & broadcast alert"}
        </button>
        <p className="text-[11px] text-muted-foreground">Sealed records can't be edited or deleted. Others see the alert with a rough location only — never your name.</p>
      </form>

      <section className="mt-4">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Siren className="h-4 w-4 text-alert" />Live alerts</h2>
        {alerts.length ? alerts.map((a) => (
          <a key={a.id} href={mapsUrl(a.latitude, a.longitude)} target="_blank" rel="noreferrer" className="glass mb-2 block rounded-xl p-3">
            <p className="text-sm font-semibold">{a.title}</p>
            <p className="text-xs text-muted-foreground">{a.description}</p>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-neon"><MapPin className="h-3 w-3" />Open in Google Maps · {new Date(a.timestamp).toLocaleTimeString()}</p>
          </a>
        )) : <p className="text-xs text-muted-foreground">No alerts since you opened this page.</p>}
      </section>

      <section className="mt-4">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Lock className="h-4 w-4 text-safe" />Your sealed records</h2>
        {sealed.length ? sealed.map((s) => (
          <div key={s.id} className="glass mb-2 rounded-xl p-3">
            <p className="text-sm font-semibold">{s.title}</p>
            <p className="text-xs text-muted-foreground">{s.description}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Sealed {new Date(s.sealed_at).toLocaleString()} · <a className="text-neon" href={mapsUrl(s.latitude, s.longitude)} target="_blank" rel="noreferrer">map</a></p>
          </div>
        )) : <p className="text-xs text-muted-foreground">Nothing sealed yet.</p>}
      </section>
      <p className="mt-4 text-xs text-muted-foreground">To find a person's live position, use the <Link to="/dispatch" className="text-neon">Dispatch Terminal</Link> — it only shows people who share with you.</p>
    </AppShell>
  );
}
