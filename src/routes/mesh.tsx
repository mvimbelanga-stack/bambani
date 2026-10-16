import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Radio } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mesh")({
  head: () => ({
    meta: [
      { title: "Resilient Network SOS — World Crime Unicorn" },
      { name: "description", content: "Offline SOS that queues and hops between nearby phones when the network is down." },
      { property: "og:title", content: "Offline Mesh SOS — World Crime Unicorn" },
      { property: "og:description", content: "Send SOS even during load shedding or signal jamming." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Mesh,
});

const PEERS = ["Device A · 80 m", "Device B · 210 m", "Device C · 450 m", "Gateway (Wi-Fi) · 900 m"];

function Mesh() {
  const [online, setOnline] = React.useState(true);
  const [forceOffline, setForceOffline] = React.useState(false);
  const [hops, setHops] = React.useState<number>(-1);
  React.useEffect(() => {
    const u = () => setOnline(navigator.onLine);
    u(); window.addEventListener("online", u); window.addEventListener("offline", u);
    return () => { window.removeEventListener("online", u); window.removeEventListener("offline", u); };
  }, []);
  const offline = forceOffline || !online;

  const send = () => {
    if (!offline) { toast.error("SOS sent directly over mobile network (simulated)"); return; }
    setHops(0);
    PEERS.forEach((_, i) => setTimeout(() => {
      setHops(i + 1);
      if (i === PEERS.length - 1) toast.success("Encrypted SOS reached a connected device and was delivered (simulated)");
    }, (i + 1) * 1200));
  };

  return (
    <AppShell>
      <ScreenHeader title="Resilient Network" subtitle="Offline mesh SOS" back="/home" />
      <div className={cn("mx-auto mt-4 grid h-40 w-40 place-items-center rounded-full border-4 text-center text-sm font-bold",
        offline ? "border-safe text-safe" : "border-electric text-electric")}>
        <span><Radio className="mx-auto mb-1 h-6 w-6" />{offline ? "PEER-TO-PEER" : "CELLULAR OK"}</span>
      </div>
      <label className="mt-4 flex items-center justify-center gap-2 text-sm">
        <input type="checkbox" checked={forceOffline} onChange={(e) => setForceOffline(e.target.checked)} /> Simulate network down
      </label>
      <button onClick={send} className="glow-alert mt-4 w-full rounded-2xl bg-alert py-4 font-display font-black tracking-widest text-alert-foreground">SEND SOS</button>
      {hops >= 0 ? (
        <ol className="glass mt-4 space-y-2 rounded-2xl p-4 text-sm">
          {PEERS.map((p, i) => (
            <li key={p} className={i < hops ? "text-safe" : "text-muted-foreground"}>{i < hops ? "✓" : "…"} Hop {i + 1}: {p}</li>
          ))}
        </ol>
      ) : null}
      <p className="mt-4 text-xs text-muted-foreground">Web browsers can't talk phone-to-phone over Bluetooth, so the hop relay is a demo. A native app build is needed for real mesh delivery.</p>
    </AppShell>
  );
}
