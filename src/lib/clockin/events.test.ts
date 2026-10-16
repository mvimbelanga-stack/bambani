import { describe, expect, it } from "vitest";
import { gpsAcceptable, livenessScore, MIN_LIVENESS } from "./events";

describe("clock-in rules", () => {
  it("liveness passes 0.85 only after both blink and nod", () => {
    expect(livenessScore(true, true, 0.8)).toBeGreaterThanOrEqual(MIN_LIVENESS);
    expect(livenessScore(true, false, 1)).toBeLessThan(MIN_LIVENESS);
    expect(livenessScore(false, true, 1)).toBeLessThan(MIN_LIVENESS);
  });
  it("rejects GPS accuracy worse than 50 m", () => {
    expect(gpsAcceptable(50)).toBe(true);
    expect(gpsAcceptable(51)).toBe(false);
  });
});
