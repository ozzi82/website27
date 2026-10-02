import { describe, it, expect } from "vitest";
import { DEFAULT_BRIGHTNESS, brightnessFactor } from "../brightness";

describe("brightnessFactor", () => {
  it("defaults to full brightness", () => {
    expect(DEFAULT_BRIGHTNESS).toBe(100);
    expect(brightnessFactor(DEFAULT_BRIGHTNESS)).toBe(1);
  });

  it("is 0 when dimmed all the way (the LEDs are off)", () => {
    expect(brightnessFactor(0)).toBe(0);
  });

  it("follows a squared (perceptual) curve, so 50% looks about half as bright rather than a quarter", () => {
    expect(brightnessFactor(50)).toBeCloseTo(0.25, 6);
    expect(brightnessFactor(80)).toBeCloseTo(0.64, 6);
  });

  it("rises smoothly and never decreases", () => {
    let last = -1;
    for (let p = 0; p <= 100; p += 5) {
      const f = brightnessFactor(p);
      expect(f).toBeGreaterThan(last);
      last = f;
    }
  });

  it("clamps out-of-range and non-finite input", () => {
    expect(brightnessFactor(-20)).toBe(0);
    expect(brightnessFactor(250)).toBe(1);
    expect(brightnessFactor(NaN)).toBe(1);
  });
});
