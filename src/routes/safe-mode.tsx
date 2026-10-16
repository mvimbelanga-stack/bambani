import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Mic, ShieldAlert, Timer } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/safe-mode")({
  head: () => ({
    meta: [
      { title: "Safe Mode Dead Man's Switch — World Crime Unicorn" },
      { name: "description", content: "Voice safe word and check-in timer that trigger an emergency alert automatically." },
      { property: "og:title", content: "Safe Mode — World Crime Unicorn" },
      { property: "og:description", content: "Hands-free distress detection with a safe word and check-in timer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SafeMode,
});

type SR = { start: () => void; stop: () => void; continuous: boolean; interimResults: boolean; lang: string; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null };

function SafeMode() {
  const [active, setActive] = React.useState(false);
  const [word, setWord] = React.useState("help me");
  const [minutes, setMinutes] = React.useState(5);
  const [left, setLeft] = React.useState(0);
  const [heard, setHeard] = React.useState("");
  const [triggered, setTriggered] = React.useState<string | null>(null);
  const recRef = React.useRef<SR | null>(null);
  const activeRef = React.useRef(false);

  const trigger = React.useCallback((reason: string) => {
    setTriggered(reason);
    setActive(false);
    navigator.geolocation?.getCurrentPosition(
      (p) => toast.error(`EMERGENCY (simulated): ${reason} · GPS ${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)} sent to patrollers`),
      () => toast.error(`EMERGENCY (simulated): ${reason} · alert sent to patrollers`),
    );
  }, []);

  React.useEffect(() => {
    activeRef.current = active;
    if (!active) { recRef.current?.stop(); return; }
    setLeft(minutes * 60);
    const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (Ctor) {
      const rec = new Ctor();
      rec.continuous = true; rec.interimResults = true; rec.lang = "en-ZA";
      rec.onresult = (e) => {
        const text = Array.from(e.results).map((r) => r[0]?.transcript ?? "").join(" ").toLowerCase();
        setHeard(text.slice(-80));
        if (word.trim() && text.includes(word.trim().toLowerCase())) trigger(`Safe word "${word}" heard`);
      };
      rec.onend = () => { if (activeRef.current) try { rec.start(); } catch { /* restarting */ } };
      try { rec.start(); recRef.current = rec; } catch { toast("Microphone unavailable — timer only"); }
    } else toast("Voice listening not supported on this browser — timer only");
    return () => recRef.current?.stop();
  }, [active, minutes, word, trigger]);

  React.useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setLeft((l) => {
      if (l <= 1) { trigger("Missed check-in"); return 0; }
      return l - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [active, trigger]);

  return (
    <AppShell>
      <ScreenHeader title="Safe Mode" subtitle="Dead man's switch" back="/home" />
      <button
        onClick={() => { setTriggered(null); setActive((v) => !v); }}
        className={cn("mx-auto mt-4 grid h-44 w-44 place-items-center rounded-full border-2 font-display text-lg font-black tracking-widest",
          active ? "glow-neon border-neon bg-neon/15 text-neon" : "border-border bg-surface text-muted-foreground")}
      >
        {active ? "SAFE MODE ON" : "TURN ON"}
      </button>

      {active ? (
        <div className="glass mt-6 rounded-2xl p-4 text-center">
          <p className="text-xs text-muted-foreground">Check in before timer ends</p>
          <p className="font-display text-4xl font-black tabular-nums text-neon">
            {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
          </p>
          <button onClick={() => { setLeft(minutes * 60); toast.success("Checked in — you're safe"); }} className="mt-3 w-full rounded-xl bg-safe/20 py-3 font-semibold text-safe">
            I'm safe — check in
          </button>
          <p className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground"><Mic className="h-3 w-3" /> Listening: {heard || "…"}</p>
        </div>
      ) : (
        <div className="glass mt-6 space-y-3 rounded-2xl p-4">
          <label className="block text-sm">Safe word
            <input value={word} onChange={(e) => setWord(e.target.value)} className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2" />
          </label>
          <label className="block text-sm"><Timer className="mr-1 inline h-4 w-4" />Check-in every (minutes)
            <input type="number" min={1} value={minutes} onChange={(e) => setMinutes(Math.max(1, Number(e.target.value)))} className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2" />
          </label>
        </div>
      )}

      {triggered ? (
        <div className="mt-4 rounded-2xl border border-alert bg-alert/15 p-4 text-sm text-alert">
          <ShieldAlert className="mb-1 h-5 w-5" /> Emergency triggered: {triggered}. Location and path shared with nearby patrollers (demo simulation).
        </div>
      ) : null}
      <p className="mt-4 text-xs text-muted-foreground">Keep this screen open — browsers stop listening when the app is closed. Alerts are simulated until a real control room is connected.</p>
    </AppShell>
  );
}
