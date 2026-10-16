import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Image as ImageIcon, Lock, Mic, Video, X } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { EVIDENCE_ITEMS } from "@/lib/wcu/data";
import { useWcu } from "@/lib/wcu/store";
import { getMedia, type MediaKind } from "@/lib/wcu/media";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tools/evidence")({
  head: () => ({
    meta: [
      { title: "Evidence Vault — World Crime Unicorn" },
      { name: "description", content: "Open your incident photos, videos and voice notes in one secure vault." },
      { property: "og:title", content: "Evidence Vault — World Crime Unicorn" },
      { property: "og:description", content: "Secure storage for incident photos, video and voice notes." },
    ],
  }),
  component: EvidenceVault,
});

type Item = { id: string; mediaId?: string; kind: MediaKind | "Document"; label: string; time: string; note?: string };

const ICONS = { Photo: ImageIcon, Video, Voice: Mic, Document: FileText } as const;

function useMediaUrl(id?: string) {
  const [url, setUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!id) return;
    let u: string | null = null;
    getMedia(id).then((b) => {
      if (b) {
        u = URL.createObjectURL(b);
        setUrl(u);
      }
    });
    return () => {
      if (u) URL.revokeObjectURL(u);
    };
  }, [id]);
  return url;
}

function Thumb({ item }: { item: Item }) {
  const url = useMediaUrl(item.kind === "Photo" ? item.mediaId : undefined);
  const Icon = ICONS[item.kind];
  if (url) return <img src={url} alt={item.label} className="h-28 w-full object-cover" />;
  return (
    <div className={cn("grid h-28 place-items-center", item.mediaId ? "bg-electric/20 text-electric" : "bg-violet/20 text-violet")}>
      <Icon className="h-8 w-8" />
    </div>
  );
}

function Viewer({ item, onClose }: { item: Item; onClose: () => void }) {
  const url = useMediaUrl(item.mediaId);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass w-full max-w-md animate-fade-in rounded-3xl p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold">{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.kind} · {item.time}</p>
          </div>
          <button onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        {!item.mediaId ? (
          <p className="rounded-2xl bg-surface-2 p-4 text-sm text-muted-foreground">
            Sample case file. Your own photos, videos and voice notes open here in full.
          </p>
        ) : !url ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Opening…</p>
        ) : item.kind === "Photo" ? (
          <img src={url} alt={item.label} className="max-h-[65vh] w-full rounded-2xl object-contain" />
        ) : item.kind === "Video" ? (
          <video src={url} controls autoPlay className="max-h-[65vh] w-full rounded-2xl" />
        ) : (
          <div className="rounded-2xl bg-surface-2 p-4">
            <Mic className="mx-auto mb-3 h-10 w-10 text-neon" />
            <audio src={url} controls autoPlay className="w-full" />
          </div>
        )}
        {url ? (
          <a href={url} download={item.label} className="mt-3 block rounded-2xl border border-border py-2 text-center text-sm font-semibold">
            Download
          </a>
        ) : null}
      </div>
    </div>
  );
}

function EvidenceVault() {
  const { reports } = useWcu();
  const [open, setOpen] = React.useState<Item | null>(null);
  const mine: Item[] = reports.flatMap((r) =>
    r.attachments.map((a) => ({
      id: a.id,
      mediaId: a.id,
      kind: a.kind,
      label: `${r.category} — ${r.ref}`,
      time: new Date(r.createdAt).toLocaleString(),
    })),
  );
  const samples: Item[] = EVIDENCE_ITEMS.map((e) => ({
    id: e.id,
    kind: e.type === "Audio" ? "Voice" : (e.type as Item["kind"]),
    label: e.label,
    time: e.time,
  }));

  return (
    <AppShell>
      <ScreenHeader title="Evidence Vault" subtitle="Tap any item to open it" back="/home" />
      <div className="glass mb-4 flex items-center gap-3 rounded-2xl p-3 text-xs text-muted-foreground">
        <Lock className="h-4 w-4 shrink-0 text-safe" />
        <span className="min-w-0">Your evidence is stored privately on this device.</span>
      </div>
      {!mine.length ? (
        <p className="mb-4 text-xs text-muted-foreground">No files yet — add photos, videos or voice notes when you report a crime.</p>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        {[...mine, ...samples].map((e) => (
          <button key={e.id} onClick={() => setOpen(e)} className="glass overflow-hidden rounded-2xl text-left transition-transform active:scale-[0.98]">
            <Thumb item={e} />
            <div className="p-3">
              <p className="truncate text-xs font-semibold">{e.label}</p>
              <p className="mt-1 truncate text-[11px] text-muted-foreground">{e.kind} · {e.time}</p>
            </div>
          </button>
        ))}
      </div>
      {open ? <Viewer item={open} onClose={() => setOpen(null)} /> : null}
    </AppShell>
  );
}
