export type PushpadCommand = "init" | "subscribe" | "unsubscribe" | "status";
type Pushpad = (command: PushpadCommand, ...args: unknown[]) => void;

declare global {
  interface Window {
    pushpad?: Pushpad;
  }
}

// Public project identifier only. Never place the Pushpad access token here.
export const pushpadProjectId = import.meta.env['VITE_PUSHPAD_PROJECT_ID'] as string | undefined;

let sdkPromise: Promise<Pushpad> | undefined;
export function loadPushpad(): Promise<Pushpad> {
  if (!pushpadProjectId) return Promise.reject(new Error("Pushpad account setup is not complete."));
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://pushpad.xyz/pushpad.js";
    script.async = true;
    script.onload = () => {
      if (!window.pushpad) { reject(new Error("Pushpad could not load.")); return; }
      window.pushpad("init", pushpadProjectId);
      resolve(window.pushpad);
    };
    script.onerror = () => { sdkPromise = undefined; reject(new Error("Pushpad could not load. Check your connection.")); };
    document.head.appendChild(script);
  });
  return sdkPromise;
}