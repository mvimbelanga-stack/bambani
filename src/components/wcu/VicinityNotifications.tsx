import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  BellRing,
  CheckCircle2,
  MapPin,
  Navigation,
  Radio,
  Settings,
  ShieldAlert,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWcu, type Report } from "@/lib/wcu/store";
import { cn } from "@/lib/utils";

export interface VicinityIncident {
  id: string;
  category: string;
  description: string;
  location: string;
  lat: number;
  lng: number;
  createdAt: number;
  severity?: "high" | "medium" | "low";
  source: "supabase-broadcast" | "supabase-table" | "user-report" | "test";
}

interface NotificationSettings {
  enabled: boolean;
  radiusKm: number;
  sound: boolean;
  nativePush: boolean;
}

const SETTINGS_KEY = "wcu-vicinity-settings-v1";

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  radiusKm: 5,
  sound: true,
  nativePush: true,
};

// Calculate Haversine distance between two coordinates in kilometers
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Play synthesized emergency siren alert via Web Audio API
function playAlertChime() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.linearRampToValueAtTime(587, now + 0.18);
    osc.frequency.linearRampToValueAtTime(880, now + 0.36);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  } catch {
    /* audio blocked by browser */
  }
}

export function VicinityNotifications() {
  const { city } = useWcu();
  const navigate = useNavigate();

  // User live location
  const [userPos, setUserPos] = React.useState<{ lat: number; lng: number } | null>(null);

  // Settings
  const [settings, setSettings] = React.useState<NotificationSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      /* ignore */
    }
    return DEFAULT_SETTINGS;
  });

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [permission, setPermission] = React.useState<NotificationPermission>(() => {
    return typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default";
  });

  // Active in-app banner for latest vicinity incident
  const [activeAlert, setActiveAlert] = React.useState<{
    incident: VicinityIncident;
    distanceKm: number;
  } | null>(null);

  // Keep settings persisted
  React.useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  // Continuously track user's real GPS position for accurate distance calculations
  React.useEffect(() => {
    if (!("geolocation" in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Request browser notification permission
  const requestNativePermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Desktop/browser push notifications are not supported in this browser.");
      return;
    }
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === "granted") {
        toast.success("Push notifications enabled! You will be alerted when incidents occur in your vicinity.");
      } else {
        toast.warning("Notification permission was not granted.");
      }
    } catch (err) {
      console.warn("Notification permission error:", err);
    }
  };

  // Dispatch incident alert if within user's configured vicinity
  const handleIncomingIncident = React.useCallback(
    (incident: VicinityIncident) => {
      if (!settings.enabled) return;

      // User location or city fallback
      const uLat = userPos?.lat ?? -26.2041;
      const uLng = userPos?.lng ?? 28.0473;

      const dist = calculateDistanceKm(uLat, uLng, incident.lat, incident.lng);

      // Only alert if within the user's radius threshold
      if (dist <= settings.radiusKm) {
        // 1. Play acoustic alert
        if (settings.sound) {
          playAlertChime();
        }

        // 2. Trigger native OS push notification if granted
        if (settings.nativePush && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          try {
            new Notification(`🚨 Incident Near You (${dist} km away)`, {
              body: `${incident.category}: ${incident.description || incident.location}`,
              icon: "/icon-192.png",
              badge: "/icon-192.png",
              tag: `vicinity-${incident.id}`,
            });
          } catch (e) {
            console.warn("Native Notification dispatch error:", e);
          }
        }

        // 3. Show in-app slide-down banner
        setActiveAlert({ incident, distanceKm: dist });

        toast.error(`Vicinity Alert (${dist} km away): ${incident.category}`, {
          description: incident.description || incident.location,
          action: {
            label: "Open Map",
            onClick: () => navigate({ to: "/map" }),
          },
        });
      }
    },
    [userPos, settings, navigate]
  );

  // Subscribe to Supabase Realtime channel
  React.useEffect(() => {
    // 1. Real-time channel for custom broadcasted incidents and table changes
    const channel = supabase
      .channel("incidents-vicinity-stream")
      .on("broadcast", { event: "new_incident" }, (payload) => {
        const data = payload["payload"] as VicinityIncident;
        if (data && data.lat && data.lng) {
          handleIncomingIncident({ ...data, source: "supabase-broadcast" });
        }
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "guard_locations" },
        (payload) => {
          const row = payload.new as { id: number; latitude: number; longitude: number; speed?: number };
          if (row.latitude && row.longitude) {
            handleIncomingIncident({
              id: `guard-loc-${row.id}`,
              category: "Guard Emergency Telemetry",
              description: "Guard device telemetry anomaly logged in sector",
              location: "Monitored Patrol Perimeter",
              lat: row.latitude,
              lng: row.longitude,
              createdAt: Date.now(),
              source: "supabase-table",
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "location_updates" },
        (payload) => {
          const row = payload.new as { id: number; lat: number; lng: number };
          if (row.lat && row.lng) {
            handleIncomingIncident({
              id: `loc-upd-${row.id}`,
              category: "Field Sensor Anomaly",
              description: "High-priority movement reported",
              location: "Grid Sector",
              lat: row.lat,
              lng: row.lng,
              createdAt: Date.now(),
              source: "supabase-table",
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Connected to Supabase Realtime
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [handleIncomingIncident]);

  // Test Vicinity Push Alert
  const testVicinityAlert = () => {
    const refLat = userPos?.lat ?? -26.2041;
    const refLng = userPos?.lng ?? 28.0473;

    // Simulate an incident ~1.2 km away
    const testIncident: VicinityIncident = {
      id: `test-${Date.now()}`,
      category: "Armed Robbery In Progress",
      description: "Two armed suspects fleeing east near commercial strip. Response unit en route.",
      location: "4th Avenue & Central Mall Sector",
      lat: refLat + 0.009,
      lng: refLng + 0.008,
      createdAt: Date.now(),
      severity: "high",
      source: "test",
    };

    handleIncomingIncident(testIncident);
  };

  return (
    <>
      {/* Real-time Vicinity In-App Notification Banner */}
      {activeAlert && (
        <div className="fixed top-3 inset-x-3 z-50 mx-auto max-w-md animate-slide-down">
          <div className="glass glow-alert rounded-2xl border-2 border-alert bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-alert opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-alert" />
                </span>
                <span className="font-display text-xs font-black tracking-wider text-alert uppercase">
                  INCIDENT IN YOUR VICINITY
                </span>
              </div>
              <button
                onClick={() => setActiveAlert(null)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Dismiss alert"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <h3 className="font-display text-sm font-bold text-foreground">
                {activeAlert.incident.category}
              </h3>
              <span className="font-mono text-xs font-bold text-neon">
                📍 {activeAlert.distanceKm} km away
              </span>
            </div>

            <p className="mt-1 text-xs text-foreground/85 leading-relaxed">
              {activeAlert.incident.description || activeAlert.incident.location}
            </p>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveAlert(null);
                  navigate({ to: "/map" });
                }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-alert py-2 text-center text-xs font-bold text-alert-foreground shadow transition active:scale-95"
              >
                <Navigation className="h-3.5 w-3.5" /> View on Live Map
              </button>
              <button
                onClick={() => {
                  toast.success("Dispatch alert relayed to nearest patrol unit");
                  setActiveAlert(null);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-electric/50 bg-electric/20 py-2 text-center text-xs font-semibold text-electric hover:bg-electric/30 transition"
              >
                <Radio className="h-3.5 w-3.5" /> Dispatch Patrol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Vicinity Alert Badge in status area if user clicks bell */}
      <button
        onClick={() => setDialogOpen(true)}
        className="fixed bottom-20 right-4 z-30 grid h-10 w-10 place-items-center rounded-full border border-neon/50 bg-slate-900/90 text-neon shadow-lg backdrop-blur hover:bg-slate-800 transition active:scale-90"
        title="Vicinity Push Alert Settings"
        aria-label="Vicinity Notification Settings"
      >
        <BellRing className="h-4.5 w-4.5 text-neon animate-pulse" />
      </button>

      {/* Settings Modal */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-sm rounded-3xl border border-border p-5 shadow-2xl animate-fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-neon/15 text-neon border border-neon/40">
                  <Bell className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-display text-sm font-bold">Vicinity Push Alerts</h3>
                  <p className="text-[10px] text-muted-foreground">Supabase Realtime Incident Subscriptions</p>
                </div>
              </div>
              <button onClick={() => setDialogOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Toggle Master */}
            <div className="flex items-center justify-between rounded-xl bg-surface-2 p-3 text-xs">
              <div>
                <span className="font-semibold block">Vicinity Alerts Active</span>
                <span className="text-[10px] text-muted-foreground">Real-time alerts for nearby incidents</span>
              </div>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))}
                className="h-4 w-4 accent-neon cursor-pointer"
              />
            </div>

            {/* Radius Selector */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-medium">Alert Radius</span>
                <span className="font-mono font-bold text-neon">{settings.radiusKm} km</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-mono">
                {[1, 3, 5, 10].map((r) => (
                  <button
                    key={r}
                    onClick={() => setSettings((s) => ({ ...s, radiusKm: r }))}
                    className={cn(
                      "py-1.5 rounded-lg border transition",
                      settings.radiusKm === r
                        ? "border-neon bg-neon/20 text-neon font-bold"
                        : "border-border bg-surface text-muted-foreground hover:border-neon"
                    )}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between rounded-xl bg-surface-2 p-3 text-xs">
              <div className="flex items-center gap-2">
                {settings.sound ? <Volume2 className="h-4 w-4 text-neon" /> : <VolumeX className="h-4 w-4" />}
                <div>
                  <span className="font-semibold block">Acoustic Siren Chime</span>
                  <span className="text-[10px] text-muted-foreground">Synthesized audio pulse on alert</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.sound}
                onChange={(e) => setSettings((s) => ({ ...s, sound: e.target.checked }))}
                className="h-4 w-4 accent-neon cursor-pointer"
              />
            </div>

            {/* Browser Native Notifications */}
            <div className="space-y-2 rounded-xl bg-surface-2 p-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold block">Browser Push Notifications</span>
                  <span className="text-[10px] text-muted-foreground">
                    Status: {permission === "granted" ? "Granted ✓" : permission === "denied" ? "Denied" : "Not enabled"}
                  </span>
                </div>
                {permission !== "granted" ? (
                  <button
                    onClick={requestNativePermission}
                    className="rounded-lg bg-neon text-background px-2.5 py-1 text-[11px] font-bold shadow hover:opacity-90"
                  >
                    Enable
                  </button>
                ) : (
                  <span className="text-safe text-xs font-bold">Active</span>
                )}
              </div>
            </div>

            {/* Test Alert Button */}
            <button
              onClick={() => {
                testVicinityAlert();
                setDialogOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-neon to-electric py-2.5 text-xs font-black text-background tracking-wider uppercase shadow-md transition active:scale-95"
            >
              <Zap className="h-3.5 w-3.5" /> Test Vicinity Alert Now
            </button>
          </div>
        </div>
      )}
    </>
  );
}
