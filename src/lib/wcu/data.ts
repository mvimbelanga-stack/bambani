export type Role = "citizen" | "patroller" | "police" | "security";

export const ROLES: { id: Role; label: string; blurb: string }[] = [
  { id: "citizen", label: "Citizen", blurb: "Report, stay informed, stay safe." },
  { id: "patroller", label: "Patroller", blurb: "Manage routes, get real-time info." },
  { id: "police", label: "Police", blurb: "Coordinate, respond, solve." },
  { id: "security", label: "Security Company", blurb: "Professional tools & analytics." },
];

export const CITIES = [
  "Johannesburg, South Africa",
  "Cape Town, South Africa",
  "Durban, South Africa",
  "Nairobi, Kenya",
  "Lagos, Nigeria",
  "London, United Kingdom",
];

export type CrimeCategory =
  | "Theft"
  | "Assault"
  | "Robbery"
  | "Kidnapping"
  | "Fraud"
  | "Vandalism"
  | "Suspicious Activity"
  | "Other";

export const CRIME_CATEGORIES: { id: CrimeCategory; icon: string }[] = [
  { id: "Theft", icon: "theft" },
  { id: "Assault", icon: "assault" },
  { id: "Robbery", icon: "robbery" },
  { id: "Kidnapping", icon: "kidnapping" },
  { id: "Fraud", icon: "fraud" },
  { id: "Vandalism", icon: "vandalism" },
  { id: "Suspicious Activity", icon: "suspicious" },
  { id: "Other", icon: "other" },
];

export type PinKind = "hotspot" | "patrol" | "safe";

export type MapPin = {
  id: string;
  kind: PinKind;
  x: number; // percentage across the map canvas
  y: number;
  title: string;
  detail: string;
  distanceKm: number;
  ago: string;
  severity?: "high" | "medium" | "low";
};

export const MAP_PINS: MapPin[] = [
  {
    id: "p1",
    kind: "hotspot",
    x: 34,
    y: 18,
    title: "Armed robbery reported",
    detail: "Two suspects fled on foot near Main Street shops.",
    distanceKm: 2.4,
    ago: "12 min ago",
    severity: "high",
  },
  {
    id: "p2",
    kind: "hotspot",
    x: 58,
    y: 30,
    title: "Vehicle break-in",
    detail: "Window smashed in the Westgate parking area.",
    distanceKm: 3.1,
    ago: "38 min ago",
    severity: "medium",
  },
  {
    id: "p3",
    kind: "hotspot",
    x: 22,
    y: 52,
    title: "Assault reported",
    detail: "Altercation outside a late-night venue.",
    distanceKm: 1.2,
    ago: "1 hour ago",
    severity: "high",
  },
  {
    id: "p4",
    kind: "hotspot",
    x: 70,
    y: 62,
    title: "Phone snatching",
    detail: "Repeat incidents at the taxi rank corner.",
    distanceKm: 4.6,
    ago: "2 hours ago",
    severity: "medium",
  },
  {
    id: "p5",
    kind: "patrol",
    x: 47,
    y: 44,
    title: "Patrol unit JHB-07",
    detail: "On active route, 3 check-ins completed.",
    distanceKm: 0.8,
    ago: "Live",
  },
  {
    id: "p6",
    kind: "patrol",
    x: 64,
    y: 20,
    title: "Patrol unit JHB-12",
    detail: "Responding to a community call-out.",
    distanceKm: 2.9,
    ago: "Live",
  },
  {
    id: "p7",
    kind: "safe",
    x: 30,
    y: 34,
    title: "Rosebank Clinic",
    detail: "24-hour medical facility and safe point.",
    distanceKm: 1.7,
    ago: "Open now",
  },
  {
    id: "p8",
    kind: "safe",
    x: 52,
    y: 70,
    title: "Central Police Station",
    detail: "Staffed front desk, CCTV monitored.",
    distanceKm: 3.4,
    ago: "Open now",
  },
  {
    id: "p9",
    kind: "safe",
    x: 78,
    y: 48,
    title: "Northview Primary School",
    detail: "Guarded zone during school hours.",
    distanceKm: 5.0,
    ago: "Open now",
  },
];

export type AlertTone = "alert" | "electric" | "violet";

export type AiAlert = {
  id: string;
  tone: AlertTone;
  kind: string;
  title: string;
  body: string;
  ago: string;
  action: "map" | "details";
  meta?: { label: string; value: string }[];
};

