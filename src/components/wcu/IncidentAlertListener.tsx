import * as React from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Alert = { id: string; title: string; description: string; latitude: number; longitude: number; timestamp: string };

let stop: (() => void) | null = null;
function stopAlarm() { stop?.(); stop = null; }
/** Siren tone for up to 30 seconds, or until the alert is dismissed. */
function playAlarm() {
  stopAlarm();
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.2;
    osc.connect(gain).connect(ctx.destination);
    const t = ctx.currentTime;
    for (let i = 0; i < 60; i++) osc.frequency.setValueAtTime(i % 2 ? 660 : 880, t + i * 0.5);
    osc.start(); osc.stop(t + 30);
    stop = () => { try { osc.stop(); } catch { /* already stopped */ } void ctx.close(); };
  } catch { /* audio unavailable */ }
}

/** App-wide listener: every open copy of the app receives sealed-incident alerts. */
export function IncidentAlertListener() {
  React.useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
    const ch = supabase.channel("global-safety-alerts-feed", { config: { broadcast: { self: true } } });
    const onSend = (e: Event) => { void ch.send({ type: "broadcast", event: "new-crime-incident", payload: (e as CustomEvent).detail }); };
    window.addEventListener("wcu-incident-send", onSend);
    ch.on("broadcast", { event: "new-crime-incident" }, ({ payload }) => {
      const a = payload as Alert;
      window.dispatchEvent(new CustomEvent("wcu-incident", { detail: a }));
      playAlarm();
      const url = `https://www.google.com/maps?q=${a.latitude},${a.longitude}`;
      toast.error(`Crime alert: ${a.title}`, {
        description: a.description,
        duration: Infinity,
        closeButton: true,
        onDismiss: stopAlarm,
        action: { label: "Map", onClick: () => window.open(url, "_blank") },
      });
      if ("Notification" in window && Notification.permission === "granted") {
        const n = new Notification(`Crime alert: ${a.title}`, { body: a.description, tag: a.id, requireInteraction: true });
        n.onclick = () => window.open(url, "_blank");
      }
    }).subscribe();
    return () => { window.removeEventListener("wcu-incident-send", onSend); supabase.removeChannel(ch); };
  }, []);
  return null;
}
