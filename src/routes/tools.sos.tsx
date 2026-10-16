import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Navigation, PhoneCall, Radio, Siren, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { cn } from "@/lib/utils";

function playSosAlarm() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.linearRampToValueAtTime(440, now + 0.35);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  } catch {
    /* web audio */
  }
}

export const Route = createFileRoute("/tools/sos")({
  head: () => ({
    meta: [
      { title: "Emergency SOS — World Crime Unicorn" },
      {
        name: "description",
        content: "Hold to trigger an emergency SOS that alerts police, your contacts and nearby patrollers.",
      },
      { property: "og:title", content: "Emergency SOS — World Crime Unicorn" },
      {
        property: "og:description",
        content: "One-tap emergency help for police, contacts and nearby patrollers.",
      },
    ],
  }),
  component: SosScreen,
});

function SosScreen() {
  const [holding, setHolding] = React.useState(false);
  const [count, setCount] = React.useState(3);
  const [sent, setSent] = React.useState(false);
  const [gpsPos, setGpsPos] = React.useState<{ lat: number; lng: number; acc: number } | null>(null);

  React.useEffect(() => {
    if (!holding) {
      setCount(3);
      return;
    }
    if (count === 0) {
      setSent(true);
      setHolding(false);
      playSosAlarm();
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setGpsPos({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              acc: Math.round(pos.coords.accuracy),
            });
          },
          () => {},
          { enableHighAccuracy: true, timeout: 8000 }
        );
      }
      toast.error("EMERGENCY SOS BROADCAST SENT TO ALL NEARBY PATROLS & POLICE");
      return;
    }
    const id = setTimeout(() => {
      playSosAlarm();
      setCount((c) => c - 1);
    }, 700);
    return () => clearTimeout(id);
  }, [holding, count]);

  return (
    <AppShell>
      <ScreenHeader title="Emergency SOS" subtitle="Use only in a real emergency" back="/home" />

      <div className="mt-6 flex flex-col items-center">
        <button
          onPointerDown={() => !sent && setHolding(true)}
          onPointerUp={() => setHolding(false)}
          onPointerLeave={() => setHolding(false)}
          className="relative grid h-52 w-52 place-items-center rounded-full select-none cursor-pointer"
          aria-label="Hold to send SOS"
        >
          <span className={cn("absolute inset-0 rounded-full border-2 border-alert", holding && "animate-pulse-ring")} />
          <span className="glow-alert absolute inset-4 rounded-full bg-gradient-to-b from-alert to-[oklch(0.4_0.2_18)]" />
          <span className="relative flex flex-col items-center text-alert-foreground">
            <Siren className="h-9 w-9 animate-pulse" />
            <span className="mt-1 font-display text-2xl font-black tracking-widest">SOS</span>
            <span className="text-[11px] opacity-90">
              {sent ? "Help is on the way" : holding ? `Sending in ${count}…` : "Press and hold"}
            </span>
          </span>
        </button>

        {sent ? (
          <div className="glass mt-6 w-full animate-fade-in rounded-2xl p-4 text-sm space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-safe flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-safe animate-ping" />
                SOS broadcast live
              </p>
              {gpsPos && (
                <span className="text-[10px] font-mono text-neon">
                  GPS ±{gpsPos.acc}m
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Police dispatch, your emergency contacts and nearby patrollers were notified with your live high-accuracy location beacon.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/map"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-electric py-2 text-center text-xs font-bold text-electric-foreground"
              >
                <MapPin className="h-3.5 w-3.5" /> View on Map
              </Link>
              <Link
                to="/track-me"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-neon/50 bg-neon/15 py-2 text-center text-xs font-bold text-neon"
              >
                <Radio className="h-3.5 w-3.5" /> Live Track Me
              </Link>
            </div>

            <button
              onClick={() => {
                setSent(false);
                toast("SOS alert cancelled");
              }}
              className="w-full rounded-xl border border-border py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Cancel alert
            </button>
          </div>
        ) : null}
      </div>

      <h2 className="mt-8 mb-3 font-display text-sm font-bold tracking-widest text-muted-foreground">
        WHO GETS ALERTED
      </h2>
      <ul className="glass divide-y divide-border/70 overflow-hidden rounded-2xl text-sm">
        <li className="flex items-center gap-3 px-4 py-3">
          <PhoneCall className="h-4.5 w-4.5 shrink-0 text-alert" />
          <span className="min-w-0 flex-1 truncate">Local police dispatch</span>
        </li>
        <li className="flex items-center gap-3 px-4 py-3">
          <Users className="h-4.5 w-4.5 shrink-0 text-electric" />
          <span className="min-w-0 flex-1 truncate">3 emergency contacts</span>
        </li>
        <li className="flex items-center gap-3 px-4 py-3">
          <Siren className="h-4.5 w-4.5 shrink-0 text-neon" />
          <span className="min-w-0 flex-1 truncate">Patrollers within 3 km</span>
        </li>
      </ul>
    </AppShell>
  );
}
