import { z } from "zod";

export const sealedReportInput = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  hardwareFingerprint: z.string().max(2000),
});

export function reportAlertPayload(report: { title: string; description: string; latitude: number; longitude: number }) {
  return {
    title: `Crime alert: ${report.title}`,
    body: `${report.description.slice(0, 400)} · Location: ${report.latitude}, ${report.longitude}`,
    target_url: `https://www.google.com/maps?q=${report.latitude},${report.longitude}`,
    require_interaction: true,
    urgent: true,
    ttl: 3600,
  };
}