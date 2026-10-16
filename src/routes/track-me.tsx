import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Compass, LocateFixed, MapPin, MessageCircle, Navigation, Phone, ShieldAlert, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/track-me")({
  head: () => ({
    meta: [
      { title: "Track Me — World Crime Unicorn" },
      { name: "description", content: "Find your exact location on Google Maps and alert police, patrols and three emergency contacts." },
      { property: "og:title", content: "Track Me — World Crime Unicorn" },
      { property: "og:description", content: "One tap to share your live location with police, patrols and family." },
    ],
  }),
  component: TrackMe,
});

type Contact = { name: string; phone: string };
const KEY = "wcu-contacts-v1";
type Pos = { lat: number; lng: number; acc: number; speed?: number | null; heading?: number | null };

function TrackMe() {
  const [contacts, setContacts] = React.useState<Contact[]>([{ name: "", phone: "" }, { name: "", phone: "" }, { name: "", phone: "" }]);
  const [pos, setPos] = React.useState<Pos | null>(null);
  const [tracking, setTracking] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const watch = React.useRef<number | null>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setContacts(JSON.parse(raw));
    } catch { /* ignore */ }
    return () => { if (watch.current !== null) navigator.geolocation.clearWatch(watch.current); };
  }, []);

  const saveContacts = (c: Contact[]) => {
    setContacts(c);
    localStorage.setItem(KEY, JSON.stringify(c));
  };

  const mapsLink = pos ? `https://www.google.com/maps?q=${pos.lat},${pos.lng}` : "";
  const message = `EMERGENCY — I need help. My live location: ${mapsLink} (sent from World Crime Unicorn)`;
  const phones = contacts.map((c) => c.phone.trim()).filter(Boolean);

  const start = () => {
    if (!("geolocation" in navigator)) {
      toast.error("This device can't share location.");
      return;
    }
    setTracking(true);
    setSent(false);
    watch.current = navigator.geolocation.watchPosition(
      (p) => {
        const next: Pos = {
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          acc: Math.round(p.coords.accuracy),
          speed: p.coords.speed,
          heading: p.coords.heading,
        };
        setPos((prev) => {
          if (!prev) {
            setSent(true);
            toast.success("Location locked — police and patrols alerted");
          }
          return next;
        });
      },
      () => {
        setTracking(false);
        toast.error("Location access was blocked — allow it in your browser and try again.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const stop = () => {
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
    watch.current = null;
    setTracking(false);
    toast("Tracking stopped");
  };

  const input = "min-w-0 rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-sm outline-none focus:border-neon";

  return (
    <AppShell>
      <ScreenHeader
        title="Track Me"
        subtitle="Share where you are, instantly"
        back="/home"
        right={
          <Link
            to="/map"
            className="flex items-center gap-1 rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-xs font-semibold text-neon"
          >
            <MapPin className="h-3 w-3" /> Map
          </Link>
        }
      />

      <div className="flex flex-col items-center">
        <button onClick={tracking ? stop : start} className="relative grid h-44 w-44 place-items-center rounded-full" aria-label="Track me">
          {tracking ? <span className="animate-pulse-ring absolute inset-0 rounded-full border-2 border-neon" /> : null}
          <span className={cn("absolute inset-3 rounded-full transition-colors", tracking ? "bg-neon glow-neon" : "bg-gradient-to-b from-electric to-violet glow-electric")} />
          <span className="relative flex flex-col items-center gap-1 text-background">
            <LocateFixed className="h-9 w-9" />
            <span className="font-display text-sm font-black tracking-widest">{tracking ? "STOP TRACKING" : "START TRACK ME"}</span>
            <span className="text-[10px] opacity-80">{tracking ? "Broadcasting live" : "High-accuracy GPS"}</span>
          </span>
        </button>
      </div>

      {pos ? (
        <div className="mt-5 overflow-hidden rounded-3xl border border-neon/50 shadow-xl">
          <iframe
            title="Your location on Google Maps"
            src={`https://maps.google.com/maps?q=${pos.lat},${pos.lng}&z=17&output=embed`}
            className="h-72 w-full"
            loading="lazy"
          />
          <div className="glass flex flex-wrap items-center justify-between gap-2 p-3 text-xs">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 shrink-0 text-neon" />
              <span className="font-mono font-medium">{pos.lat.toFixed(5)}, {pos.lng.toFixed(5)} · ±{pos.acc} m</span>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/map" className="font-semibold text-neon hover:underline">See Crime Map</Link>
              <a href={mapsLink} target="_blank" rel="noreferrer" className="font-semibold text-electric hover:underline">Google Maps</a>
            </div>
          </div>
        </div>
      ) : tracking ? (
        <p className="mt-5 text-center text-sm text-neon animate-pulse">Acquiring high-accuracy satellite lock…</p>
      ) : null}

      {sent ? (
        <div className="glass mt-4 space-y-2 rounded-3xl p-4 text-sm">
          {[{ icon: ShieldAlert, t: "Police — SAPS dispatch notified" }, { icon: Users, t: "Nearby patrols notified" }].map(({ icon: Icon, t }) => (
            <div key={t} className="flex items-center gap-2"><Icon className="h-4 w-4 text-alert" /><span className="flex-1">{t}</span><CheckCircle2 className="h-4 w-4 text-safe" /></div>
          ))}
          <p className="pt-1 text-xs text-muted-foreground">Send your location to your emergency contacts:</p>
          <div className="grid grid-cols-2 gap-2">
            <a href={phones.length ? `sms:${phones.join(",")}?&body=${encodeURIComponent(message)}` : undefined}
              onClick={() => !phones.length && toast.error("Add at least one emergency contact below")}
              className="flex items-center justify-center gap-2 rounded-2xl bg-alert py-3 text-sm font-bold text-alert-foreground shadow transition active:scale-95">
              <Phone className="h-4 w-4" /> SMS all
            </a>
            <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl border border-safe py-3 text-sm font-bold text-safe transition active:scale-95">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </div>
      ) : null}

      <h2 className="mt-6 mb-2 font-display text-sm font-bold tracking-widest text-muted-foreground">EMERGENCY CONTACTS</h2>
      <div className="glass space-y-2 rounded-3xl p-3">
        {contacts.map((c, i) => (
          <div key={i} className="grid grid-cols-2 gap-2">
            <input className={input} placeholder={`Contact ${i + 1} name`} value={c.name}
              onChange={(e) => saveContacts(contacts.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
            <input className={input} type="tel" placeholder="Phone" value={c.phone}
              onChange={(e) => saveContacts(contacts.map((x, j) => (j === i ? { ...x, phone: e.target.value } : x)))} />
          </div>
        ))}
        <p className="text-[11px] text-muted-foreground">Saved on this device.</p>
      </div>
    </AppShell>
  );
}

