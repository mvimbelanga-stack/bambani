import * as React from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { clockInsToCsv, SUPERVISOR_ROLES, type ClockInRow } from "@/lib/clockin/csv";

const ClockInMap = React.lazy(() => import("@/components/clockin/ClockInMap"));

export const Route = createFileRoute("/_authenticated/admin_/dashboard")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.from("user_roles").select("role,status").eq("user_id", context.user.id);
    const ok = (data ?? []).some((r) => r.status === "approved" && (SUPERVISOR_ROLES as readonly string[]).includes(r.role));
    if (!ok) throw redirect({ to: "/account" });
  },
  head: () => ({
    meta: [
      { title: "Supervisor Clock-in Dashboard — World Crime Unicorn" },
      { name: "description", content: "Live patroller clock-ins, liveness scores and GPS map for supervisors." },
      { property: "og:title", content: "Supervisor Clock-in Dashboard" },
      { property: "og:description", content: "Live patroller clock-ins with liveness scores and map." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const q = useQuery({
    queryKey: ["clock_ins"],
    refetchInterval: 5000,
    queryFn: async () => {
      const [rows, profiles] = await Promise.all([
        supabase.from("clock_ins").select("id,user_id,timestamp,latitude,longitude,gps_accuracy,liveness_score,status,face_thumbnail_url").order("timestamp", { ascending: false }).limit(500),
        supabase.from("profiles").select("id,email,display_name"),
      ]);
      if (rows.error) throw rows.error;
      return { rows: rows.data as ClockInRow[], profiles: profiles.data ?? [] };
    },
  });
  const profiles = q.data?.profiles;
  const nameOf = React.useCallback(
    (id: string) => {
      const p = profiles?.find((x) => x.id === id);
      return p?.display_name || p?.email || id.slice(0, 8);
    },
    [profiles],
  );
  const rows = q.data?.rows ?? [];

  const exportCsv = () => {
    const blob = new Blob([clockInsToCsv(rows, nameOf)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `clock-ins-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <AppShell>
      <ScreenHeader title="Clock-in Dashboard" subtitle="Live · refreshes every 5 s" />
      {q.error && <p className="text-sm text-alert">Couldn't load clock-ins. Check your connection.</p>}
      <React.Suspense fallback={<div className="h-80 rounded-xl border border-border" />}>
        <ClockInMap rows={rows} nameOf={nameOf} />
      </React.Suspense>
      <div className="my-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{rows.length} records</span>
        <button onClick={exportCsv} disabled={!rows.length} className="flex min-h-10 items-center gap-2 rounded-xl border border-neon px-3 text-sm text-neon disabled:opacity-40">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>
      {rows.map((r) => (
        <div key={r.id} className="glass mb-2 flex items-center gap-3 rounded-xl p-3 text-xs">
          <span className={`h-2 w-2 rounded-full ${r.status === "approved" ? "bg-safe" : "bg-alert"}`} />
          <div className="min-w-0 flex-1">
            <b className="truncate">{nameOf(r.user_id)}</b>
            <p className="text-muted-foreground">{new Date(r.timestamp).toLocaleString()} · ±{Math.round(r.gps_accuracy)} m</p>
          </div>
          <span className="font-mono">{(r.liveness_score * 100).toFixed(0)}%</span>
        </div>
      ))}
    </AppShell>
  );
}
