import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Attachment } from "./media";
import { CITIES, type CrimeCategory, type Role } from "./data";

export type Report = {
  id: string;
  ref: string;
  category: CrimeCategory;
  description: string;
  attachments: Attachment[];
  location: string;
  createdAt: number;
  x: number;
  y: number;
  lat?: number | undefined;
  lng?: number | undefined;
  status?: "pending" | "verified" | "dispatched" | "resolved" | undefined;
};

type State = {
  role: Role | null;
  city: string;
  reports: Report[];
};

type Ctx = State & {
  ready: boolean;
  setRole: (role: Role) => void;
  setCity: (city: string) => void;
  addReport: (r: Omit<Report, "id" | "ref" | "createdAt" | "x" | "y"> & { lat?: number | undefined; lng?: number | undefined }) => Report;
  removeReport: (id: string) => void;
  updateReportStatus: (id: string, status: Report["status"]) => void;
};

const STORAGE_KEY = "wcu-state-v1";
const BROADCAST_KEY = "wcu-reports-channel";

const INITIAL_COMMUNITY_REPORTS: Report[] = [
  {
    id: "rep-seed-1",
    ref: "WCU-748201",
    category: "Theft",
    description: "Catalytic converter theft in commercial parking area. Suspects driving silver sedan.",
    attachments: [],
    location: "Westgate Parking Sector B",
    createdAt: Date.now() - 1000 * 60 * 25,
    x: 42,
    y: 38,
    lat: -26.2054,
    lng: 28.0491,
    status: "verified",
  },
  {
    id: "rep-seed-2",
    ref: "WCU-912440",
    category: "Suspicious Activity",
    description: "Trespassers spotted scouting perimeter security fencing along south railway track.",
    attachments: [],
    location: "South Railway Perimeter",
    createdAt: Date.now() - 1000 * 60 * 55,
    x: 68,
    y: 65,
    lat: -26.212,
    lng: 28.055,
    status: "dispatched",
  },
  {
    id: "rep-seed-3",
    ref: "WCU-381942",
    category: "Robbery",
    description: "Armed street robbery near pedestrian footbridge. Suspects fled towards bus terminal.",
    attachments: [],
    location: "Main Bridge North",
    createdAt: Date.now() - 1000 * 60 * 110,
    x: 28,
    y: 24,
    lat: -26.198,
    lng: 28.038,
    status: "dispatched",
  },
];

const defaultState: State = {
  role: null,
  city: CITIES[0] ?? "Johannesburg, South Africa",
  reports: INITIAL_COMMUNITY_REPORTS,
};

const StoreContext = React.createContext<Ctx | null>(null);

export function WcuProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<State>(defaultState);
  const [ready, setReady] = React.useState(false);
  const broadcastRef = React.useRef<BroadcastChannel | null>(null);

  React.useEffect(() => {
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        broadcastRef.current = new BroadcastChannel(BROADCAST_KEY);
        broadcastRef.current.onmessage = (ev) => {
          if (ev.data && ev.data.type === "SYNC_REPORTS") {
            setState((prev) => ({ ...prev, reports: ev.data.reports }));
          }
        };
      }
    } catch {
      /* BroadcastChannel fallback */
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as State;
        parsed.reports = (parsed.reports ?? []).map((r) => ({
          ...r,
          attachments: (r.attachments ?? []).filter((a) => typeof a === "object"),
        }));
        if (parsed.reports.length === 0) {
          parsed.reports = INITIAL_COMMUNITY_REPORTS;
        }
        setState({ ...defaultState, ...parsed });
      } else {
        setState(defaultState);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);

    return () => {
      broadcastRef.current?.close();
    };
  }, []);

  React.useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      broadcastRef.current?.postMessage({ type: "SYNC_REPORTS", reports: state.reports });
    } catch {
      /* storage unavailable */
    }
  }, [state, ready]);

  const value = React.useMemo<Ctx>(
    () => ({
      ...state,
      ready,
      setRole: (role) => setState((s) => ({ ...s, role })),
      setCity: (city) => setState((s) => ({ ...s, city })),
      addReport: (input) => {
        const report: Report = {
          ...input,
          id: crypto.randomUUID(),
          ref: `WCU-${Math.floor(100000 + Math.random() * 899999)}`,
          createdAt: Date.now(),
          x: input.lat && input.lng ? Math.max(15, Math.min(85, 50 + (input.lng - 28.0473) * 111 * 4)) : 20 + Math.random() * 60,
          y: input.lat && input.lng ? Math.max(15, Math.min(85, 50 - (input.lat - -26.2041) * 111 * 4)) : 20 + Math.random() * 55,
          status: "pending",
        };
        setState((s) => ({ ...s, reports: [report, ...s.reports] }));

        // Broadcast to Supabase Realtime for immediate vicinity push alerts
        try {
          const channel = supabase.channel("incidents-vicinity-stream");
          void channel.send({
            type: "broadcast",
            event: "new_incident",
            payload: {
              id: report.id,
              category: report.category,
              description: report.description,
              location: report.location,
              lat: input.lat ?? -26.2041,
              lng: input.lng ?? 28.0473,
              createdAt: report.createdAt,
              severity: "high",
              source: "supabase-broadcast",
            },
          });
        } catch (err) {
          console.warn("[addReport] Supabase broadcast fallback:", err);
        }

        return report;
      },
      removeReport: (id) => {
        setState((s) => ({ ...s, reports: s.reports.filter((r) => r.id !== id) }));
      },
      updateReportStatus: (id, status) => {
        setState((s) => ({
          ...s,
          reports: s.reports.map((r) => (r.id === id ? { ...r, status } : r)),
        }));
      },
    }),
    [state, ready],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useWcu() {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error("useWcu must be used inside WcuProvider");
  return ctx;
}
