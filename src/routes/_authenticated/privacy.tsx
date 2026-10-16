import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { POLICY_VERSION, SCOPE_INFO, type ConsentScope } from "@/lib/safety/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/privacy")({
  head: () => ({ meta: [{ title: "Privacy & consent — World Crime Unicorn" }, { name: "description", content: "POPIA privacy notice and tracking permissions." }] }),
  component: Privacy,
});

function Privacy() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const consents = useQuery({
    queryKey: ["consents"],
    queryFn: async () => (await supabase.from("consents").select("*").eq("user_id", user.id).is("withdrawn_at", null)).data ?? [],
  });
  const active = (s: ConsentScope) => consents.data?.find((c) => c.scope === s);

  const toggle = async (s: ConsentScope) => {
    const c = active(s);
    const { error } = c
      ? await supabase.from("consents").update({ withdrawn_at: new Date().toISOString() }).eq("id", c.id)
      : await supabase.from("consents").insert({ user_id: user.id, scope: s, policy_version: POLICY_VERSION });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(c ? "Permission withdrawn" : "Consent recorded");
    await qc.invalidateQueries({ queryKey: ["consents"] });
  };

  return (
    <AppShell>
      <ScreenHeader title="Privacy & consent" subtitle={`Policy version ${POLICY_VERSION}`} />
      <div className="glass space-y-3 rounded-2xl p-4 text-sm leading-relaxed">
        <p><b>Why we collect it:</b> to let people you choose see where you are during a safety session, and to help responders reach you.</p>
        <p><b>What we collect:</b> GPS position, accuracy, speed and time — only while a session you started is running.</p>
        <p><b>Who sees it:</b> only the viewers you add to that session. They lose access the moment it stops or expires. Every view is logged.</p>
        <p><b>How long we keep it:</b> 30 days after a session ends, then it is anonymised. Emergency evidence may be held up to 365 days under our legal policy.</p>
        <p><b>Your rights (POPIA):</b> access, correct or delete your data, withdraw consent at any time, and complain to the Information Regulator.</p>
        <p><b>Contact:</b> privacy@worldcrimeunicorn.app</p>
      </div>

      <h2 className="mt-6 mb-2 font-display text-sm font-bold tracking-widest text-muted-foreground">PERMISSIONS</h2>
      <p className="mb-3 text-xs text-muted-foreground">Each feature has its own permission. Turning one off doesn't affect the others.</p>
      <div className="space-y-2">
        {SCOPE_INFO.map((s) => {
          const c = active(s.id);
          return (
            <div key={s.id} className="glass flex items-center gap-3 rounded-2xl p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.blurb}</p>
                {c && <p className="mt-1 text-[11px] text-safe">Accepted {new Date(c.accepted_at).toLocaleString()} · v{c.policy_version}</p>}
              </div>
              <button onClick={() => toggle(s.id)} className={cn("min-h-12 shrink-0 rounded-xl px-4 text-xs font-bold", c ? "border border-border" : "bg-electric text-electric-foreground")}>
                {c ? "Withdraw" : "I accept"}
              </button>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
