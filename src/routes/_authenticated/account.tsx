import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronRight, LogOut, MapPin, ShieldCheck, ScrollText, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { ROLE_INFO, type AppRole } from "@/lib/safety/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "My account — World Crime Unicorn" }, { name: "description", content: "Roles, privacy and sign-out." }] }),
  component: Account,
});

function Account() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const roles = useQuery({
    queryKey: ["my-roles"],
    queryFn: async () => (await supabase.from("user_roles").select("role,status").eq("user_id", user.id)).data ?? [],
  });
  const statusOf = (r: AppRole) => roles.data?.find((x) => x.role === r)?.status;
  const isAdmin = statusOf("admin") === "approved";

  const toggle = async (r: AppRole) => {
    const s = statusOf(r);
    const { error } = s && s !== "rejected"
      ? await supabase.rpc("drop_my_role", { _role: r })
      : await supabase.rpc("request_role", { _role: r });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(s && s !== "rejected" ? "Role removed" : ROLE_INFO.find((x) => x.id === r)?.restricted ? "Request sent for admin approval" : "Role added");
    await qc.invalidateQueries({ queryKey: ["my-roles"] });
  };

  const signOut = async (global: boolean) => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut({ scope: global ? "global" : "local" });
    navigate({ to: "/auth", replace: true });
  };

  const links = [
    { to: "/privacy", label: "Privacy & consent", icon: ShieldCheck },
    { to: "/sessions", label: "Live location sessions", icon: MapPin },
    { to: "/activity", label: "My activity log", icon: ScrollText },
    ...(isAdmin ? [{ to: "/admin", label: "Admin: roles & audit", icon: UserCog }] : []),
  ] as const;

  return (
    <AppShell>
      <ScreenHeader title="My account" subtitle={user.email ?? ""} />
      <div className="glass divide-y divide-border/70 overflow-hidden rounded-2xl">
        {links.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex items-center gap-3 px-4 py-3.5">
            <Icon className="h-5 w-5 shrink-0 text-neon" />
            <span className="flex-1 text-sm">{label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>

      <h2 className="mt-6 mb-2 font-display text-sm font-bold tracking-widest text-muted-foreground">MY ROLES</h2>
      <p className="mb-3 text-xs text-muted-foreground">You can hold several roles. Patroller, Dispatcher, Official and Admin need approval.</p>
      <div className="grid grid-cols-2 gap-2">
        {ROLE_INFO.map((r) => {
          const s = statusOf(r.id);
          return (
            <button key={r.id} onClick={() => toggle(r.id)} className={cn("min-h-12 rounded-2xl border p-3 text-left", s === "approved" ? "border-neon glow-neon" : s === "pending" ? "border-warn" : "border-border")}>
              <span className="block text-sm font-semibold">{r.label}</span>
              <span className="text-[11px] text-muted-foreground">
                {s === "approved" ? "Active" : s === "pending" ? "Awaiting approval" : s === "rejected" ? "Declined — tap to re-request" : r.restricted ? "Request access" : "Tap to add"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-2">
        <button onClick={() => signOut(false)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border text-sm">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
        <button onClick={() => signOut(true)} className="min-h-12 w-full rounded-2xl border border-alert/60 text-sm text-alert">
          Sign out of all devices
        </button>
      </div>
    </AppShell>
  );
}
