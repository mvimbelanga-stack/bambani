import { supabase } from "@/integrations/supabase/client";

export type QueuedClockIn = {
  client_id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  gps_accuracy: number;
  liveness_score: number;
  device_info: Record<string, string>;
};

const QUEUE_KEY = "wcu-clockin-sync-queue-v1";

export function readQueue(): QueuedClockIn[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") as QueuedClockIn[];
  } catch {
    return [];
  }
}

function writeQueue(q: QueuedClockIn[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

/** Queue first, then try to send. Records survive dropped connections and resend later. */
export async function enqueueClockIn(item: QueuedClockIn) {
  writeQueue([...readQueue().filter((x) => x.client_id !== item.client_id), item]);
  return flushClockIns();
}

let flushing: Promise<{ sent: number; pending: number }> | null = null;

export function flushClockIns() {
  if (flushing) return flushing;
  flushing = (async () => {
    let sent = 0;
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user || (typeof navigator !== "undefined" && !navigator.onLine)) return { sent, pending: readQueue().length };
      for (const item of readQueue()) {
        // client_id is unique, so a resend after a flaky connection never duplicates.
        const { error } = await supabase.from("clock_ins").upsert(item, { onConflict: "client_id", ignoreDuplicates: true });
        if (error) break;
        writeQueue(readQueue().filter((x) => x.client_id !== item.client_id));
        sent++;
      }
    } catch {
      /* offline — keep queued */
    }
    return { sent, pending: readQueue().length };
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

/** Call once from a useEffect: resends whenever the connection comes back. */
export function startClockInSync() {
  const run = () => void flushClockIns();
  window.addEventListener("online", run);
  run();
  return () => window.removeEventListener("online", run);
}
