import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BellRing,
  Bus,
  CheckCircle2,
  ChevronRight,
  Fan,
  Fence,
  MapPinned,
  RadioTower,
  ShieldAlert,
  TriangleAlert,
  Waves,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mine")({
  head: () => ({
    meta: [
      { title: "MINE Safety — World Crime Unicorn" },
      {
        name: "description",
        content: "Eight test-ready mine safety, security, emergency and compliance solutions.",
      },
      { property: "og:title", content: "MINE Safety — World Crime Unicorn" },
      {
        property: "og:description",
        content: "Monitor mine risks, test alerts and capture GPS-ready safety records.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MineScreen,
});

type Tone = "safe" | "neon" | "electric" | "warn" | "alert";
type Solution = {
  id: string;
  title: string;
  short: string;
  detail: string;
  action: string;
  confirmation: string;
  status: string;
  tone: Tone;
  icon: React.ComponentType<{ className?: string }>;
};

const SOLUTIONS: Solution[] = [
  {
    id: "fence",
    title: "Fence & Cable Theft Protection",
    short: "24/7 perimeter monitoring and tamper alerts",
    detail: "Tests a perimeter breach alert with the affected fence zone and a patrol-ready incident record.",
    action: "Test tamper alert",
    confirmation: "Fence Zone 4 alert logged and patrol notified",
    status: "All zones secure",
    tone: "neon",
    icon: Fence,
  },
  {
    id: "fans",
    title: "Ventilation Fans Security",
    short: "Monitor fan operation and restricted access",
    detail: "Checks fan availability and demonstrates a warning when a secured ventilation point is accessed.",
    action: "Run fan check",
    confirmation: "Ventilation check complete — all monitored fans online",
    status: "12 fans online",
    tone: "electric",
    icon: Fan,
  },
  {
    id: "tailings",
    title: "Tailings Dam Early Warning",
    short: "Water-level and structural-risk monitoring",
    detail: "Runs a simulated sensor health check for level movement, wall stability and escalation readiness.",
    action: "Test early warning",
    confirmation: "Tailings sensors tested — control room check logged",
    status: "Risk level normal",
    tone: "safe",
    icon: Waves,
  },
  {
    id: "illegal-mining",
    title: "Illegal Mining Alert",
    short: "Live reports with patrol dispatch support",
    detail: "Captures a test Zama Zama report and prepares its location for mine security and patrol response.",
    action: "Log test report",
    confirmation: "Illegal mining report logged for patrol review",
    status: "Patrol ready",
    tone: "alert",
    icon: TriangleAlert,
  },
  {
    id: "panic",
    title: "Women Mine Workers Panic Support",
    short: "Discreet panic support with rapid response",
    detail: "Demonstrates a discreet duress alert routed to the mine response desk without a public alarm.",
    action: "Test discreet alert",
    confirmation: "Discreet support alert received by the response desk",
    status: "Response team ready",
    tone: "alert",
    icon: ShieldAlert,
  },
  {
    id: "evacuation",
    title: "Emergency Evacuation Mass Alert",
    short: "Instant alerts for guided evacuation",
    detail: "Sends a safe test notice to demonstrate workforce-wide evacuation messaging and acknowledgement.",
    action: "Send test alert",
    confirmation: "Evacuation test sent — acknowledgements now tracking",
    status: "486 recipients ready",
    tone: "warn",
    icon: BellRing,
  },
  {
    id: "truck",
    title: "Contractor Truck Anti-Hijack",
    short: "GPS tracking and hijack-alert coordination",
    detail: "Tests a contractor vehicle check-in, route position and control-room escalation workflow.",
    action: "Test vehicle check-in",
    confirmation: "Truck CT-24 GPS check-in verified",
    status: "18 vehicles tracked",
    tone: "electric",
    icon: Bus,
  },
  {
    id: "slp",
    title: "SLP Proof with GPS Reports",
    short: "Geo-verified Social Labour Plan evidence",
    detail: "Creates a demo GPS-stamped field record suitable for review and audit preparation.",
    action: "Create GPS proof",
    confirmation: "GPS proof saved to the SLP audit record",
    status: "Audit-ready",
    tone: "safe",
    icon: MapPinned,
  },
];

const toneClass: Record<Tone, string> = {
  safe: "border-safe/50 bg-safe/10 text-safe",
  neon: "border-neon/50 bg-neon/10 text-neon",
  electric: "border-electric/50 bg-electric/10 text-electric",
  warn: "border-warn/50 bg-warn/10 text-warn",
  alert: "border-alert/50 bg-alert/10 text-alert",
};

function playAudioTone(freq = 880, type: OscillatorType = "sine", duration = 0.25) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    /* AudioContext blocked by policy */
  }
}

