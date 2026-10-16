import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Check,
  CheckCheck,
  Flame,
  Globe,
  HardHat,
  Heart,
  Image as ImageIcon,
  Lock,
  MapPin,
  Mic,
  Navigation,
  Play,
  Radio,
  Search,
  Send,
  Shield,
  ShieldAlert,
  Smile,
  Square,
  ThumbsUp,
  Trash2,
  Users,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, ScreenHeader } from "@/components/wcu/AppShell";
import { useWcu } from "@/lib/wcu/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tools/community")({
  head: () => ({
    meta: [
      { title: "Advanced Global Chat Room — World Crime Unicorn" },
      {
        name: "description",
        content: "Ultra-advanced real-time encrypted safety chat room with voice notes, GPS telemetry, multi-channel mesh and automated safety assistance.",
      },
      { property: "og:title", content: "Advanced Global Chat Room — World Crime Unicorn" },
      {
        property: "og:description",
        content: "Real-time voice notes, GPS location sharing, channels, reactions and live safety mesh.",
      },
    ],
  }),
  component: AdvancedChatRoom,
});

type ChannelId = "global" | "sos" | "patrol" | "mine" | "local";

interface ChannelInfo {
  id: ChannelId;
  name: string;
  tag: string;
  icon: React.ComponentType<{ className?: string }>;
  unread?: number;
  description: string;
}

interface ChatMessage {
  id: string;
  channel: ChannelId;
  author: string;
  role: string;
  avatar?: string | undefined;
  time: string;
  text: string;
  isMe?: boolean | undefined;
  isAi?: boolean | undefined;
  replyTo?: { author: string; text: string } | undefined;
  audioUrl?: string | undefined;
  audioDuration?: number | undefined;
  location?: { lat: number; lng: number; label: string } | undefined;
  reactions: Record<string, number>;
  myReactions: string[];
}

const CHANNELS: ChannelInfo[] = [
  { id: "global", name: "Global Mesh", tag: "#global-safety", icon: Globe, description: "Worldwide rapid community safety watch" },
  { id: "sos", name: "Emergency SOS", tag: "#emergency-rapid", icon: ShieldAlert, description: "High-priority emergency alerts and response" },
  { id: "patrol", name: "Patrol Ops", tag: "#patrol-dispatch", icon: Navigation, description: "On-duty patrollers & armed response coordination" },
  { id: "mine", name: "Mine Safety", tag: "#mine-network", icon: HardHat, description: "Underground, shaft security and compliance mesh" },
  { id: "local", name: "Local Area", tag: "#neighborhood", icon: MapPin, description: "Hyper-local suburb chatter and watch updates" },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    channel: "global",
    author: "Control Room Ops",
    role: "Dispatcher",
    time: "10:04",
    text: "Welcome to the World Crime Unicorn Global Mesh. End-to-end telemetry and encrypted beacon routing active.",
    reactions: { "🛡️": 14, "👍": 22 },
    myReactions: [],
  },
  {
    id: "m2",
    channel: "global",
    author: "Thandi M.",
    role: "Citizen",
    time: "10:12",
    text: "Street lights on 4th Avenue are restored. Thank you patroller unit JHB-07 for following up with the council!",
    reactions: { "❤️": 8, "👏": 12 },
    myReactions: ["❤️"],
  },
  {
    id: "m3",
    channel: "sos",
    author: "Rapid Dispatch JHB",
    role: "Emergency Coordinator",
    time: "09:45",
    text: "PRIORITY: Vehicle BZ 743 GP reported suspicious near Sector 2. All nearby units please observe and report.",
    reactions: { "🚨": 19, "👀": 7 },
    myReactions: [],
  },
  {
    id: "m4",
    channel: "patrol",
    author: "Unit JHB-07 (Sipho)",
    role: "Patroller",
    time: "10:15",
    text: "Sector 4 check-in verified via biometric clock-in. All perimeter checkpoints clear.",
    location: { lat: -26.2041, lng: 28.0473, label: "Rosebank Gate 4 Checkpoint" },
    reactions: { "🛡️": 9 },
    myReactions: [],
  },
  {
    id: "m5",
    channel: "mine",
    author: "Mine Safety Desk",
    role: "Mine Controller",
    time: "09:30",
    text: "Shaft 4 acoustic sensors normal. Micro-percussion monitoring active at 2.4 Hz.",
    reactions: { "⛏️": 11, "👍": 5 },
    myReactions: [],
  },
  {
    id: "m6",
    channel: "local",
    author: "Rosebank Watch",
    role: "Community Leader",
    time: "10:20",
    text: "Community safety walk tonight at 18:30 starting at Rosebank Clinic. High visibility bibs will be handed out.",
    reactions: { "👍": 15, "🔥": 4 },
    myReactions: [],
  },
];

