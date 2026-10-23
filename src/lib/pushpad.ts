import { PUSHPAD_PROJECT_ID, PUSHPAD_WEBSITE } from "./pushpad-config";
export type PushpadCommand = "init" | "subscribe" | "unsubscribe" | "status";
type Pushpad = (command: PushpadCommand, ...args: unknown[]) => void;

declare global {
  interface Window {
    pushpad?: Pushpad;
  }
}

// Public project identifier only. Never place the Pushpad access token here.
export const pushpadProjectId = PUSHPAD_PROJECT_ID;
export function isPushpadWebsite() { return window.location.origin === PUSHPAD_WEBSITE; }

let sdkPromise: Promise<Pushpad> | undefined;
export function loadPushpad(): Promise<Pushpad> {
  if (!isPushpadWebsite()) return Promise.reject(new Error("Enable notifications at bambana.lovable.app; preview subscriptions are not supported."));
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