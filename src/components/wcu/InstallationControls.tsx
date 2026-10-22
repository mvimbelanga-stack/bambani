import * as React from "react";
import { Bell, BellOff, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadPushpad, pushpadProjectId } from "@/lib/pushpad";

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallationControls() {
  const [installPrompt, setInstallPrompt] = React.useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = React.useState(false);
  const [supported, setSupported] = React.useState(false);
  const [subscribed, setSubscribed] = React.useState(false);
  const [denied, setDenied] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    setSupported("Notification" in window && "serviceWorker" in navigator && "PushManager" in window);
    setDenied("Notification" in window && Notification.permission === "denied");
    const beforeInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPrompt); };
    const afterInstall = () => { setInstalled(true); setInstallPrompt(null); };
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", afterInstall);
    // Check an existing subscription without requesting permission on page load.
    if (pushpadProjectId && "Notification" in window && Notification.permission === "granted") {
      void loadPushpad().then((pushpad) => pushpad("status", (active: boolean) => setSubscribed(active))).catch(() => {});
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", afterInstall);
    };
  }, []);

  const togglePush = async () => {
    setBusy(true); setMessage("");
    try {
      const pushpad = await loadPushpad();
      if (subscribed) {
        pushpad("unsubscribe", () => { setSubscribed(false); setBusy(false); setMessage("Push alerts turned off for this device."); });
      } else {
        pushpad("subscribe", (active: boolean) => {
          setSubscribed(active); setBusy(false); setDenied(Notification.permission === "denied");
          setMessage(active ? "Push alerts enabled for this device." : "Notifications were not enabled. Check your browser’s site settings.");
        });
      }
    } catch (error) { setBusy(false); setMessage(error instanceof Error ? error.message : "Could not enable notifications."); }
  };

  return (
    <section className="mt-6 space-y-3 border-t border-border pt-4">
      <h2 className="font-display text-sm font-bold text-foreground">App & notifications</h2>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={installed} onClick={async () => {
          if (!installPrompt) { setMessage("On iPhone: open in Safari, tap Share, then Add to Home Screen. On Android: use your browser’s Install app menu."); return; }
          await installPrompt.prompt();
          const choice = await installPrompt.userChoice;
          if (choice.outcome === "accepted") setInstalled(true);
          setInstallPrompt(null);
        }}><Download />{installed ? "Installed" : "Install app"}</Button>
        <Button variant={subscribed ? "outline" : "default"} disabled={busy || !supported || denied || !pushpadProjectId} onClick={togglePush}>
          {subscribed ? <BellOff /> : <Bell />}{busy ? "Connecting…" : subscribed ? "Turn off push alerts" : "Enable notifications"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground" role="status">
        {message || (denied ? "Notifications are blocked. Allow them in your browser’s site settings." : !supported ? "For iPhone notifications, add this app to your Home Screen first." : !pushpadProjectId ? "Push notifications await the Pushpad account connection." : "Receive crime alerts with the report’s location on this device.")}
      </p>
    </section>
  );
}