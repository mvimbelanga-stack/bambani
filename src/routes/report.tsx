import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Ban,
  Camera,
  CheckCircle2,
  CreditCard,
  Eye,
  Hand,
  MapPin,
  Mic,
  MoreHorizontal,
  SprayCan,
  Target,
  UserMinus,
  Video,
  Wallet,
} from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { CRIME_CATEGORIES, type CrimeCategory } from "@/lib/wcu/data";
import { useWcu } from "@/lib/wcu/store";
import { kindFromFile, saveMedia, type Attachment } from "@/lib/wcu/media";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report a Crime — World Crime Unicorn" },
      {
        name: "description",
        content:
          "Report theft, assault, robbery and more in seconds with photo, video or voice evidence and GPS location tagging.",
      },
      { property: "og:title", content: "Report a Crime — World Crime Unicorn" },
      {
        property: "og:description",
        content: "Fast, guided crime reporting with evidence attachments and location tagging.",
      },
    ],
  }),
  component: ReportScreen,
});

const CATEGORY_ICONS: Record<CrimeCategory, typeof Wallet> = {
  Theft: Wallet,
  Assault: Hand,
  Robbery: Target,
  Kidnapping: UserMinus,
  Fraud: CreditCard,
  Vandalism: SprayCan,
  "Suspicious Activity": Eye,
  Other: MoreHorizontal,
};

