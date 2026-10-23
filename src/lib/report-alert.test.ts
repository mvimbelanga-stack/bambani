import { describe, expect, it } from "vitest";
import { reportAlertPayload, sealedReportInput } from "./report-alert";

describe("report push alerts", () => {
  it("includes the actual report coordinates without rounding", () => {
    const alert = reportAlertPayload({ title: "Test", description: "Test report", latitude: -26.2054123, longitude: 28.0491987 });
    expect(alert.target_url).toBe("https://www.google.com/maps?q=-26.2054123,28.0491987");
    expect(alert.body).toContain("-26.2054123, 28.0491987");
  });
  it("targets every subscriber without sending reporter identity", () => {
    const alert = reportAlertPayload({ title: "Test", description: "Test", latitude: 0, longitude: 0 });
    expect(Object.keys(alert).sort()).toEqual(["body", "require_interaction", "target_url", "title", "ttl", "urgent"]);
  });
  it("rejects invalid locations rather than inventing a report position", () => {
    const input = { title: "Test", description: "Test", latitude: 91, longitude: 28, hardwareFingerprint: "browser" };
    expect(sealedReportInput.safeParse(input).success).toBe(false);
    expect(sealedReportInput.safeParse({ ...input, latitude: -26 }).success).toBe(true);
  });
});