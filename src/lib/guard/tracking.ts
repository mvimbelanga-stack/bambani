export const STREAM_INTERVAL_MS = 7000; // within the 5–10 s window
export const NO_MOVEMENT_MS = 10 * 60 * 1000;
export const MOVING_SPEED_MS = 0.5; // m/s

export type Movement = "Moving" | "Stationary" | "Offline";

export interface GuardPoint {
  lat: number;
  lng: number;
  speed: number | null;
  t: number;
}

export function distanceM(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000;
  const toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(bLat - aLat);
  const dLng = toR(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(aLat)) * Math.cos(toR(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function bearingDeg(aLat: number, aLng: number, bLat: number, bLng: number) {
  const toR = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toR(bLng - aLng)) * Math.cos(toR(bLat));
  const x =
    Math.cos(toR(aLat)) * Math.sin(toR(bLat)) -
    Math.sin(toR(aLat)) * Math.cos(toR(bLat)) * Math.cos(toR(bLng - aLng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function movementStatus(onDuty: boolean, speed: number | null): Movement {
  if (!onDuty) return "Offline";
  return (speed ?? 0) >= MOVING_SPEED_MS ? "Moving" : "Stationary";
}

export function outsideZone(lat: number, lng: number, cLat: number, cLng: number, radiusM: number) {
  return distanceM(lat, lng, cLat, cLng) > radiusM;
}

/** True when the guard hasn't moved more than 15 m during the last 10 minutes. */
export function noMovementAlert(lastMovedAt: number, now: number) {
  return now - lastMovedAt > NO_MOVEMENT_MS;
}

/** Should a new point be streamed now? Only while on duty and after the interval. */
export function shouldStream(onDuty: boolean, lastSentAt: number | null, now: number) {
  if (!onDuty) return false;
  return lastSentAt == null || now - lastSentAt >= STREAM_INTERVAL_MS;
}

/** Markers visible on the control screen: off-duty guards are removed at once. */
export function visibleGuards<T extends { onDuty: boolean }>(guards: T[]) {
  return guards.filter((g) => g.onDuty);
}
