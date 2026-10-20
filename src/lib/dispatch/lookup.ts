/**
 * Rules behind the Dispatch Terminal.
 * The real enforcement of "who may look up a person's position" lives in the
 * database function public.dispatch_locate; these helpers only drive the UI.
 */

/** Roles whose holders may search the fleet directory at all. */
export const DISPATCH_ROLES = ["dispatcher", "official", "admin", "security_company"] as const;
export type DispatchRole = (typeof DISPATCH_ROLES)[number];

export function isDispatchRole(roles: readonly string[]) {
  return roles.some((r) => (DISPATCH_ROLES as readonly string[]).includes(r));
}

/** A phone needs this many digits before it is treated as searchable. */
export const MIN_PHONE_DIGITS = 7;

export function phoneDigits(raw: string) {
  return raw.replace(/\D/g, "");
}

export type IdentifierKind = "email" | "phone" | "invalid";

export function identifierKind(raw: string): IdentifierKind {
  const v = raw.trim();
  if (!v) return "invalid";
  if (v.includes("@")) return /^\S+@\S+\.\S+$/.test(v) ? "email" : "invalid";
  if (/[a-z]/i.test(v)) return "invalid";
  return phoneDigits(v).length >= MIN_PHONE_DIGITS ? "phone" : "invalid";
}

/** One line of the hardware matrix: a fix that passed the accuracy gate. */
export interface Reading {
  lat: number;
  lng: number;
  accuracy: number;
  at: string;
}

/** What public.dispatch_locate returns when the caller is allowed to see a position. */
export interface DispatchResult {
  status: "found";
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  scope: string | null;
  zone?: string | null;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  recorded_at: string | null;
  session_id?: string | null;
}

export const mapsUrl = (lat: number, lng: number) => `https://www.google.com/maps?q=${lat},${lng}`;
