import { describe, it, expect } from "vitest";
import {
  FADE_SECONDS,
  atmosphereFor,
  bloomIntensityFor,
  easeInOut,
  lerp,
  stepProgress,
} from "../nightFade";

describe("stepProgress", () => {
  it("fades over FADE_SECONDS at a constant rate", () => {
    expect(FADE_SECONDS).toBeGreaterThanOrEqual(0.8);
    expect(FADE_SECONDS).toBeLessThanOrEqual(1);
    expect(stepProgress(0, 1, FADE_SECONDS / 2)).toBeCloseTo(0.5, 6);
    expect(stepProgress(1, 0, FADE_SECONDS / 4)).toBeCloseTo(0.75, 6);
  });

  it("never overshoots the target, however long the frame", () => {
    expect(stepProgress(0.9, 1, 5)).toBe(1);
    expect(stepProgress(0.1, 0, 5)).toBe(0);
  });

  it("holds still at the target or with no elapsed time", () => {
    expect(stepProgress(1, 1, 0.016)).toBe(1);
    expect(stepProgress(0, 0, 0.016)).toBe(0);
    expect(stepProgress(0.3, 1, 0)).toBe(0.3);
  });

  it("ignores negative or NaN frame times", () => {
    expect(stepProgress(0.3, 1, -1)).toBe(0.3);
    expect(stepProgress(0.3, 1, NaN)).toBe(0.3);
  });

  it("can reverse mid-fade from wherever it is", () => {
    const up = stepProgress(0, 1, 0.45);
    expect(stepProgress(up, 0, 0.225)).toBeCloseTo(0.25, 6);
  });
});

describe("easeInOut", () => {
  it("maps 0, 0.5 and 1 to themselves and clamps outside", () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(0.5)).toBeCloseTo(0.5, 6);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(-1)).toBe(0);
    expect(easeInOut(2)).toBe(1);
  });

  it("starts and ends gently and is monotonic", () => {
    expect(easeInOut(0.1)).toBeLessThan(0.1);
    expect(easeInOut(0.9)).toBeGreaterThan(0.9);
    let last = -1;
    for (let t = 0; t <= 1.0001; t += 0.05) {
      expect(easeInOut(t)).toBeGreaterThanOrEqual(last);
      last = easeInOut(t);
    }
  });
});

describe("lerp", () => {
  it("interpolates linearly", () => {
    expect(lerp(2, 10, 0)).toBe(2);
    expect(lerp(2, 10, 1)).toBe(10);
    expect(lerp(2, 10, 0.25)).toBe(4);
  });
});

describe("atmosphereFor", () => {
  it("is the current daylight look at n = 0, whatever the configuration", () => {
    for (const dark of [true, false]) {
      expect(atmosphereFor(0, dark)).toEqual({ ambient: 0.04, directional: 0.35, point: 9, environment: 0.15 });
    }
  });

  it("is the current dark-room look at n = 1 for letters that glow (the key point light is off)", () => {
    expect(atmosphereFor(1, true)).toEqual({ ambient: 0.15, directional: 0.6, point: 0, environment: 0.05 });
  });

  it("keeps a dim key light at n = 1 for an unlit letter so it stays readable", () => {
    expect(atmosphereFor(1, false)).toEqual({ ambient: 0.06, directional: 0.25, point: 6, environment: 0.08 });
  });

  it("blends halfway at n = 0.5", () => {
    const a = atmosphereFor(0.5, true);
    expect(a.point).toBeCloseTo(4.5, 6);
    expect(a.directional).toBeCloseTo(0.475, 6);
  });
});

describe("bloomIntensityFor", () => {
  it("scales the bloom with the night amount for letters that glow", () => {
    expect(bloomIntensityFor(0, true)).toBe(0);
    expect(bloomIntensityFor(1, true)).toBeCloseTo(0.45, 6);
    expect(bloomIntensityFor(0.5, true)).toBeCloseTo(0.225, 6);
  });

  it("follows the dimmer: half level is half the bloom, and none at all at 0", () => {
    expect(bloomIntensityFor(1, true, 0.25)).toBeCloseTo(0.1125, 6);
    expect(bloomIntensityFor(1, true, 0)).toBe(0);
  });

  it("never blooms an unlit letter", () => {
    expect(bloomIntensityFor(1, false)).toBe(0);
  });
});