interface SolutionSimulationProps {
  solution: Solution;
  onExecute: () => void;
}

function SolutionInteractivePanel({ solution, onExecute }: SolutionSimulationProps) {
  const [running, setRunning] = React.useState(false);
  const [activeParam, setActiveParam] = React.useState<string | null>(null);
  const [log, setLog] = React.useState<string[]>([]);

  // Interactive dynamic states per solution
  const [fenceVoltage, setFenceVoltage] = React.useState(8.4);
  const [tamperedZone, setTamperedZone] = React.useState<number | null>(null);

  const [fansOnline, setFansOnline] = React.useState(12);
  const [methaneLevel, setMethaneLevel] = React.useState(0.02);
  const [fanPurgeActive, setFanPurgeActive] = React.useState(false);

  const [damSlopeTilt, setDamSlopeTilt] = React.useState(0.018);
  const [damWaterHead, setDamWaterHead] = React.useState(4.2);

  const [geophoneFreq, setGeophoneFreq] = React.useState(2.4);
  const [seismicAnomaly, setSeismicAnomaly] = React.useState(false);

  const [shaftDepth, setShaftDepth] = React.useState("-850m (Level 3)");
  const [silentBeaconSent, setSilentBeaconSent] = React.useState(false);

  const [evacActive, setEvacActive] = React.useState(false);
  const [staffCheckedIn, setStaffCheckedIn] = React.useState(486);

  const [selectedTruck, setSelectedTruck] = React.useState("CT-24");
  const [engineCut, setEngineCut] = React.useState(false);

  const [slpCertificate, setSlpCertificate] = React.useState<{
    id: string;
    hash: string;
    timestamp: string;
    project: string;
    coords: string;
  } | null>(null);

  const appendLog = (msg: string) => {
    setLog((l) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...l].slice(0, 5));
  };

  const handleSimulateAction = () => {
    setRunning(true);
    playAudioTone(640, "sine", 0.15);
    appendLog(`Initiating operational test for ${solution.title}...`);
    setTimeout(() => {
      setRunning(false);
      appendLog(`Simulation complete: ${solution.confirmation}`);
      onExecute();
    }, 1200);
  };

  return (
    <div className="space-y-4">
      {/* 1. FENCE & CABLE THEFT */}
      {solution.id === "fence" && (
        <div className="rounded-xl border border-neon/40 bg-surface-2/70 p-3 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-neon">Perimeter Optical Wire & Voltage</span>
            <span className={cn("font-mono font-bold", tamperedZone ? "text-alert" : "text-safe")}>
              {fenceVoltage.toFixed(1)} kV {tamperedZone ? "(ALARM)" : "(Nominal)"}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-[10px] text-center font-mono">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((z) => (
              <button
                key={z}
                onClick={() => {
                  setActiveParam(`Zone ${z}`);
                  appendLog(`Inspecting optical loop sensor Zone ${z}: normal resistance`);
                  toast.info(`Zone ${z} sensor checked`);
                }}
                className={cn(
                  "rounded-lg border p-1.5 transition font-semibold",
                  tamperedZone === z
                    ? "border-alert bg-alert/30 text-alert animate-pulse"
                    : activeParam === `Zone ${z}`
                      ? "border-neon bg-neon/20 text-neon"
                      : "border-border bg-surface text-muted-foreground hover:border-neon"
                )}
              >
                Zone {z} {tamperedZone === z ? "⚠️" : ""}
              </button>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                const z = 4;
                setTamperedZone(z);
                setFenceVoltage(1.2);
                playAudioTone(440, "sawtooth", 0.4);
                appendLog(`SIMULATED TAMPER: Optical fiber cut detected at Zone ${z}!`);
                toast.error(`Perimeter breach simulated on Zone ${z}`);
              }}
              className="flex-1 rounded-lg border border-alert bg-alert/20 py-1.5 text-xs font-bold text-alert hover:bg-alert/30 transition"
            >
              Simulate Zone 4 Tamper
            </button>
            <button
              onClick={() => {
                setTamperedZone(null);
                setFenceVoltage(8.4);
                appendLog("Perimeter circuit reset: 8.4 kV restored across all zones");
                toast.success("Perimeter zones normalized");
              }}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-2"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* 2. VENTILATION FANS */}
      {solution.id === "fans" && (
        <div className="rounded-xl border border-electric/40 bg-surface-2/70 p-3 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-electric">Sub-Surface Ventilation Shafts</span>
            <span className="font-mono text-safe">{fansOnline}/12 Online</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
            <div className="rounded-lg bg-surface p-2 text-center">
              <span className="block text-muted-foreground text-[10px]">Airflow</span>
              <span className="font-bold text-foreground">{fanPurgeActive ? "490 m³/s (Boost)" : "340 m³/s"}</span>
            </div>
            <div className="rounded-lg bg-surface p-2 text-center">
              <span className="block text-muted-foreground text-[10px]">Main RPM</span>
              <span className="font-bold text-electric">{fanPurgeActive ? "1,850 RPM" : "1,450 RPM"}</span>
            </div>
            <div className="rounded-lg bg-surface p-2 text-center">
              <span className="block text-muted-foreground text-[10px]">Methane CH₄</span>
              <span className={cn("font-bold", methaneLevel > 0.5 ? "text-alert" : "text-safe")}>
                {methaneLevel.toFixed(2)}% {methaneLevel > 0.5 ? "High" : "Safe"}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Adjust Methane Gas Simulation</span>
              <span className="font-mono font-bold">{methaneLevel.toFixed(2)}%</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="1.50"
              step="0.05"
              value={methaneLevel}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setMethaneLevel(val);
                if (val > 0.5) {
                  playAudioTone(520, "sawtooth", 0.2);
                  appendLog(`CH4 concentration warning: ${val.toFixed(2)}% detected`);
                }
              }}
              className="w-full accent-electric cursor-pointer"
            />
          </div>

          <button
            onClick={() => {
              setFanPurgeActive((p) => !p);
              playAudioTone(880, "triangle", 0.3);
              appendLog(fanPurgeActive ? "Shaft fans returned to normal cycle" : "Emergency high-speed air purge engaged");
              toast.info(fanPurgeActive ? "Normal airflow mode" : "Emergency purge active");
            }}
            className="w-full rounded-lg border border-electric/60 bg-electric/20 py-1.5 text-xs font-bold text-electric hover:bg-electric/30 transition"
          >
            {fanPurgeActive ? "Deactivate Air Purge" : "Test High-Speed Emergency Purge"}
          </button>
        </div>
      )}

      {/* 3. TAILINGS DAM */}
      {solution.id === "tailings" && (
        <div className="rounded-xl border border-safe/40 bg-surface-2/70 p-3 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-safe">Piezometer & Incline Stability</span>
            <span className={cn("font-mono font-bold", damSlopeTilt > 0.2 ? "text-alert" : "text-safe")}>
              {damSlopeTilt > 0.2 ? "Elevated Risk" : "Normal Stability"}
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Dam Wall Slope Tilt</span>
              <span className="font-mono font-bold">{damSlopeTilt.toFixed(3)}° (Threshold: 0.250°)</span>
            </div>
            <input
              type="range"
              min="0.010"
              max="0.320"
              step="0.010"
              value={damSlopeTilt}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setDamSlopeTilt(val);
                if (val > 0.25) {
                  playAudioTone(400, "square", 0.3);
                  appendLog(`Incline alert: Dam slope tilt reached ${val.toFixed(3)}°`);
                }
              }}
              className="w-full accent-safe cursor-pointer"
            />
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Freeboard Water Head</span>
              <span className="font-mono font-bold">{damWaterHead.toFixed(1)} m</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="6.0"
              step="0.2"
              value={damWaterHead}
              onChange={(e) => setDamWaterHead(parseFloat(e.target.value))}
              className="w-full accent-safe cursor-pointer"
            />
          </div>

          <button
            onClick={() => {
              playAudioTone(720, "sine", 0.5);
              appendLog("Simulated Spillway Emergency Siren test completed");
              toast.success("Tailings dam emergency siren verified");
            }}
            className="w-full rounded-lg border border-safe/60 bg-safe/20 py-1.5 text-xs font-bold text-safe hover:bg-safe/30 transition"
          >
            Test Spillway Early Warning Siren
          </button>
        </div>
      )}

      {/* 4. ILLEGAL MINING ALERT */}
      {solution.id === "illegal-mining" && (
        <div className="rounded-xl border border-alert/40 bg-surface-2/70 p-3 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-alert">Acoustic & Geophone Sensors</span>
            <span className="font-mono text-alert">Shaft 4 Sector</span>
          </div>

          <div className="rounded-lg bg-surface p-2.5 flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-foreground">Vibration Signature</p>
              <p className="text-[10px] text-muted-foreground">Subterranean micro-blasting acoustic array</p>
            </div>
            <span className="font-mono font-bold text-warn text-sm">{geophoneFreq.toFixed(1)} Hz</span>
          </div>

          <input
            type="range"
            min="0.5"
            max="8.0"
            step="0.5"
            value={geophoneFreq}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setGeophoneFreq(val);
              setSeismicAnomaly(val > 4.0);
              if (val > 4.0) {
                playAudioTone(300, "triangle", 0.2);
                appendLog(`Acoustic anomaly detected: Micro-percussion detected at ${val} Hz`);
              }
            }}
            className="w-full accent-alert cursor-pointer"
          />

          <button
            onClick={() => {
              playAudioTone(600, "sawtooth", 0.3);
              appendLog("Simulated tactical underground response team dispatched to Shaft 4");
              toast.warning("Underground security response dispatched");
            }}
            className="w-full rounded-lg border border-alert bg-alert/20 py-1.5 text-xs font-bold text-alert hover:bg-alert/30 transition"
          >
            Dispatch Underground Patrol Team
          </button>
        </div>
      )}

      {/* 5. WOMEN MINE WORKERS PANIC */}
      {solution.id === "panic" && (
        <div className="rounded-xl border border-alert/40 bg-surface-2/70 p-3 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-alert">Discreet Lone Worker Distress</span>
            <span className="font-mono text-safe">Silent Mesh Active</span>
          </div>

          <div className="flex justify-between items-center bg-surface p-2 rounded-lg text-xs">
            <span className="text-muted-foreground">Assigned Location</span>
            <select
              value={shaftDepth}
              onChange={(e) => setShaftDepth(e.target.value)}
              className="bg-transparent font-bold text-foreground outline-none"
            >
              <option value="-850m (Level 3)" className="bg-slate-900">-850m (Level 3)</option>
              <option value="-1200m (Level 5)" className="bg-slate-900">-1200m (Level 5)</option>
              <option value="Surface Stope B" className="bg-slate-900">Surface Stope B</option>
            </select>
          </div>

          <button
            onClick={() => {
              setSilentBeaconSent(true);
              playAudioTone(1200, "sine", 0.1);
              appendLog(`DISCREET BEACON SENT: Encrypted distress packet from ${shaftDepth} received`);
              toast.success(`Discreet distress packet transmitted for ${shaftDepth}`);
            }}
            className="w-full rounded-lg border border-alert bg-alert/20 py-2 text-xs font-black text-alert uppercase hover:bg-alert/30 transition"
          >
            {silentBeaconSent ? "✓ Distress Beacon Active" : "Trigger Silent Distress Test"}
          </button>
        </div>
      )}

      {/* 6. EMERGENCY EVACUATION */}
      {solution.id === "evacuation" && (
        <div className="rounded-xl border border-warn/40 bg-surface-2/70 p-3 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-warn">Emergency Siren & Roll-Call</span>
            <span className="font-mono text-foreground">{staffCheckedIn}/486 Accounted For</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-center">
            <div className="rounded-lg bg-surface p-2">
              <span className="text-[10px] text-muted-foreground block">Muster Alpha</span>
              <span className="font-bold text-safe font-mono">248 Safe</span>
            </div>
            <div className="rounded-lg bg-surface p-2">
              <span className="text-[10px] text-muted-foreground block">Refuge Chambers</span>
              <span className="font-bold text-electric font-mono">238 Safe</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setEvacActive(true);
                playAudioTone(880, "sawtooth", 0.6);
                appendLog("EVACUATION ALERT: Strobe sirens triggered across 24 zones");
                toast.warning("Simulated evacuation alarm active");
              }}
              className="flex-1 rounded-lg border border-warn bg-warn/20 py-1.5 text-xs font-bold text-warn hover:bg-warn/30 transition"
            >
              Sound Mass Siren
            </button>
            <button
              onClick={() => {
                setStaffCheckedIn(486);
                setEvacActive(false);
                appendLog("Roll-call completed: 100% staff accounted for at muster points");
                toast.success("All 486 workers confirmed safe");
              }}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold hover:bg-surface-2"
            >
              Acknowledge All
            </button>
          </div>
        </div>
      )}

      {/* 7. CONTRACTOR TRUCK */}
      {solution.id === "truck" && (
        <div className="rounded-xl border border-electric/40 bg-surface-2/70 p-3 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-electric">Contractor Fleet Telemetry</span>
            <span className="font-mono text-safe">18 Vehicles Live</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-mono">
            {["CT-24", "CT-18", "CT-09"].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTruck(t)}
                className={cn(
                  "p-1.5 rounded-lg border transition",
                  selectedTruck === t ? "border-electric bg-electric/20 text-electric font-bold" : "border-border bg-surface text-muted-foreground"
                )}
              >
                Truck {t}
              </button>
            ))}
          </div>

          <div className="bg-surface p-2.5 rounded-lg text-xs space-y-1">
            <div className="flex justify-between font-mono">
              <span className="text-muted-foreground">Truck {selectedTruck} Speed</span>
              <span className="text-neon font-bold">{engineCut ? "0 km/h (Cut)" : "52 km/h"}</span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-muted-foreground">GPS Corridor Status</span>
              <span className={engineCut ? "text-warn" : "text-safe"}>{engineCut ? "Engine Immobilized" : "On Safe Route"}</span>
            </div>
          </div>

          <button
            onClick={() => {
              setEngineCut((c) => !c);
              playAudioTone(450, "sine", 0.2);
              appendLog(`Truck ${selectedTruck}: Remote engine ignition ${!engineCut ? "cut signal delivered" : "restored"}`);
              toast.info(`Truck ${selectedTruck} engine ${!engineCut ? "immobilized" : "restored"}`);
            }}
            className="w-full rounded-lg border border-alert/60 bg-alert/20 py-1.5 text-xs font-bold text-alert hover:bg-alert/30 transition"
          >
            {engineCut ? "Restore Truck Ignition" : `Test Remote Immobilizer for Truck ${selectedTruck}`}
          </button>
        </div>
      )}

      {/* 8. SLP PROOF */}
      {solution.id === "slp" && (
        <div className="rounded-xl border border-safe/40 bg-surface-2/70 p-3 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-safe">Social Labour Plan Compliance</span>
            <span className="font-mono text-safe">Audit Proof Ready</span>
          </div>

          <p className="text-xs text-muted-foreground">
            Generate immutable GPS-verified evidence records for Department of Mineral Resources compliance.
          </p>

          {slpCertificate && (
            <div className="bg-surface p-2.5 rounded-lg border border-safe/40 space-y-1 font-mono text-[10px]">
              <div className="flex justify-between text-safe font-bold">
                <span>CERTIFICATE {slpCertificate.id}</span>
                <span>VERIFIED</span>
              </div>
              <p className="text-slate-300">Project: {slpCertificate.project}</p>
              <p className="text-slate-400">GPS: {slpCertificate.coords}</p>
              <p className="truncate text-slate-500">Hash: {slpCertificate.hash}</p>
            </div>
          )}

          <button
            onClick={() => {
              const cert = {
                id: `SLP-${Math.floor(100000 + Math.random() * 900000)}`,
                hash: `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
                timestamp: new Date().toISOString(),
                project: "Mine Community Clinic & Water Station",
                coords: "-26.20410, 28.04730 (±6m)",
              };
              setSlpCertificate(cert);
              playAudioTone(800, "sine", 0.2);
              appendLog(`Generated SLP Compliance Record ${cert.id}`);
              toast.success("SLP Geo-verified proof certificate created!");
            }}
            className="w-full rounded-lg border border-safe bg-safe/20 py-1.5 text-xs font-bold text-safe hover:bg-safe/30 transition"
          >
            Generate & Sign SLP Audit Certificate
          </button>
        </div>
      )}

      {/* Real-time Event Log */}
      {log.length > 0 && (
        <div className="rounded-xl bg-slate-950/80 p-2.5 font-mono text-[10px] text-slate-300 border border-slate-800 space-y-1">
          {log.map((entry, idx) => (
            <div key={idx} className="truncate">
              {entry}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface-2/60 p-3 text-xs">
        <span className="text-muted-foreground">Operational Status</span>
        <p className="mt-1 flex items-center gap-2 font-semibold text-safe">
          <span className="h-2 w-2 rounded-full bg-safe" />
          {solution.status}
        </p>
      </div>

      <DialogFooter className="pt-2">
        <Button
          disabled={running}
          onClick={handleSimulateAction}
          className="min-h-12 w-full rounded-xl bg-electric font-bold text-electric-foreground shadow-lg transition active:scale-95"
        >
          {running ? "EXECUTING SIMULATION…" : solution.action}
        </Button>
      </DialogFooter>

      <p className="text-[10px] text-center text-muted-foreground">
        Client-side simulation active — control room mock event logged securely.
      </p>
    </div>
  );
}

function MineScreen() {
  const [selected, setSelected] = React.useState<Solution | null>(null);
  const [tested, setTested] = React.useState<string[]>([]);
  const SelectedIcon = selected?.icon;

  const runTest = (solution: Solution) => {
    setTested((items) => (items.includes(solution.id) ? items : [...items, solution.id]));
    toast.success(solution.confirmation, {
      description: "Demo event only — no external control-room service was contacted.",
    });
    setSelected(null);
  };

  return (
    <AppShell>
      <ScreenHeader title="MINE" subtitle="Safety operations test centre" back="/home" />

      <section className="glass relative overflow-hidden rounded-2xl p-4">
        <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-warn/15 to-transparent" aria-hidden />
        <div className="relative flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-warn/50 bg-warn/10 text-warn">
            <RadioTower className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold">Mine safety network</p>
            <p className="mt-1 text-xs text-muted-foreground">Eight connected safety and compliance workflows</p>
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold text-safe">
            <span className="h-2 w-2 rounded-full bg-safe" /> LIVE
          </span>
        </div>
        <div className="relative mt-4 grid grid-cols-2 gap-2 text-center text-xs">
          <div className="rounded-xl bg-surface-2/70 p-2"><b className="block text-base text-foreground">8/8</b><span className="text-muted-foreground">Systems ready</span></div>
          <div className="rounded-xl bg-surface-2/70 p-2"><b className="block text-base text-foreground">{tested.length}/8</b><span className="text-muted-foreground">Tests complete</span></div>
        </div>
      </section>

      <h2 className="mt-6 mb-3 font-display text-sm font-bold text-muted-foreground">SAFETY SOLUTIONS</h2>
      <div className="grid grid-cols-2 gap-3">
        {SOLUTIONS.map((solution, index) => {
          const Icon = solution.icon;
          const complete = tested.includes(solution.id);
          return (
            <Button
              key={solution.id}
              variant="outline"
              onClick={() => setSelected(solution)}
              className="glass h-auto min-h-44 whitespace-normal rounded-2xl p-3 text-left hover:bg-surface-2"
            >
              <span className="flex h-full w-full flex-col items-start">
                <span className="flex w-full items-start justify-between gap-2">
                  <span className={cn("grid h-10 w-10 place-items-center rounded-xl border", toneClass[solution.tone])}>
                    <Icon className="h-5 w-5" />
                  </span>
                  {complete ? <CheckCircle2 className="h-4 w-4 text-safe" /> : <span className="text-[11px] text-muted-foreground">0{index + 1}</span>}
                </span>
                <span className="mt-3 block text-sm font-bold leading-snug text-foreground">{solution.title}</span>
                <span className="mt-1 block text-[11px] font-normal leading-relaxed text-muted-foreground">{solution.short}</span>
                <span className="mt-auto flex w-full items-center justify-between pt-3 text-[11px] font-semibold text-neon">
                  {complete ? "Tested" : "Open"}<ChevronRight className="h-3.5 w-3.5" />
                </span>
              </span>
            </Button>
          );
        })}
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="glass w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto rounded-2xl border-border p-5">
          {selected && SelectedIcon ? (
            <>
              <DialogHeader className="text-left">
                <span className={cn("mb-2 grid h-11 w-11 place-items-center rounded-xl border", toneClass[selected.tone])}>
                  <SelectedIcon className="h-5 w-5" />
                </span>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>{selected.detail}</DialogDescription>
              </DialogHeader>
              <SolutionInteractivePanel
                solution={selected}
                onExecute={() => runTest(selected)}
              />
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}