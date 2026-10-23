import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PUSHPAD_PROJECT_ID } from "./pushpad-config";
import { reportAlertPayload, sealedReportInput } from "./report-alert";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/udc_pushpad";

// Only a freshly persisted, caller-owned report can trigger a broadcast.
// No public send endpoint, client-provided audience, or repeat-send endpoint.
export const sealReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => sealedReportInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: report, error } = await context.supabase.from("evidence_vault").insert({
      reporter_id: context.userId,
      title: data.title,
      description: data.description,
      latitude: data.latitude,
      longitude: data.longitude,
      hardware_fingerprint: data.hardwareFingerprint,
    }).select("id,title,description,latitude,longitude,sealed_at").single();
    if (error || !report) throw new Error("Could not seal the report. No push alert was requested.");
    const alert = { ...report, timestamp: report.sealed_at };
    try {
      const key = process.env['UDC_PUSHPAD_API_KEY'];
      const gatewayKey = process.env['LOVABLE_API_KEY'];
      if (!key || !gatewayKey) throw new Error("Pushpad connection is unavailable.");
      const response = await fetch(`${GATEWAY_URL}/projects/${PUSHPAD_PROJECT_ID}/notifications`, {
        method: "POST",
        headers: { Authorization: `Bearer ${gatewayKey}`, "X-Connection-Api-Key": key, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(reportAlertPayload(report)),
      });
      if (!response.ok) {
        const body = await response.text();
        console.error(`Pushpad request failed [${response.status}]: ${body}`);
        return { alert, push: { accepted: false, scheduled: 0, error: `Pushpad [${response.status}]: ${body}` } };
      }
      const result = await response.json() as { id?: number; scheduled?: number };
      if (typeof result.id !== "number") throw new Error("Pushpad did not confirm acceptance.");
      return { alert, push: { accepted: true, scheduled: result.scheduled ?? 0, notificationId: result.id, error: "" } };
    } catch (error) {
      console.error("Report sealed but push request failed", error);
      return { alert, push: { accepted: false, scheduled: 0, error: error instanceof Error ? error.message : "Pushpad request failed." } };
    }
  });