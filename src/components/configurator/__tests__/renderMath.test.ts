import { describe, it, expect } from "vitest";
import * as THREE from "three";
import {
  conicalInset,
  estimateHalfStroke,
  MIN_DEPTH_RATIO,
  MAX_DEPTH_RATIO,
  NOMINAL_LETTER_HEIGHT_MM,
  depthRatioFor,
  sideBandThickness,
  neonRoundRadius,
  litBandThickness,
  wallGapFor,
} from "../renderMath";

describe("depthRatioFor", () => {
  it("is depth over the nominal letter height", () => {
    expect(NOMINAL_LETTER_HEIGHT_MM).toBe(300);
    expect(depthRatioFor(30)).toBeCloseTo(0.1, 6);
    expect(depthRatioFor(75)).toBeCloseTo(0.25, 6);
  });

  it("always grows with depth, so a deeper choice is visibly thicker", () => {
    const ratios = [5, 15, 30, 50, 75, 100].map((mm) => depthRatioFor(mm));
    for (let i = 1; i < ratios.length; i++) expect(ratios[i]).toBeGreaterThan(ratios[i - 1]);
  });

  it("clamps extreme depths so the preview stays renderable", () => {
    expect(depthRatioFor(1000)).toBe(MAX_DEPTH_RATIO);
    expect(depthRatioFor(0.5)).toBe(MIN_DEPTH_RATIO);
    expect(MIN_DEPTH_RATIO).toBe(0.01);
    expect(MAX_DEPTH_RATIO).toBe(0.6);
  });

  it("falls back to the minimum for a non-finite depth", () => {
    expect(depthRatioFor(NaN)).toBe(MIN_DEPTH_RATIO);
  });
});

describe("sideBandThickness", () => {
  it("is about 10 mm of the nominal letter, but never more than 40% or less than 15% of the depth", () => {
    // 1.0 world height unit: 10 mm of 300 mm = 0.0333
    expect(sideBandThickness(0.1, 1)).toBeCloseTo(0.0333, 3);
    // shallow depth: the raw band is huge relative to the depth -> clamped to 40% of depth
    expect(sideBandThickness(0.05, 1)).toBeCloseTo(0.02, 6);
    // very deep letter: the raw band is a sliver -> clamped to 15% of depth
    expect(sideBandThickness(0.4, 1)).toBeCloseTo(0.06, 6);
  });
});

describe("estimateHalfStroke", () => {
  const ring = (r: number, n = 256) =>
    Array.from({ length: n }, (_, i) => new THREE.Vector2(r * Math.cos((2 * Math.PI * i) / n), r * Math.sin((2 * Math.PI * i) / n)));

  it("recovers half the stroke width of a uniform ring (area / perimeter)", () => {
    // outer radius 1.2, inner radius 0.6: stroke 0.6, half-stroke 0.3
    expect(estimateHalfStroke([{ outline: ring(1.2), holes: [ring(0.6)] }])).toBeCloseTo(0.3, 2);
  });

  it("recovers half the width of a thin bar", () => {
    const bar = [new THREE.Vector2(0, 0), new THREE.Vector2(10, 0), new THREE.Vector2(10, 0.4), new THREE.Vector2(0, 0.4)];
    expect(estimateHalfStroke([{ outline: bar, holes: [] }])).toBeCloseTo(0.4 / 2, 1);
  });

  it("is orientation independent and sums over several shapes", () => {
    const bar = [new THREE.Vector2(0, 0), new THREE.Vector2(10, 0), new THREE.Vector2(10, 0.4), new THREE.Vector2(0, 0.4)];
    const one = estimateHalfStroke([{ outline: bar, holes: [] }]);
    const reversed = estimateHalfStroke([{ outline: [...bar].reverse(), holes: [] }, { outline: bar, holes: [] }]);
    expect(reversed).toBeCloseTo(one, 6);
  });

  it("returns 0 for degenerate input", () => {
    expect(estimateHalfStroke([])).toBe(0);
  });
});

describe("neonRoundRadius", () => {
  it("never exceeds half the thickness, so the rounding fits", () => {
    expect(neonRoundRadius(0.05, 3, 10)).toBeCloseTo(0.025, 6);
  });

  it("is limited by the 0.5 in (12.7 mm) tool, scaled to the nominal 300 mm letter", () => {
    expect(neonRoundRadius(10, 3, 10)).toBeCloseTo((12.7 / 300) * 3, 6);
  });

  it("stays below the half-stroke so the front cap never inverts", () => {
    const r = neonRoundRadius(10, 30, 0.3);
    expect(r).toBeGreaterThan(0.2);
    expect(r).toBeLessThan(0.3);
  });
});

describe("litBandThickness", () => {
  it("is the stated share of the depth, else the nominal brochure band", () => {
    expect(litBandThickness(0.4, 3, 0.5)).toBeCloseTo(0.2, 6);
    expect(litBandThickness(0.4, 3)).toBeCloseTo(sideBandThickness(0.4, 3), 6);
  });
});

describe("conicalInset", () => {
  it("tapers by 3.5% of the letter height, but never more than half the half-stroke", () => {
    expect(conicalInset(2.4, 1)).toBeCloseTo(0.084, 6);
    expect(conicalInset(2.4, 0.04)).toBeCloseTo(0.02, 6);
  });
});

describe("wallGapFor", () => {
  it("floats standoff mounts off the wall and keeps flat/flush mounts tight", () => {
    expect(wallGapFor("standoff")).toBeGreaterThan(wallGapFor("flush"));
    expect(wallGapFor("flush")).toBeGreaterThan(0);
    expect(wallGapFor("flush")).toBeGreaterThan(0);
    expect(wallGapFor("standoff")).toBeCloseTo(0.12, 6);
  });
});
