import { describe, expect, it } from "vitest";
import { clockInsToCsv } from "./csv";

const row = { id: "1", user_id: "u", timestamp: "2026-11-03T10:00:00Z", latitude: -26.2, longitude: 28.04, gps_accuracy: 12.4, liveness_score: 0.95, status: "approved", face_thumbnail_url: null };

describe("clock-in CSV", () => {
  it("writes one header plus one line per record", () => {
    const csv = clockInsToCsv([row, row], () => "Thabo");
    expect(csv.split("\n")).toHaveLength(3);
    expect(csv.split("\n")[1]).toBe("2026-11-03T10:00:00Z,Thabo,approved,0.95,-26.2,28.04,12,");
  });
  it("blocks formula injection and quotes commas", () => {
    expect(clockInsToCsv([row], () => "=HACK(), x").split("\n")[1]).toContain(`"'=HACK(), x"`);
  });
});
