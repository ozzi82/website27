import { describe, it, expect } from "vitest";
import {
  MIN_DEPTH_RATIO,
  MAX_DEPTH_RATIO,
  depthRatioFor,
  sideBandThickness,
  tubeRadius,
  wallGapFor,
} from "../renderMath";

describe("depthRatioFor", () => {
  it("is depth over letter height in the same unit", () => {
    // 50 mm deep on a 12 in (304.8 mm) letter
    expect(depthRatioFor(50, 12)).toBeCloseTo(50 / 304.8, 6);
  });

  it("makes the same depth look much deeper on a smaller letter", () => {
    expect(depthRatioFor(30, 2)).toBeGreaterThan(depthRatioFor(30, 24) * 10);
  });

  it("clamps extreme combinations so the preview stays renderable", () => {
    expect(depthRatioFor(200, 2)).toBe(MAX_DEPTH_RATIO);
    expect(depthRatioFor(1, 240)).toBe(MIN_DEPTH_RATIO);
    expect(MIN_DEPTH_RATIO).toBe(0.01);
    expect(MAX_DEPTH_RATIO).toBe(0.6);
  });

  it("falls back to the minimum for a non-positive or non-finite letter height", () => {
    expect(depthRatioFor(30, 0)).toBe(MAX_DEPTH_RATIO);
    expect(Number.isFinite(depthRatioFor(30, NaN))).toBe(true);
  });
});

describe("sideBandThickness", () => {
  it("is about 10 mm of the letter, but never more than 40% or less than 15% of the depth", () => {
    // 12 in letter, 1.0 world height unit, depth 0.1: 10 mm = 0.033 -> inside [0.015, 0.04]
    expect(sideBandThickness(0.1, 1, 12)).toBeCloseTo(0.0328, 3);
    // very small letter: 10 mm is huge relative to the letter -> clamped to 40% of depth
    expect(sideBandThickness(0.1, 1, 2)).toBeCloseTo(0.04, 6);
    // very large letter: 10 mm is tiny -> clamped to 15% of depth
    expect(sideBandThickness(0.1, 1, 240)).toBeCloseTo(0.015, 6);
  });
});

describe("tubeRadius", () => {
  it("is limited to half the depth so the rounded profile always fits", () => {
    expect(tubeRadius(0.05, 2.4)).toBeCloseTo(0.025, 6);
  });

  it("is limited relative to the letter height so thin strokes survive", () => {
    expect(tubeRadius(10, 2.4)).toBeLessThanOrEqual(2.4 * 0.04 + 1e-9);
  });
});

describe("wallGapFor", () => {
  it("floats standoff mounts off the wall and keeps flat/flush mounts tight", () => {
    expect(wallGapFor("standoff")).toBeGreaterThan(wallGapFor("flush"));
    expect(wallGapFor("flush")).toBeGreaterThan(0);
    expect(wallGapFor("flat")).toBeGreaterThan(0);
    expect(wallGapFor("standoff")).toBeCloseTo(0.12, 6);
  });
});
