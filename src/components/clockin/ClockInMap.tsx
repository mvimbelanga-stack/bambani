import * as React from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ClockInRow } from "@/lib/clockin/csv";

export default function ClockInMap({ rows, nameOf }: { rows: ClockInRow[]; nameOf: (id: string) => string }) {
  const el = React.useRef<HTMLDivElement>(null);
  const map = React.useRef<L.Map | null>(null);
  const layer = React.useRef<L.LayerGroup | null>(null);

  React.useEffect(() => {
    if (!el.current) return;
    map.current = L.map(el.current).setView([-26.2041, 28.0473], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  React.useEffect(() => {
    const g = layer.current;
    if (!g || !map.current) return;
    g.clearLayers();
    const pts: L.LatLngExpression[] = [];
    for (const r of rows) {
      const ok = r.status === "approved";
      const color = ok ? "#22c55e" : "#ef4444";
      L.circle([r.latitude, r.longitude], { radius: r.gps_accuracy, color, weight: 1, fillOpacity: 0.15 }).addTo(g);
      L.circleMarker([r.latitude, r.longitude], { radius: 7, color, fillOpacity: 0.9 })
        .bindPopup(`<b>${nameOf(r.user_id).replace(/</g, "&lt;")}</b><br/>${new Date(r.timestamp).toLocaleString()}<br/>Liveness ${r.liveness_score} · ±${Math.round(r.gps_accuracy)} m · ${r.status}`)
        .addTo(g);
      pts.push([r.latitude, r.longitude]);
    }
    if (pts.length) map.current.fitBounds(L.latLngBounds(pts), { padding: [30, 30], maxZoom: 16 });
  }, [rows, nameOf]);

  return <div ref={el} className="h-80 w-full overflow-hidden rounded-xl border border-border" />;
}