function ReportScreen() {
  const { city, addReport } = useWcu();
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1);
  const [category, setCategory] = React.useState<CrimeCategory | null>(null);
  const [description, setDescription] = React.useState("");
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [previews, setPreviews] = React.useState<Record<string, string>>({});
  const [recording, setRecording] = React.useState(false);
  const recRef = React.useRef<MediaRecorder | null>(null);
  const photoRef = React.useRef<HTMLInputElement>(null);
  const videoRef = React.useRef<HTMLInputElement>(null);
  const [location, setLocation] = React.useState(city);
  const [locating, setLocating] = React.useState(false);
  const [gpsCoords, setGpsCoords] = React.useState<{ lat: number; lng: number } | null>(null);
  const [ref, setRef] = React.useState<string | null>(null);

  const addBlob = async (blob: Blob, name: string) => {
    try {
      const id = await saveMedia(blob);
      const kind = kindFromFile(blob);
      setAttachments((a) => [...a, { id, kind, name }]);
      setPreviews((p) => ({ ...p, [id]: URL.createObjectURL(blob) }));
      toast.success(`${kind === "Voice" ? "Voice note" : kind} added`);
    } catch {
      toast.error("Couldn't save that file on this device");
    }
  };

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach((f) => void addBlob(f, f.name));
    e.target.value = "";
  };

  const toggleVoice = async () => {
    if (recording) {
      recRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (ev) => chunks.push(ev.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        void addBlob(blob, `Voice note ${new Date().toLocaleTimeString()}`);
      };
      recRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      toast.error("Microphone access was blocked — allow it in your browser to record.");
    }
  };

  React.useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)} (±${Math.round(pos.coords.accuracy)}m)`);
          setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    }
  }, []);

  const useGps = () => {
    setLocating(true);
    if (!("geolocation" in navigator)) {
      setLocating(false);
      toast.error("Location services unavailable on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)} (±${Math.round(pos.coords.accuracy)}m)`);
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success(`Locked GPS: ±${Math.round(pos.coords.accuracy)}m accuracy`);
      },
      (err) => {
        setLocating(false);
        toast.error(`GPS Error: ${err.message}. Please enable location permissions.`);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };

  const submit = () => {
    if (!category) return;
    const report = addReport({
      category,
      description,
      attachments,
      location,
      ...(gpsCoords ? { lat: gpsCoords.lat, lng: gpsCoords.lng } : {}),
    });
    setRef(report.ref);
  };

  if (ref) {
    return (
      <AppShell>
        <ScreenHeader title="Report submitted" back="/home" />
        <div className="glass mt-8 flex flex-col items-center rounded-3xl p-6 text-center">
          <CheckCircle2 className="h-14 w-14 text-safe" />
          <h2 className="mt-4 font-display text-lg font-bold">Alert sent</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Nearby patrols and responders have been notified. Keep this reference for follow-up.
          </p>
          <p className="mt-4 rounded-xl bg-surface-2 px-4 py-2 font-display text-base tracking-widest text-neon">
            {ref}
          </p>
          <Link
            to="/map"
            className="mt-6 w-full rounded-2xl bg-electric py-3 text-sm font-semibold text-electric-foreground"
          >
            See it on the live map
          </Link>
          <Link to="/home" className="mt-3 text-xs text-muted-foreground">
            Back to dashboard
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ScreenHeader
        title="Report Crime"
        subtitle={`Step ${step} of 3`}
        back="/home"
      />

      <div className="mb-5 flex gap-1.5">
        {[1, 2, 3].map((s) => (
          <span
            key={s}
            className={cn("h-1 flex-1 rounded-full", s <= step ? "bg-neon" : "bg-surface-2")}
          />
        ))}
      </div>

      {step === 1 ? (
        <>
          <p className="mb-3 text-sm text-muted-foreground">What are you reporting?</p>
          <div className="grid grid-cols-2 gap-3">
            {CRIME_CATEGORIES.map(({ id }) => {
              const Icon = CATEGORY_ICONS[id];
              const on = category === id;
              return (
                <button
                  key={id}
                  onClick={() => setCategory(id)}
                  className={cn(
                    "flex h-24 flex-col items-center justify-center gap-2 rounded-2xl border bg-surface/70 px-2 text-center",
                    on ? "border-neon glow-neon" : "border-border",
                  )}
                >
                  <Icon className={cn("h-6 w-6", on ? "text-neon" : "text-foreground/80")} />
                  <span className="text-xs font-semibold">{id}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <label htmlFor="desc" className="mb-2 block text-sm text-muted-foreground">
            What happened?
          </label>
          <textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Describe the incident, suspects and direction of travel…"
            className="w-full rounded-2xl border border-border bg-surface/70 p-3 text-sm outline-none focus:border-neon"
          />
          <p className="mt-5 mb-2 text-sm text-muted-foreground">Add evidence</p>
          <input ref={photoRef} type="file" accept="image/*" capture="environment" multiple hidden onChange={onFiles} />
          <input ref={videoRef} type="file" accept="video/*" capture="environment" hidden onChange={onFiles} />
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "Photo", icon: Camera, label: "Photo", onClick: () => photoRef.current?.click() },
              { id: "Video", icon: Video, label: "Video", onClick: () => videoRef.current?.click() },
              { id: "Voice", icon: Mic, label: recording ? "Stop ●" : "Voice", onClick: toggleVoice },
            ].map(({ id, icon: Icon, label, onClick }) => (
              <button
                key={id}
                type="button"
                onClick={onClick}
                className={cn(
                  "flex h-24 flex-col items-center justify-center gap-2 rounded-2xl border bg-surface/70",
                  id === "Voice" && recording ? "border-alert text-alert animate-pulse" : "border-border text-foreground/80",
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-semibold">{label}</span>
              </button>
            ))}
          </div>
          {attachments.length ? (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {attachments.map((a) => (
                <div key={a.id} className="overflow-hidden rounded-xl border border-border bg-surface/70">
                  {a.kind === "Photo" ? (
                    <img src={previews[a.id]} alt={a.name} className="h-20 w-full object-cover" />
                  ) : a.kind === "Video" ? (
                    <video src={previews[a.id]} className="h-20 w-full object-cover" muted />
                  ) : (
                    <div className="grid h-20 place-items-center text-neon"><Mic className="h-6 w-6" /></div>
                  )}
                  <button
                    type="button"
                    onClick={() => setAttachments((x) => x.filter((y) => y.id !== a.id))}
                    className="w-full py-1 text-[10px] text-muted-foreground"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <p className="mt-3 text-xs text-muted-foreground">
            Files are saved securely on this device and appear in your Evidence Vault.
          </p>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <p className="mb-2 text-sm text-muted-foreground">Location tag</p>
          <div className="glass flex items-center gap-3 rounded-2xl p-3">
            <MapPin className="h-5 w-5 shrink-0 text-neon" />
            <span className="min-w-0 flex-1 truncate text-sm">{location}</span>
          </div>
          <button
            onClick={useGps}
            className="mt-3 w-full rounded-2xl border border-electric/60 py-3 text-sm font-semibold text-electric"
          >
            {locating ? "Getting your location…" : "Use my current GPS location"}
          </button>

          <div className="glass mt-6 space-y-2 rounded-2xl p-4 text-sm">
            <p className="font-display text-sm font-bold tracking-wide">Summary</p>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Category</span>
              <span className="truncate font-semibold">{category}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Evidence</span>
              <span className="truncate font-semibold">
                {attachments.length ? `${attachments.length} file${attachments.length > 1 ? "s" : ""}` : "None"}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Description</span>
              <span className="truncate font-semibold">{description ? "Added" : "None"}</span>
            </div>
          </div>
        </>
      ) : null}

      <div className="mt-8 flex gap-3">
        {step > 1 ? (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold"
          >
            Back
          </button>
        ) : null}
        {step < 3 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 1 && !category}
            className="glow-electric flex-[2] rounded-2xl bg-gradient-to-r from-electric to-violet py-3 text-sm font-bold tracking-wide text-electric-foreground disabled:opacity-40"
          >
            Next
          </button>
        ) : (
          <button
            onClick={submit}
            className="glow-alert flex-[2] rounded-2xl bg-alert py-3 text-sm font-bold tracking-wide text-alert-foreground"
          >
            Submit report
          </button>
        )}
      </div>

      {step === 1 && !category ? (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Ban className="h-3.5 w-3.5" /> Choose a category to continue
        </p>
      ) : null}
    </AppShell>
  );
}
