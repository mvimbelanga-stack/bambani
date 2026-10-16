import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { MAP_PINS } from "@/lib/wcu/data";

export const Route = createFileRoute("/escort")({
  head: () => ({
    meta: [
      { title: "Digital Escort AR — World Crime Unicorn" },
      { name: "description", content: "Camera view with markers for the nearest patrollers and safe zones." },
      { property: "og:title", content: "Digital Escort — World Crime Unicorn" },
      { property: "og:description", content: "See distance to help through your camera while walking at night." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Escort,
});

function Escort() {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [on, setOn] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [heading, setHeading] = React.useState(0);
  const markers = MAP_PINS.filter((m) => m.kind !== "hotspot").slice(0, 4);

  const start = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play(); }
      setOn(true);
    } catch { setErr("Camera permission is needed for the escort view."); }
  };
  React.useEffect(() => {
    const h = (e: DeviceOrientationEvent) => setHeading(e.alpha ?? 0);
    window.addEventListener("deviceorientation", h);
    return () => {
      window.removeEventListener("deviceorientation", h);
      (videoRef.current?.srcObject as MediaStream | null)?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <AppShell>
      <ScreenHeader title="Digital Escort" subtitle="AR safety markers" back="/home" />
      <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-border bg-surface">
        <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" />
        {on ? markers.map((m, i) => (
          <div key={m.id} className="glass absolute rounded-xl px-2 py-1 text-xs"
            style={{ left: `${(((m.x + heading / 3.6) % 80) + 5)}%`, top: `${15 + i * 18}%` }}>
            <span className={m.kind === "patrol" ? "text-electric" : "text-safe"}>{m.kind === "patrol" ? "Patroller" : "Safe haven"}</span>
            <span className="block font-bold">{m.distanceKm} km</span>
          </div>
        )) : (
          <button onClick={start} className="absolute inset-0 grid place-items-center text-neon">
            <span className="flex flex-col items-center gap-2"><Camera className="h-8 w-8" />Start escort</span>
          </button>
        )}
      </div>
      {err ? <p className="mt-2 text-sm text-alert">{err}</p> : null}
      {on ? <p className="mt-3 text-sm text-safe">Trusted contact watching (simulated) · nearest patroller {markers.find((m) => m.kind === "patrol")?.distanceKm ?? "—"} km</p> : null}
    </AppShell>
  );
}
