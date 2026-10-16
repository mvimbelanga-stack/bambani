import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";

export const Route = createFileRoute("/_authenticated/activity")({
  head: () => ({ meta: [{ title: "My activity — World Crime Unicorn" }, { name: "description", content: "Your consent and location audit log." }] }),
  component: Activity,
});

export const ACTION_LABEL: Record<string, string> = {
  consent_given: "Consent given", consent_withdrawn: "Consent withdrawn", session_start: "Session started",
  session_stop: "Session stopped", session_deleted: "Session deleted", location_view: "Location viewed",
  viewer_added: "Viewer added", role_requested: "Role requested", role_dropped: "Role removed",
  role_approved: "Role approved", role_rejected: "Role declined", role_removed: "Role removed by admin", retention_job: "Retention clean-up",
};

function Activity() {
  const { user } = Route.useRouteContext();
  const logs = useQuery({
    queryKey: ["my-audit"],
    queryFn: async () => (await supabase.from("audit_logs").select("*").eq("actor_id", user.id).order("created_at", { ascending: false }).limit(100)).data ?? [],
  });
  return (
    <AppShell>
      <ScreenHeader title="My activity" subtitle="Everything recorded about your privacy choices" />
      {logs.data?.map((l) => (
        <div key={l.id} className="glass mb-2 rounded-xl p-3 text-xs">
          <p className="font-semibold">{ACTION_LABEL[l.action] ?? l.action}</p>
          <p className="text-muted-foreground">{new Date(l.created_at).toLocaleString()}</p>
        </div>
      ))}
      {logs.data?.length === 0 && <p className="text-xs text-muted-foreground">Nothing yet.</p>}
    </AppShell>
  );
}
