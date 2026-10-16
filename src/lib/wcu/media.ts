// Stores captured evidence files (photos, videos, voice notes) on this device.
export type MediaKind = "Photo" | "Video" | "Voice";
export type Attachment = { id: string; kind: MediaKind; name: string };

const DB = "wcu-media";
const STORE = "files";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveMedia(blob: Blob): Promise<string> {
  const id = crypto.randomUUID();
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return id;
}

export async function getMedia(id: string): Promise<Blob | null> {
  const db = await open();
  return new Promise((resolve) => {
    const req = db.transaction(STORE).objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror = () => resolve(null);
  });
}

export function kindFromFile(f: Blob): MediaKind {
  if (f.type.startsWith("video")) return "Video";
  if (f.type.startsWith("audio")) return "Voice";
  return "Photo";
}
