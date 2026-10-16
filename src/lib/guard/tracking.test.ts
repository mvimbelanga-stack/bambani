import { describe, expect, it } from "vitest";
import { movementStatus, noMovementAlert, outsideZone, shouldStream, visibleGuards } from "./tracking";

describe("guard tracking rules", () => {
  it("streams only while on duty, every 7 s", () => {
    expect(shouldStream(false, null, 0)).toBe(false);
    expect(shouldStream(true, null, 0)).toBe(true);
    expect(shouldStream(true, 0, 6000)).toBe(false);
    expect(shouldStream(true, 0, 7000)).toBe(true);
  });
  it("movement status", () => {
    expect(movementStatus(false, 5)).toBe("Offline");
    expect(movementStatus(true, 1.2)).toBe("Moving");
    expect(movementStatus(true, 0)).toBe("Stationary");
  });
  it("geofence exit beyond radius", () => {
    expect(outsideZone(-26.2041, 28.0473, -26.2041, 28.0473, 500)).toBe(false);
    expect(outsideZone(-26.2141, 28.0473, -26.2041, 28.0473, 500)).toBe(true);
  });
  it("no movement after more than 10 minutes", () => {
    expect(noMovementAlert(0, 10 * 60 * 1000)).toBe(false);
    expect(noMovementAlert(0, 10 * 60 * 1000 + 1)).toBe(true);
  });
  it("logged-off guards are removed from the control screen", () => {
    expect(visibleGuards([{ onDuty: true }, { onDuty: false }])).toHaveLength(1);
  });
});
