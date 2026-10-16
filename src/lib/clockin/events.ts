export interface ClockInEvent {
  userId: string;
  timestamp: string;
  faceVerified: boolean;
  livenessScore: number;
  location: { latitude: number; longitude: number; accuracy: number; timestamp: string };
  deviceId: string;
  ipAddress: string;
}

export const MAX_GPS_ACCURACY_M = 50;
export const MIN_LIVENESS = 0.85;
const KEY = "wcu-clockins-v1";
const DEVICE_KEY = "wcu-device-id";

/** Blink and nod each give 0.45; the remaining 0.1 comes from average face-detection confidence. */
export function livenessScore(blinked: boolean, nodded: boolean, confidence: number) {
  const c = Math.max(0, Math.min(1, confidence));
  return Math.round(((blinked ? 0.45 : 0) + (nodded ? 0.45 : 0) + 0.1 * c) * 100) / 100;
}

export function gpsAcceptable(accuracy: number) {
  return accuracy <= MAX_GPS_ACCURACY_M;
}

export function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function loadClockIns(): ClockInEvent[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as ClockInEvent[];
  } catch {
    return [];
  }
}

export function saveClockIn(e: ClockInEvent) {
  localStorage.setItem(KEY, JSON.stringify([e, ...loadClockIns()]));
}

export async function getIpAddress() {
  try {
    const r = await fetch("https://api.ipify.org?format=json");
    const j = (await r.json()) as { ip?: string };
    return j.ip ?? "unavailable";
  } catch {
    return "unavailable";
  }
}
