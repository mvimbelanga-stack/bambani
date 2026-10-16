import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { ROLE_INFO, roleLabel, type AppRole } from "@/lib/safety/constants";
import { ACTION_LABEL } from "./activity";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — World Crime Unicorn" }, { name: "description", content: "Approve roles and review audit logs." }] }),
  component: Admin,
});

function Admin() {
  const qc = useQueryClient();
  const [filter, setFilter] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [newRole, setNewRole] = React.useState<AppRole>("patroller");

  const data = useQuery({
    queryKey: ["admin"],
    queryFn: async () => {
      const [roles, profiles, logs] = await Promise.all([
        supabase.from("user_roles").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id,email,display_name"),
        supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(300),
      ]);
      if (roles.error) throw roles.error;
      return { roles: roles.data, profiles: profiles.data ?? [], logs: logs.data ?? [] };
    },
  });
  const who = (id: string | null) => data.data?.profiles.find((p) => p.id === id)?.email ?? (id ? id.slice(0, 8) : "System");

  const setRole = async (user: string, role: AppRole, status: "approved" | "rejected") => {
    const { error } = await supabase.rpc("admin_set_role", { _user: user, _role: role, _status: status });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "approved" ? "Approved" : "Declined");
    await qc.invalidateQueries({ queryKey: ["admin"] });
  };
  const remove = async (user: string, role: AppRole) => {
    const { error } = await supabase.rpc("admin_remove_role", { _user: user, _role: role });
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["admin"] });
  };
  const assign = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = data.data?.profiles.find((x) => x.email?.toLowerCase() === email.trim().toLowerCase());
    if (!p) {
      toast.error("No user with that email");
      return;
    }
    await setRole(p.id, newRole, "approved");
  };

  if (data.error) return <AppShell><ScreenHeader title="Admin" /><p className="text-sm text-muted-foreground">Admins only.</p></AppShell>;

  const pending = data.data?.roles.filter((r) => r.status === "pending") ?? [];
  const granted = data.data?.roles.filter((r) => r.status === "approved" && ROLE_INFO.find((x) => x.id === r.role)?.restricted) ?? [];
  const logs = (data.data?.logs ?? []).filter((l) => !filter || l.action === filter);

  return (
    <AppShell>
      <ScreenHeader title="Admin" subtitle="Roles & audit" />
      <h2 className="mb-2 font-display text-sm font-bold tracking-widest text-muted-foreground">PENDING REQUESTS</h2>
      {pending.length === 0 && <p className="text-xs text-muted-foreground">None.</p>}
      {pending.map((r) => (
        <div key={r.id} className="glass mb-2 flex items-center gap-2 rounded-xl p-3 text-xs">
          <span className="min-w-0 flex-1 truncate">{who(r.user_id)} → <b>{roleLabel(r.role)}</b></span>
          <button onClick={() => setRole(r.user_id, r.role, "approved")} className="min-h-10 rounded-lg bg-safe px-3 text-safe-foreground">Approve</button>
          <button onClick={() => setRole(r.user_id, r.role, "rejected")} className="min-h-10 rounded-lg border border-alert px-3 text-alert">Decline</button>
        </div>
      ))}

      <h2 className="mt-6 mb-2 font-display text-sm font-bold tracking-widest text-muted-foreground">ASSIGN ROLE</h2>
      <form onSubmit={assign} className="flex gap-2">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="User email" className="min-w-0 flex-1 rounded-xl border border-border bg-surface-2/60 px-3 text-sm" />
        <select value={newRole} onChange={(e) => setNewRole(e.target.value as AppRole)} className="rounded-xl border border-border bg-surface-2/60 px-2 text-sm">
          {ROLE_INFO.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        <button className="min-h-12 rounded-xl border border-neon px-3 text-sm text-neon">Assign</button>
      </form>

      <h2 className="mt-6 mb-2 font-display text-sm font-bold tracking-widest text-muted-foreground">RESTRICTED ROLE HOLDERS</h2>
      {granted.map((r) => (
        <div key={r.id} className="mb-1 flex items-center justify-between rounded-xl border border-border p-2 text-xs">
          <span className="truncate">{who(r.user_id)} · {roleLabel(r.role)}</span>
          <button onClick={() => remove(r.user_id, r.role)} className="text-alert">Remove</button>
        </div>
      ))}

      <h2 className="mt-6 mb-2 font-display text-sm font-bold tracking-widest text-muted-foreground">AUDIT LOG</h2>
      <select value={filter} onChange={(e) => setFilter(e.target.value)} className="mb-2 w-full rounded-xl border border-border bg-surface-2/60 p-3 text-sm">
        <option value="">All actions</option>
        {Object.entries(ACTION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      {logs.map((l) => (
        <div key={l.id} className="mb-1 rounded-xl border border-border p-2 text-xs">
          <b>{ACTION_LABEL[l.action] ?? l.action}</b> · {who(l.actor_id)}
          <p className="text-muted-foreground">{new Date(l.created_at).toLocaleString()}{l.target_id ? ` · ${l.target_id.slice(0, 8)}` : ""}</p>
        </div>
      ))}
    </AppShell>
  );
}
