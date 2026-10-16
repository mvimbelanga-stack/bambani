import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { MAP_PINS, type MapPin } from "@/lib/wcu/data";
import { useWcu, type Report } from "@/lib/wcu/store";

export interface HeatmapPoint {
  id: string;
  x: number; // percentage (0 - 100) on map canvas
  y: number; // percentage (0 - 100) on map canvas
  weight: number; // 0.1 to 1.0 intensity
  category?: string;
  lat?: number;
  lng?: number;
}

interface CrimeHeatmapProps {
  userLocation?: { lat: number; lng: number } | null;
  intensity?: number;
  radius?: number;
  visible?: boolean;
  className?: string;
}

export function CrimeHeatmap({
  userLocation,
  intensity = 0.85,
  radius = 45,
  visible = true,
  className,
}: CrimeHeatmapProps) {
  const { reports } = useWcu();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [supabasePoints, setSupabasePoints] = React.useState<HeatmapPoint[]>([]);

  // Fetch real-time incident & patrol location records from Supabase
  React.useEffect(() => {
    let isMounted = true;

    async function fetchSupabaseIncidents() {
      try {
        // Query location updates and guard locations in parallel from Supabase
        const [guardRes, updatesRes] = await Promise.allSettled([
          supabase
            .from("guard_locations")
            .select("id, latitude, longitude, speed, signal_strength, created_at")
            .order("id", { ascending: false })
            .limit(30),
          supabase
            .from("location_updates")
            .select("id, lat, lng, speed, recorded_at")
            .order("id", { ascending: false })
            .limit(30),
        ]);

        const combined: HeatmapPoint[] = [];
        const refLat = userLocation?.lat ?? -26.2041;
        const refLng = userLocation?.lng ?? 28.0473;

        if (guardRes.status === "fulfilled" && !guardRes.value.error && guardRes.value.data) {
          guardRes.value.data.forEach((loc) => {
            const dLat = (loc.latitude - refLat) * 111;
            const dLng = (loc.longitude - refLng) * 111;
            const x = Math.max(10, Math.min(90, 50 + dLng * 7));
            const y = Math.max(10, Math.min(90, 50 - dLat * 7));
            combined.push({
              id: `sb-guard-${loc.id}`,
              x,
              y,
              weight: 0.9,
              category: "Guard Telemetry Hotspot",
              lat: loc.latitude,
              lng: loc.longitude,
            });
          });
        }

        if (updatesRes.status === "fulfilled" && !updatesRes.value.error && updatesRes.value.data) {
          updatesRes.value.data.forEach((upd) => {
            const dLat = (upd.lat - refLat) * 111;
            const dLng = (upd.lng - refLng) * 111;
            const x = Math.max(10, Math.min(90, 50 + dLng * 7));
            const y = Math.max(10, Math.min(90, 50 - dLat * 7));
            combined.push({
              id: `sb-update-${upd.id}`,
              x,
              y,
              weight: 0.75,
              category: "Field Sensor Anomaly",
              lat: upd.lat,
              lng: upd.lng,
            });
          });
        }

        if (isMounted && combined.length > 0) {
          setSupabasePoints(combined);
        }
      } catch (err) {
        console.warn("[CrimeHeatmap] Real-time Supabase query fallback:", err);
      }
    }

    void fetchSupabaseIncidents();

    // Subscribe to realtime updates on guard locations & location_updates
    const channel = supabase
      .channel("heatmap-locations-stream")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "guard_locations" },
        (payload) => {
          const row = payload.new as { id: number; latitude: number; longitude: number };
          const refLat = userLocation?.lat ?? -26.2041;
          const refLng = userLocation?.lng ?? 28.0473;
          const dLat = (row.latitude - refLat) * 111;
          const dLng = (row.longitude - refLng) * 111;
          const x = Math.max(10, Math.min(90, 50 + dLng * 7));
          const y = Math.max(10, Math.min(90, 50 - dLat * 7));

          setSupabasePoints((prev) => [
            {
              id: `sb-guard-${row.id}`,
              x,
              y,
              weight: 1.0,
              category: "Live Reported Anomaly",
              lat: row.latitude,
              lng: row.longitude,
            },
            ...prev.slice(0, 50),
          ]);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "location_updates" },
        (payload) => {
          const row = payload.new as { id: number; lat: number; lng: number };
          const refLat = userLocation?.lat ?? -26.2041;
          const refLng = userLocation?.lng ?? 28.0473;
          const dLat = (row.lat - refLat) * 111;
          const dLng = (row.lng - refLng) * 111;
          const x = Math.max(10, Math.min(90, 50 + dLng * 7));
          const y = Math.max(10, Math.min(90, 50 - dLat * 7));

          setSupabasePoints((prev) => [
            {
              id: `sb-upd-${row.id}`,
              x,
              y,
              weight: 0.85,
              category: "Live Sensor Ping",
              lat: row.lat,
              lng: row.lng,
            },
            ...prev.slice(0, 50),
          ]);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [userLocation]);

  // Combine static pins, user submitted reports, and Supabase incidents
  const allPoints = React.useMemo<HeatmapPoint[]>(() => {
    // 1. Static base crime hotspots
    const staticHotspots: HeatmapPoint[] = MAP_PINS.filter((p) => p.kind === "hotspot").map((p) => ({
      id: p.id,
      x: p.x,
      y: p.y,
      weight: p.severity === "high" ? 0.95 : p.severity === "medium" ? 0.65 : 0.45,
      category: p.title,
    }));

    // 2. Local user submitted incident reports
    const userReports: HeatmapPoint[] = reports.map((r) => ({
      id: r.id,
      x: r.x,
      y: r.y,
      weight: 1.0,
      category: r.category,
    }));

    // 3. Supabase realtime points
    return [...staticHotspots, ...userReports, ...supabasePoints];
  }, [reports, supabasePoints]);

  // Render smooth radial density overlay on canvas
  React.useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions to match display client size
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width || 400;
    const height = rect.height || 470;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Create an offscreen buffer for density accumulation
    const buffer = document.createElement("canvas");
    buffer.width = canvas.width;
    buffer.height = canvas.height;
    const bCtx = buffer.getContext("2d");
    if (!bCtx) return;
    bCtx.scale(dpr, dpr);

    // Draw radial blur circles for each crime point
    allPoints.forEach((pt) => {
      const px = (pt.x / 100) * width;
      const py = (pt.y / 100) * height;
      const r = radius * (0.8 + pt.weight * 0.4);

      const grad = bCtx.createRadialGradient(px, py, 0, px, py, r);
      const alpha = Math.min(1, pt.weight * intensity);
      grad.addColorStop(0, `rgba(255, 0, 0, ${alpha * 0.9})`);
      grad.addColorStop(0.3, `rgba(255, 120, 0, ${alpha * 0.6})`);
      grad.addColorStop(0.7, `rgba(240, 220, 0, ${alpha * 0.25})`);
      grad.addColorStop(1, "rgba(0, 240, 255, 0)");

      bCtx.fillStyle = grad;
      bCtx.beginPath();
      bCtx.arc(px, py, r, 0, Math.PI * 2);
      bCtx.fill();
    });

    // Render buffer with global composite blend
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(buffer, 0, 0, width, height);

    // Subtle thermal heatmap pulse animation
  }, [allPoints, intensity, radius, visible]);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full opacity-80 mix-blend-screen transition-opacity duration-500 ${className || ""}`}
      style={{ filter: "blur(4px)" }}
    />
  );
}
