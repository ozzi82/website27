import { describe, it, expect } from "vitest";
import { TARGET_SAMPLES, canPathTrace } from "../pathTraceSupport";

describe("pathTraceSupport", () => {
  it("reports no support where there is no WebGL 2 (jsdom), instead of throwing", () => {
    expect(canPathTrace()).toBe(false);
  });

  it("refines to a sensible number of samples", () => {
    expect(TARGET_SAMPLES).toBeGreaterThanOrEqual(100);
    expect(TARGET_SAMPLES).toBeLessThanOrEqual(1000);
  });
});
