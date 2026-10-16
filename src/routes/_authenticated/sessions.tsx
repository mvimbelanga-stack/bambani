import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { SCOPE_INFO, scopeLabel, type ConsentScope } from "@/lib/safety/constants";

export const Route = createFileRoute("/_authenticated/sessions")({
  head: () => ({ meta: [{ title: "Live sessions — World Crime Unicorn" }, { name: "description", content: "Start, stop and delete live location sessions." }] }),
  component: Sessions,
});

const isLive = (s: { ended_at: string | null; planned_end_at: string; anonymised: boolean }) =>
  !s.ended_at && !s.anonymised && new Date(s.planned_end_at) > new Date();

function Sessions() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [scope, setScope] = React.useState<ConsentScope>("track_me");
  const [purpose, setPurpose] = React.useState("Walking home");
  const [mins, setMins] = React.useState(30);

  const sessions = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => (await supabase.from("location_sessions").select("*").order("started_at", { ascending: false })).data ?? [],
  });
  const mine = sessions.data?.filter((s) => s.owner_id === user.id) ?? [];
  const shared = sessions.data?.filter((s) => s.owner_id !== user.id && isLive(s)) ?? [];

  const start = async () => {
    const { data, error } = await supabase
      .from("location_sessions")
      .insert({ owner_id: user.id, scope, purpose, planned_end_at: new Date(Date.now() + mins * 60000).toISOString() })
      .select("id")
      .single();
    if (error) {
      toast.error(error.message.includes("Consent") ? "Accept this permission on the Privacy page first." : error.message);
      return;
    }
    navigate({ to: "/sessions/$id", params: { id: data.id } });
  };

  const del = async (id: string) => {
    if (!confirm("Permanently delete this session's location history? This can't be undone.")) return;
    const { error } = await supabase.rpc("delete_my_session", { _sid: id });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Session deleted");
    await qc.invalidateQueries({ queryKey: ["sessions"] });
  };

  const field = "w-full rounded-2xl border border-border bg-surface-2/60 px-3 py-3 text-sm";

  return (
    <AppShell>
      <ScreenHeader title="Live location" subtitle="Time-limited, consent-based sharing" />
      <div className="glass space-y-3 rounded-2xl p-4">
        <select className={field} value={scope} onChange={(e) => setScope(e.target.value as ConsentScope)}>
          {SCOPE_INFO.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <input className={field} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Purpose" />
        <div className="grid grid-cols-3 gap-2">
          {[30, 60, 90].map((m) => (
            <button key={m} onClick={() => setMins(m)} className={`min-h-12 rounded-xl border text-sm ${mins === m ? "border-neon text-neon" : "border-border"}`}>{m} min</button>
          ))}
        </div>
        <button onClick={start} className="glow-electric min-h-12 w-full rounded-2xl bg-gradient-to-r from-electric to-violet font-display text-sm font-bold tracking-widest text-electric-foreground">
          START SESSION
        </button>
        <p className="text-[11px] text-muted-foreground">Needs the matching permission on <Link to="/privacy" className="text-neon">Privacy & consent</Link>.</p>
      </div>

      {shared.length > 0 && (
        <>
          <h2 className="mt-6 mb-2 font-display text-sm font-bold tracking-widest text-muted-foreground">SHARED WITH ME</h2>
          {shared.map((s) => (
            <Link key={s.id} to="/sessions/$id" params={{ id: s.id }} className="glass mb-2 block rounded-2xl p-3">
              <p className="text-sm font-semibold">{s.purpose}</p>
              <p className="text-xs text-safe">Live · ends {new Date(s.planned_end_at).toLocaleTimeString()}</p>
            </Link>
          ))}
        </>
      )}

      <h2 className="mt-6 mb-2 font-display text-sm font-bold tracking-widest text-muted-foreground">MY HISTORY</h2>
      {mine.length === 0 && <p className="text-xs text-muted-foreground">No sessions yet.</p>}
      {mine.map((s) => (
        <div key={s.id} className="glass mb-2 flex items-center gap-3 rounded-2xl p-3">
          <Link to="/sessions/$id" params={{ id: s.id }} className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{s.purpose}</p>
            <p className="text-xs text-muted-foreground">
              {scopeLabel(s.scope)} · {new Date(s.started_at).toLocaleString()} · {isLive(s) ? <span className="text-safe">Live</span> : s.anonymised ? "Deleted" : "Ended"}
            </p>
          </Link>
          {!isLive(s) && !s.anonymised && (
            <button onClick={() => del(s.id)} className="min-h-12 shrink-0 rounded-xl border border-alert/60 px-3 text-xs text-alert">Delete</button>
          )}
        </div>
      ))}
    </AppShell>
  );
}
