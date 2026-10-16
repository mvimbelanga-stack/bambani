import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type ConsentScope = Database["public"]["Enums"]["consent_scope"];

export const POLICY_VERSION = "2026-09-v1";

export const ROLE_INFO: { id: AppRole; label: string; restricted: boolean }[] = [
  { id: "civilian", label: "Civilian", restricted: false },
  { id: "guardian", label: "Parent / Guardian", restricted: false },
  { id: "family_member", label: "Child / Family member", restricted: false },
  { id: "employee", label: "Company employee", restricted: false },
  { id: "patroller", label: "Patroller", restricted: true },
  { id: "dispatcher", label: "Dispatcher", restricted: true },
  { id: "official", label: "Official", restricted: true },
  { id: "admin", label: "Admin", restricted: true },
];

export const SCOPE_INFO: { id: ConsentScope; label: string; blurb: string }[] = [
  { id: "track_me", label: "Track Me", blurb: "Trusted people follow your trip home." },
  { id: "suspicious_ride", label: "Suspicious ride", blurb: "Share a taxi or ride-hail trip if you feel unsafe." },
  { id: "escort", label: "Escort session", blurb: "A patroller accompanies your journey." },
  { id: "family", label: "Family / child tracking", blurb: "Share with your family group." },
  { id: "company", label: "Company tracking", blurb: "Your employer's safety team during work travel." },
  { id: "official_protection", label: "Official protection", blurb: "Protection detail for approved officials only." },
];

export const roleLabel = (r: string) => ROLE_INFO.find((x) => x.id === r)?.label ?? r;
export const scopeLabel = (s: string) => SCOPE_INFO.find((x) => x.id === s)?.label ?? s;

export function accuracyLabel(acc: number | null | undefined) {
  if (acc == null) return { text: "Location unavailable", tone: "text-alert" };
  if (acc <= 50) return { text: `Accurate (±${Math.round(acc)} m)`, tone: "text-safe" };
  return { text: `Approximate (±${Math.round(acc)} m)`, tone: "text-warn" };
}