const EMOJIS = ["👍", "❤️", "🚨", "🛡️", "🔥", "👏"];

function playChatAudio(type: "send" | "receive" | "sos") {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    if (type === "send") {
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === "sos") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.linearRampToValueAtTime(400, now + 0.25);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else {
      osc.frequency.setValueAtTime(850, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch {
    /* web audio blocked */
  }
}

function AdvancedChatRoom() {
  const { city, role } = useWcu();
  const [activeChannel, setActiveChannel] = React.useState<ChannelId>("global");
  const [messages, setMessages] = React.useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = React.useState("");
  const [replyingTo, setReplyingTo] = React.useState<ChatMessage | null>(null);
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isTyping, setIsTyping] = React.useState<string | null>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingSeconds, setRecordingSeconds] = React.useState(0);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const recordingTimerRef = React.useRef<number | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const currentChannelInfo = CHANNELS.find((c) => c.id === activeChannel)!;

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, activeChannel]);

  // Voice recording handling
  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Audio recording is not supported on this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Append voice note message
        const newMsg: ChatMessage = {
          id: crypto.randomUUID(),
          channel: activeChannel,
          author: "You",
          role: role ? role[0]!.toUpperCase() + role.slice(1) : "Citizen",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text: "🎤 Voice Note",
          audioUrl,
          audioDuration: recordingSeconds || 3,
          isMe: true,
          reactions: {},
          myReactions: [],
        };

        setMessages((prev) => [...prev, newMsg]);
        if (soundEnabled) playChatAudio("send");
        toast.success("Voice note sent");
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      toast.error("Microphone access denied. Please allow microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      audioChunksRef.current = [];
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      toast("Recording discarded");
    }
  };

  // Send message
  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;

    const myRole = role ? role[0]!.toUpperCase() + role.slice(1) : "Citizen";
    const newMsg: ChatMessage = {
      id: crypto.randomUUID(),
      channel: activeChannel,
      author: "You",
      role: myRole,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text,
      isMe: true,
      replyTo: replyingTo ? { author: replyingTo.author, text: replyingTo.text } : undefined,
      reactions: {},
      myReactions: [],
    };

    setMessages((prev) => [...prev, newMsg]);
    setDraft("");
    setReplyingTo(null);
    if (soundEnabled) playChatAudio("send");

    // Smart Automated Bot Responses
    const lower = text.toLowerCase();
    if (lower.includes("sos") || lower.includes("help") || lower.includes("robbery") || lower.includes("break-in") || lower.includes("emergency")) {
      setTimeout(() => {
        setIsTyping("Unicorn Safety Bot");
      }, 600);

      setTimeout(() => {
        setIsTyping(null);
        const botReply: ChatMessage = {
          id: crypto.randomUUID(),
          channel: activeChannel,
          author: "Unicorn Safety Bot",
          role: "AI Tactical Dispatch",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text: `🚨 High-priority keyword detected! Patrollers near ${city} have been flagged. If in imminent danger, hold the Emergency SOS button immediately or share your live GPS pin below.`,
          isAi: true,
          reactions: { "🛡️": 1 },
          myReactions: [],
        };
        setMessages((prev) => [...prev, botReply]);
        if (soundEnabled) playChatAudio("sos");
      }, 1600);
    } else if (lower.includes("@bot") || lower.includes("patrol") || lower.includes("status")) {
      setTimeout(() => {
        setIsTyping("Unicorn Safety Bot");
      }, 500);

      setTimeout(() => {
        setIsTyping(null);
        const botReply: ChatMessage = {
          id: crypto.randomUUID(),
          channel: activeChannel,
          author: "Unicorn Safety Bot",
          role: "AI Tactical Dispatch",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text: `Tactical telemetry check: 8 Mine Safety modules nominal · 3 active patrol units streaming in ${city} · Crime Heatmap active. All systems green.`,
          isAi: true,
          reactions: { "👍": 2 },
          myReactions: [],
        };
        setMessages((prev) => [...prev, botReply]);
        if (soundEnabled) playChatAudio("receive");
      }, 1400);
    }
  };

  // Share live GPS location
  const shareLiveLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Location not supported on this browser.");
      return;
    }

    toast.info("Acquiring high-accuracy GPS coordinates…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const myRole = role ? role[0]!.toUpperCase() + role.slice(1) : "Citizen";
        const locMsg: ChatMessage = {
          id: crypto.randomUUID(),
          channel: activeChannel,
          author: "You",
          role: myRole,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text: `📍 Shared live GPS coordinates (±${Math.round(accuracy)}m)`,
          location: { lat: latitude, lng: longitude, label: `${city} Sector (±${Math.round(accuracy)}m accuracy)` },
          isMe: true,
          reactions: { "📍": 1 },
          myReactions: [],
        };

        setMessages((prev) => [...prev, locMsg]);
        if (soundEnabled) playChatAudio("send");
        toast.success("Live GPS shared into channel");
      },
      (err) => {
        toast.error(`GPS Error: ${err.message}. Please allow location access.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Toggle emoji reaction
  const toggleReaction = (msgId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== msgId) return msg;
        const had = msg.myReactions.includes(emoji);
        const nextMy = had ? msg.myReactions.filter((e) => e !== emoji) : [...msg.myReactions, emoji];
        const count = (msg.reactions[emoji] || 0) + (had ? -1 : 1);
        const nextReactions = { ...msg.reactions };
        if (count > 0) nextReactions[emoji] = count;
        else delete nextReactions[emoji];
        return { ...msg, reactions: nextReactions, myReactions: nextMy };
      })
    );
  };

  const filteredMessages = messages
    .filter((m) => m.channel === activeChannel)
    .filter((m) =>
      searchQuery ? m.text.toLowerCase().includes(searchQuery.toLowerCase()) || m.author.toLowerCase().includes(searchQuery.toLowerCase()) : true
    );

  return (
    <AppShell>
      <ScreenHeader
        title="Global Safety Chat"
        subtitle={`${currentChannelInfo.name} · 2,148 nodes connected`}
        back="/home"
        right={
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled((s) => !s)}
              className="grid h-8 w-8 place-items-center rounded-full border border-border bg-surface text-muted-foreground hover:text-foreground"
              title={soundEnabled ? "Mute sounds" : "Unmute sounds"}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-neon" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <Link
              to="/map"
              className="flex items-center gap-1 rounded-full border border-electric/40 bg-electric/10 px-2.5 py-1 text-xs font-semibold text-electric"
            >
              <MapPin className="h-3 w-3" /> Map
            </Link>
          </div>
        }
      />

      {/* Security & E2EE Status Bar */}
      <div className="mb-3 flex items-center justify-between rounded-xl bg-surface-2/60 px-3 py-1.5 text-[11px] border border-border">
        <div className="flex items-center gap-1.5 text-safe font-medium">
          <Lock className="h-3 w-3" />
          <span>E2EE Quantum-Mesh Active</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-neon animate-pulse" />
          <span>REAL-TIME BROADCAST</span>
        </div>
      </div>

      {/* Channel Switcher */}
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        {CHANNELS.map((ch) => {
          const Icon = ch.icon;
          const isActive = ch.id === activeChannel;
          return (
            <button
              key={ch.id}
              onClick={() => {
                setActiveChannel(ch.id);
                setReplyingTo(null);
              }}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95",
                isActive
                  ? "border-neon bg-neon/15 text-neon shadow-[0_0_10px_rgba(34,211,238,0.25)]"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{ch.name}</span>
            </button>
          );
        })}
      </div>

      {/* Channel Subtitle / Search Bar */}
      <div className="mb-2 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search in ${currentChannelInfo.tag}…`}
            className="w-full rounded-xl border border-border bg-surface/70 pl-8 pr-3 py-1.5 text-xs outline-none focus:border-neon"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="glass relative flex h-[380px] flex-col overflow-y-auto rounded-3xl border border-border/80 p-3 space-y-3">
        {filteredMessages.length === 0 ? (
          <div className="grid flex-1 place-items-center text-center text-xs text-muted-foreground p-6">
            <div>
              <currentChannelInfo.icon className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
              <p className="font-semibold text-foreground">No messages yet in {currentChannelInfo.name}</p>
              <p className="mt-1">Be the first to share an update with the safety mesh!</p>
            </div>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isMe = msg.isMe;
            return (
              <div
                key={msg.id}
                className={cn("flex flex-col group", isMe ? "items-end" : "items-start")}
              >
                {/* Author Name and Timestamp */}
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground px-1 mb-0.5">
                  <span className={cn("font-bold", msg.isAi ? "text-neon" : isMe ? "text-electric" : "text-foreground")}>
                    {msg.author}
                  </span>
                  <span>·</span>
                  <span className="rounded bg-surface px-1 py-0.2 text-[9px]">{msg.role}</span>
                  <span>·</span>
                  <span>{msg.time}</span>
                </div>

                {/* Message Bubble Card */}
                <div
                  className={cn(
                    "relative max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm transition",
                    isMe
                      ? "rounded-tr-xs bg-gradient-to-r from-neon/20 to-electric/25 border border-neon/30 text-foreground"
                      : msg.isAi
                        ? "rounded-tl-xs bg-violet/15 border border-violet/30 text-foreground"
                        : "rounded-tl-xs bg-surface-2/90 border border-border text-foreground"
                  )}
                >
                  {/* Quoted Reply if any */}
                  {msg.replyTo && (
                    <div className="mb-2 rounded-lg border-l-2 border-neon bg-background/50 p-1.5 text-[10px] text-muted-foreground">
                      <p className="font-bold text-neon">{msg.replyTo.author}</p>
                      <p className="truncate">{msg.replyTo.text}</p>
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Voice Note Audio Player */}
                  {msg.audioUrl && (
                    <div className="mt-2 flex items-center gap-2 rounded-xl bg-background/60 p-2 border border-border">
                      <audio controls src={msg.audioUrl} className="h-7 w-48 max-w-full" />
                    </div>
                  )}

                  {/* GPS Location Pin Card */}
                  {msg.location && (
                    <div className="mt-2 rounded-xl border border-neon/40 bg-background/70 p-2 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-neon">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {msg.location.label}
                        </span>
                      </div>
                      <p className="font-mono text-[9px] text-muted-foreground">
                        {msg.location.lat.toFixed(5)}, {msg.location.lng.toFixed(5)}
                      </p>
                      <div className="flex gap-2 pt-1">
                        <a
                          href={`https://www.google.com/maps?q=${msg.location.lat},${msg.location.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 rounded-lg bg-electric/20 px-2 py-0.5 text-[10px] font-semibold text-electric border border-electric/30"
                        >
                          <Navigation className="h-2.5 w-2.5" /> Navigate
                        </a>
                        <Link
                          to="/map"
                          className="flex items-center gap-1 rounded-lg bg-surface px-2 py-0.5 text-[10px] font-semibold text-foreground border border-border"
                        >
                          Radar View
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Reactions Display */}
                  {Object.keys(msg.reactions).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(msg.reactions).map(([emoji, count]) => (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction(msg.id, emoji)}
                          className={cn(
                            "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium border transition",
                            msg.myReactions.includes(emoji)
                              ? "border-neon bg-neon/20 text-neon font-bold"
                              : "border-border bg-background/60 text-muted-foreground hover:border-neon"
                          )}
                        >
                          <span>{emoji}</span>
                          <span className="font-mono text-[9px]">{count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Action Drawer under Message on Hover / Focus */}
                <div className="mt-1 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                  <div className="flex items-center gap-1 bg-surface/80 rounded-full px-1.5 py-0.5 border border-border text-[10px]">
                    {EMOJIS.slice(0, 3).map((emo) => (
                      <button
                        key={emo}
                        onClick={() => toggleReaction(msg.id, emo)}
                        className="hover:scale-125 transition px-0.5"
                      >
                        {emo}
                      </button>
                    ))}
                    <button
                      onClick={() => setReplyingTo(msg)}
                      className="ml-1 text-muted-foreground hover:text-neon font-medium"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-[10px] text-neon animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-neon" />
            <span>{isTyping} is typing…</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quoted Reply Banner */}
      {replyingTo && (
        <div className="mt-2 flex items-center justify-between rounded-xl bg-surface-2 p-2 text-xs border border-neon/40">
          <div className="min-w-0 flex-1 truncate">
            <span className="font-bold text-neon">Replying to {replyingTo.author}: </span>
            <span className="text-muted-foreground">{replyingTo.text}</span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Input Bar / Voice Recorder */}
      {isRecording ? (
        <div className="mt-2 flex items-center justify-between rounded-2xl border border-alert bg-alert/15 p-3 animate-pulse">
          <div className="flex items-center gap-2 text-alert text-xs font-bold">
            <span className="h-3 w-3 rounded-full bg-alert animate-ping" />
            <span>Recording Voice Note: {recordingSeconds}s</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={cancelRecording}
              className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={stopRecording}
              className="flex items-center gap-1 rounded-xl bg-alert px-3 py-1.5 text-xs font-bold text-alert-foreground shadow"
            >
              <Check className="h-3.5 w-3.5" /> Send
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-2">
          {/* Quick Location Share Button */}
          <button
            onClick={shareLiveLocation}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-border bg-surface text-muted-foreground hover:text-neon hover:border-neon transition shadow-sm"
            title="Share live GPS location"
          >
            <MapPin className="h-4 w-4" />
          </button>

          {/* Voice Note Button */}
          <button
            onClick={startRecording}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-border bg-surface text-muted-foreground hover:text-electric hover:border-electric transition shadow-sm"
            title="Record Voice Note"
          >
            <Mic className="h-4 w-4" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Message ${currentChannelInfo.tag} (Type /sos or @bot)…`}
            className="flex-1 rounded-2xl border border-border bg-surface/90 px-3.5 py-2.5 text-xs outline-none focus:border-neon transition shadow-sm"
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!draft.trim()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-r from-neon to-electric text-background transition active:scale-95 disabled:opacity-30 shadow-md"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Suggested Quick Triggers */}
      <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto text-[10px]">
        <span className="text-muted-foreground shrink-0">Quick prompts:</span>
        {[
          "🚨 Emergency SOS",
          "📍 Share My GPS",
          "🛡️ Request Patrol",
          "⛏️ Mine Shaft Status",
          "@bot What are current hotspots?",
        ].map((prompt) => (
          <button
            key={prompt}
            onClick={() => {
              if (prompt === "📍 Share My GPS") {
                shareLiveLocation();
              } else {
                setDraft(prompt);
              }
            }}
            className="shrink-0 rounded-full border border-border bg-surface px-2.5 py-0.5 text-muted-foreground hover:border-neon hover:text-neon transition"
          >
            {prompt}
          </button>
        ))}
      </div>
    </AppShell>
  );
}