export const AI_ALERTS: AiAlert[] = [
  {
    id: "a1",
    tone: "alert",
    kind: "Threat",
    title: "Potential Threat Detected",
    body: "Unusual crowd behavior detected near the mall area.",
    ago: "12 min ago",
    action: "map",
    meta: [
      { label: "Confidence", value: "87%" },
      { label: "Area", value: "Westgate Mall" },
      { label: "Source", value: "Crowd density model" },
    ],
  },
  {
    id: "a2",
    tone: "electric",
    kind: "Vehicle",
    title: "Suspicious Vehicle",
    body: "White Toyota Hilux · Plate BZ 743 GP seen near Westgate Mall.",
    ago: "23 min ago",
    action: "map",
    meta: [
      { label: "Plate", value: "BZ 743 GP" },
      { label: "Make", value: "Toyota Hilux (white)" },
      { label: "Matches", value: "3 sightings today" },
    ],
  },
  {
    id: "a3",
    tone: "violet",
    kind: "Person",
    title: "Wanted Person Alert",
    body: "Possible sighting in your area. Do not approach.",
    ago: "1 hour ago",
    action: "details",
    meta: [
      { label: "Case", value: "#JHB-22841" },
      { label: "Wanted for", value: "Aggravated robbery" },
      { label: "Last seen", value: "Main Street, 18:40" },
    ],
  },
  {
    id: "a4",
    tone: "electric",
    kind: "Pattern",
    title: "Emerging Crime Pattern",
    body: "Break-ins clustering along the N1 offramp between 21:00 and 00:00.",
    ago: "3 hours ago",
    action: "map",
    meta: [
      { label: "Incidents", value: "9 in 7 days" },
      { label: "Trend", value: "Up 24%" },
    ],
  },
];

export const PATROL_CHECKINS = [
  { id: "c1", point: "Gate 4 — Rosebank", time: "08:12", status: "Complete" },
  { id: "c2", point: "Main Street corner", time: "09:05", status: "Complete" },
  { id: "c3", point: "Westgate parking deck", time: "10:30", status: "Complete" },
  { id: "c4", point: "Northview School", time: "11:45", status: "Pending" },
  { id: "c5", point: "Central Station handover", time: "13:00", status: "Pending" },
];

export const EVIDENCE_ITEMS = [
  { id: "e1", type: "Photo", label: "Broken window — Westgate", time: "Today 10:34", tone: "electric" },
  { id: "e2", type: "Video", label: "Suspect vehicle passing", time: "Today 09:12", tone: "violet" },
  { id: "e3", type: "Audio", label: "Witness statement", time: "Yesterday 22:04", tone: "neon" },
  { id: "e4", type: "Photo", label: "Graffiti — Park wall", time: "Yesterday 17:20", tone: "warn" },
  { id: "e5", type: "Document", label: "Case notes JHB-22841", time: "2 days ago", tone: "electric" },
  { id: "e6", type: "Photo", label: "Recovered handbag", time: "3 days ago", tone: "neon" },
] as const;

export const WEEKLY_STATS = [
  { day: "Mon", reports: 12, resolved: 7 },
  { day: "Tue", reports: 18, resolved: 11 },
  { day: "Wed", reports: 9, resolved: 6 },
  { day: "Thu", reports: 22, resolved: 14 },
  { day: "Fri", reports: 31, resolved: 18 },
  { day: "Sat", reports: 38, resolved: 21 },
  { day: "Sun", reports: 24, resolved: 16 },
];

export const CATEGORY_STATS = [
  { name: "Theft", value: 34 },
  { name: "Robbery", value: 22 },
  { name: "Vandalism", value: 16 },
  { name: "Fraud", value: 14 },
  { name: "Assault", value: 9 },
  { name: "Other", value: 5 },
];

export const COMMUNITY_POSTS = [
  {
    id: "cp1",
    author: "Thandi M.",
    role: "Citizen",
    ago: "18 min ago",
    body: "Street lights out on 4th Avenue again — please be careful walking after dark.",
    replies: 6,
  },
  {
    id: "cp2",
    author: "Rosebank Watch",
    role: "Community group",
    ago: "1 hour ago",
    body: "Neighbourhood walk tonight at 18:30, meeting at the clinic car park. All welcome.",
    replies: 14,
  },
  {
    id: "cp3",
    author: "Unit JHB-07",
    role: "Patroller",
    ago: "2 hours ago",
    body: "Extra cover around the school gates this week after yesterday's incident.",
    replies: 3,
  },
];
