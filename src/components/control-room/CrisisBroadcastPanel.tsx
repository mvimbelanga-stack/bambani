import * as React from "react";
import { Megaphone, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertTarget {
  channel: "SMS" | "CPF_Radio" | "Push_Notification" | "Emergency_Services";
  status: "IDLE" | "SENDING" | "DISPATCHED" | "FAILED";
}

const INITIAL_TARGETS: AlertTarget[] = [
  { channel: "SMS", status: "IDLE" },
  { channel: "CPF_Radio", status: "IDLE" },
  { channel: "Push_Notification", status: "IDLE" },
  { channel: "Emergency_Services", status: "IDLE" },
];

export function CrisisBroadcastPanel({ activeCrisisId }: { activeCrisisId?: string }) {
  const [broadcastActive, setBroadcastActive] = React.useState(false);
  const [routingTargets, setRoutingTargets] = React.useState<AlertTarget[]>(INITIAL_TARGETS);

  const triggerCrisisLockdown = () => {
    setBroadcastActive(true);
    // Simulated client-side routing only — no external alerts are delivered
    // until a real control-room integration is connected.
    setRoutingTargets((prev) => prev.map((t) => ({ ...t, status: "SENDING" })));
    setTimeout(() => {
      setRoutingTargets((prev) =>
        prev.map((t) => ({ ...t, status: t.status === "FAILED" ? "FAILED" : "DISPATCHED" }))
      );
    }, 1200);
  };

  return (
    <div className="glass rounded-2xl border border-alert/40 p-5">
      <div className="mb-4 flex items-center justify-between border-b border-border pb-2">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-alert">
          <Megaphone className="h-4 w-4" /> Crisis Broadcast & Lockdown
        </h3>
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            broadcastActive ? "animate-ping bg-alert" : "bg-muted-foreground/40"
          )}
        />
      </div>

      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
        Simultaneously route geo-fenced audio feeds, update safety maps, and alert CPF command
        hierarchies.
        {activeCrisisId ? ` Active crisis: ${activeCrisisId}.` : ""}
      </p>

      <div className="mb-5 grid grid-cols-2 gap-3">
        {routingTargets.map((target) => (
          <div
            key={target.channel}
            className="flex items-center justify-between rounded-lg border border-border bg-surface-2 p-3"
          >
            <span className="text-xs font-medium">{target.channel.replace(/_/g, " ")}</span>
            <span
              className={cn(
                "rounded border px-2 py-0.5 font-mono text-[10px] font-bold",
                target.status === "DISPATCHED" &&
                  "border-safe/50 bg-safe/15 text-safe",
                target.status === "SENDING" &&
                  "animate-pulse border-amber-500/50 bg-amber-500/15 text-amber-400",
                target.status === "IDLE" &&
                  "border-border bg-surface text-muted-foreground",
                target.status === "FAILED" &&
                  "border-alert/50 bg-alert/15 text-alert"
              )}
            >
              {target.status}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={triggerCrisisLockdown}
        disabled={broadcastActive}
        className={cn(
          "w-full rounded-lg py-3 text-xs font-bold uppercase tracking-wide transition-all duration-200",
          broadcastActive
            ? "cursor-not-allowed border border-alert/40 bg-alert/10 text-alert"
            : "bg-alert text-alert-foreground shadow-lg active:scale-[0.99]"
        )}
      >
        {broadcastActive ? "⚠ Systems Broadcasting Live" : (
          <span className="inline-flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" /> Initiate Simultaneous Emergency Broadcast
          </span>
        )}
      </button>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        Simulation only — no SMS, radio or emergency services are contacted.
      </p>
    </div>
  );
}
