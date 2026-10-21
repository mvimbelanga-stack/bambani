import * as React from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Alert = { id: string; title: string; description: string; latitude: number; longitude: number; timestamp: string };

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
      const url = `https://www.google.com/maps?q=${a.latitude},${a.longitude}`;
      toast.error(`Crime alert: ${a.title}`, {
        description: a.description,
        duration: 15000,
        action: { label: "Map", onClick: () => window.open(url, "_blank") },
      });
      if ("Notification" in window && Notification.permission === "granted") {
        const n = new Notification(`Crime alert: ${a.title}`, { body: a.description, tag: a.id });
        n.onclick = () => window.open(url, "_blank");
      }
    }).subscribe();
    return () => { window.removeEventListener("wcu-incident-send", onSend); supabase.removeChannel(ch); };
  }, []);
  return null;
}
