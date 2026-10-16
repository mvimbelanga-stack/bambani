import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, MapPin, Send, ShieldAlert, Siren, Volume2, Wifi, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sound-alert")({
  head: () => ({
    meta: [
      { title: "SoundAlert — World Crime Unicorn" },
      { name: "description", content: "One tap. Instant help. Send a loud alarm with your location to every nearby device." },
      { property: "og:title", content: "SoundAlert — World Crime Unicorn" },
      { property: "og:description", content: "One-tap GBV and crime alarms shared live with nearby devices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SoundAlertPage,
});

type AlertType = "gbv" | "crime";
interface AlertMsg { id: string; from: string; type: AlertType; lat: number | null; lng: number | null; at: number }
interface ChatMsg { id: string; from: string; text: string; at: number }

const TYPES: Record<AlertType, { label: string; sub: string }> = {
  gbv: { label: "GBV & Femicide", sub: "Gender-based violence" },
  crime: { label: "Crime & Lawlessness", sub: "Theft, assault, disorder" },
};
const HISTORY_KEY = "wcu-soundalert-v1";

function deviceCode() {
  let id = localStorage.getItem("wcu-device-id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("wcu-device-id", id); }
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

let audioCtx: AudioContext | null = null;
let alarmStop: (() => void) | null = null;
function playAlarm(seconds = 6) {
  alarmStop?.();
  audioCtx ??= new AudioContext();
  const ctx = audioCtx;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  gain.gain.value = 0.25;
  const t = ctx.currentTime;
  for (let i = 0; i < seconds * 2; i++) {
    osc.frequency.setValueAtTime(900, t + i * 0.5);
    osc.frequency.linearRampToValueAtTime(1500, t + i * 0.5 + 0.25);
    osc.frequency.linearRampToValueAtTime(900, t + i * 0.5 + 0.5);
  }
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(t + seconds);
  navigator.vibrate?.([400, 200, 400, 200, 400]);
  alarmStop = () => { try { osc.stop(); } catch { /* already stopped */ } alarmStop = null; };
}

function mapsUrl(a: { lat: number | null; lng: number | null }) {
  return a.lat != null ? `https://maps.google.com/?q=${a.lat},${a.lng}` : null;
}

function SoundAlertPage() {
  const [me, setMe] = React.useState("");
  const [peers, setPeers] = React.useState<string[]>([]);
  const [online, setOnline] = React.useState(false);
  const [gps, setGps] = React.useState<{ lat: number; lng: number } | null>(null);
  const [gpsState, setGpsState] = React.useState<"init" | "ok" | "blocked">("init");
  const [history, setHistory] = React.useState<AlertMsg[]>([]);
  const [incoming, setIncoming] = React.useState<AlertMsg | null>(null);
  const [chat, setChat] = React.useState<ChatMsg[]>([]);
  const [text, setText] = React.useState("");
  const [notif, setNotif] = React.useState<NotificationPermission | "unsupported">("default");
  const chanRef = React.useRef<ReturnType<typeof supabase.channel> | null>(null);

  React.useEffect(() => {
    const code = deviceCode();
    setMe(code);
    try { setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]")); } catch { /* ignore */ }
    setNotif("Notification" in window ? Notification.permission : "unsupported");

    let watch: number | undefined;
    if (navigator.geolocation) {
      watch = navigator.geolocation.watchPosition(
        (p) => { setGps({ lat: p.coords.latitude, lng: p.coords.longitude }); setGpsState("ok"); },
        () => setGpsState("blocked"),
        { enableHighAccuracy: true, maximumAge: 10000 },
      );
    } else setGpsState("blocked");

    const ch = supabase.channel("wcu-soundalert", { config: { presence: { key: code }, broadcast: { self: false } } });
    ch.on("presence", { event: "sync" }, () => setPeers(Object.keys(ch.presenceState()).filter((k) => k !== code)))
      .on("broadcast", { event: "alert" }, ({ payload }) => {
        const a = payload as AlertMsg;
        setIncoming(a);
        playAlarm();
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("🚨 Incoming alert", { body: `${TYPES[a.type].label} — device ${a.from} needs help` });
        }
      })
      .on("broadcast", { event: "chat" }, ({ payload }) => setChat((c) => [...c, payload as ChatMsg].slice(-50)))
      .subscribe(async (status) => {
        setOnline(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") await ch.track({ at: Date.now() });
      });
    chanRef.current = ch;
    return () => {
      if (watch !== undefined) navigator.geolocation.clearWatch(watch);
      void supabase.removeChannel(ch);
      alarmStop?.();
    };
  }, []);

  const saveHistory = (h: AlertMsg[]) => { setHistory(h); localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); };

  const sendAlert = async (type: AlertType) => {
    const a: AlertMsg = { id: crypto.randomUUID(), from: me, type, lat: gps?.lat ?? null, lng: gps?.lng ?? null, at: Date.now() };
    playAlarm(3);
    saveHistory([a, ...history].slice(0, 30));
    const r = await chanRef.current?.send({ type: "broadcast", event: "alert", payload: a });
    if (r === "ok") toast.success(`${TYPES[type].label} alert sent`, { description: `${peers.length} nearby device${peers.length === 1 ? "" : "s"} alerted. Police are not contacted automatically — call 10111 if in danger.` });
    else toast.error("Not connected — alert saved on this phone only. Call 10111.");
  };

  const sendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const m: ChatMsg = { id: crypto.randomUUID(), from: me, text: text.trim().slice(0, 300), at: Date.now() };
    setChat((c) => [...c, m].slice(-50));
    setText("");
    await chanRef.current?.send({ type: "broadcast", event: "chat", payload: m });
  };

  const enableNotif = async () => {
    if (!("Notification" in window)) return;
    const p = await Notification.requestPermission();
    setNotif(p);
    if (p === "granted") new Notification("SoundAlert", { body: "Notifications are on." });
  };

  return (
    <AppShell>
      <ScreenHeader title="SoundAlert" subtitle="One tap. Instant help." back="/home" />

      <div className="glass flex flex-wrap items-center gap-2 rounded-2xl p-3 text-xs">
        <span className="text-muted-foreground">This device: <b className="text-foreground">{me}</b></span>
        <span className={cn("ml-auto flex items-center gap-1", online ? "text-safe" : "text-muted-foreground")}>
          <Wifi className="h-3.5 w-3.5" /> {online ? "Ready" : "Connecting…"}
        </span>
        <span className={cn("flex w-full items-center gap-1", gpsState === "ok" ? "text-neon" : gpsState === "blocked" ? "text-alert" : "text-muted-foreground")}>
          <MapPin className="h-3.5 w-3.5" />
          {gpsState === "ok" && gps ? `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}` : gpsState === "blocked" ? "GPS blocked — allow Location in your browser site settings, then reload" : "Finding location…"}
        </span>
        <div className="flex w-full gap-2 pt-1">
          <button onClick={() => playAlarm(3)} className="flex-1 rounded-xl border border-border bg-surface px-2 py-2"><Volume2 className="mr-1 inline h-3.5 w-3.5" />Test alarm</button>
          <button onClick={() => alarmStop?.()} className="flex-1 rounded-xl border border-border bg-surface px-2 py-2">Stop sound</button>
          {notif !== "granted" && notif !== "unsupported" ? (
            <button onClick={enableNotif} className="flex-1 rounded-xl border border-neon bg-neon/15 px-2 py-2 text-neon"><Bell className="mr-1 inline h-3.5 w-3.5" />Notifications</button>
          ) : null}
        </div>
      </div>

      <h2 className="mt-6 mb-3 font-display text-xs font-bold tracking-widest text-muted-foreground">SELECT EMERGENCY TYPE TO ALERT</h2>
      <div className="grid grid-cols-2 gap-3">
        {(Object.keys(TYPES) as AlertType[]).map((t) => (
          <button key={t} onClick={() => sendAlert(t)} className={cn("glow-alert flex flex-col items-center gap-2 rounded-3xl p-5 text-center text-alert-foreground active:scale-[0.97]", t === "gbv" ? "bg-alert" : "bg-gradient-to-b from-alert to-warn")}>
            {t === "gbv" ? <ShieldAlert className="h-8 w-8" /> : <Siren className="h-8 w-8" />}
            <span className="font-display text-sm font-black tracking-wide">{TYPES[t].label}</span>
            <span className="text-[11px] opacity-90">{TYPES[t].sub}</span>
          </button>
        ))}
      </div>

      <section className="glass mt-6 rounded-2xl p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-xs font-bold tracking-widest text-muted-foreground">NEARBY DEVICES</h2>
          <span className="text-[11px] text-safe">● LIVE</span>
        </div>
        {peers.length ? (
          <div className="flex flex-wrap gap-2">{peers.map((p) => <span key={p} className="rounded-full bg-electric/20 px-3 py-1 text-xs text-electric">{p}</span>)}</div>
        ) : <p className="text-xs text-muted-foreground">No other devices online. Open this page on another phone to test.</p>}
      </section>

      <section className="glass mt-4 rounded-2xl p-4">
        <h2 className="mb-2 font-display text-xs font-bold tracking-widest text-muted-foreground">TEAM CHAT</h2>
        <div className="max-h-48 space-y-1.5 overflow-y-auto text-sm">
          {chat.length ? chat.map((m) => (
            <p key={m.id}><b className={m.from === me ? "text-neon" : "text-electric"}>{m.from === me ? "You" : m.from}:</b> {m.text}</p>
          )) : <p className="text-xs text-muted-foreground">Messages appear here when devices connect.</p>}
        </div>
        <form onSubmit={sendChat} className="mt-3 flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder="Message nearby devices" className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-neon" />
          <button aria-label="Send" className="grid h-10 w-10 place-items-center rounded-xl bg-neon/20 text-neon"><Send className="h-4 w-4" /></button>
        </form>
      </section>

      <section className="glass mt-4 rounded-2xl p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-xs font-bold tracking-widest text-muted-foreground">RECENT ALERTS</h2>
          {history.length ? <button onClick={() => saveHistory([])} className="text-xs text-muted-foreground">Clear all</button> : null}
        </div>
        {history.length ? (
          <ul className="space-y-2 text-sm">
            {history.map((a) => (
              <li key={a.id} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate">{TYPES[a.type].label}</span>
                <span className="text-xs text-muted-foreground">{new Date(a.at).toLocaleTimeString()}</span>
                {mapsUrl(a) ? <a href={mapsUrl(a)!} target="_blank" rel="noreferrer" className="text-xs text-neon">Map</a> : null}
              </li>
            ))}
          </ul>
        ) : <p className="text-xs text-muted-foreground">No alerts sent yet.</p>}
      </section>

      {incoming ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-6 backdrop-blur">
          <div className="glow-alert w-full max-w-sm animate-fade-in rounded-3xl border border-alert bg-surface p-6 text-center">
            <Siren className="mx-auto h-12 w-12 animate-pulse text-alert" />
            <h2 className="mt-3 font-display text-xl font-black text-alert">INCOMING ALERT!</h2>
            <p className="mt-1 text-sm">{TYPES[incoming.type].label} — device {incoming.from} needs help nearby.</p>
            <div className="mt-5 flex gap-2">
              {mapsUrl(incoming) ? <a href={mapsUrl(incoming)!} target="_blank" rel="noreferrer" className="flex-1 rounded-xl bg-neon/20 py-3 text-sm font-bold text-neon">Open in Maps</a> : null}
              <button onClick={() => { alarmStop?.(); setIncoming(null); }} className="flex-1 rounded-xl border border-border py-3 text-sm"><X className="mr-1 inline h-4 w-4" />Dismiss</button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
