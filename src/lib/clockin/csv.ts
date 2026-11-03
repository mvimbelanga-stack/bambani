export type ClockInRow = {
  id: string;
  user_id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  gps_accuracy: number;
  liveness_score: number;
  status: string;
  face_thumbnail_url: string | null;
};

export const SUPERVISOR_ROLES = ["admin", "dispatcher", "security_company"] as const;

function cell(v: unknown) {
  let s = v == null ? "" : String(v);
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function clockInsToCsv(rows: ClockInRow[], nameOf: (id: string) => string) {
  const head = ["Time", "Patroller", "Status", "Liveness", "Latitude", "Longitude", "GPS accuracy (m)", "Face thumbnail"];
  const body = rows.map((r) =>
    [r.timestamp, nameOf(r.user_id), r.status, r.liveness_score, r.latitude, r.longitude, Math.round(r.gps_accuracy), r.face_thumbnail_url].map(cell).join(","),
  );
  return [head.join(","), ...body].join("\n");
}
