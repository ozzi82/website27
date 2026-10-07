import { describe, it, expect } from "vitest";
import * as THREE from "three";
import {
  conicalInset,
  estimateHalfStroke,
  MAX_DEPTH_WORLD,
  MIN_DEPTH_WORLD,
  depthWorldFor,
  sideBandThickness,
  neonRoundRadius,
  litBandThickness,
  wallGapFor,
} from "../renderMath";
import { mmToWorld } from "../realSize";

describe("depthWorldFor", () => {
  it("is the real depth in millimetres, converted at the sign's size (true scale)", () => {
    expect(depthWorldFor(30, 100)).toBeCloseTo(mmToWorld(30, 100), 9); // 30 mm at 100": 0.0283 units
    expect(depthWorldFor(30, 100)).toBeCloseTo(0.0283, 3);
    // the same 30 mm is twice as many units on a sign half the size
    expect(depthWorldFor(30, 50)).toBeCloseTo(2 * depthWorldFor(30, 100), 9);
  });

  it("always grows with depth, so a deeper choice is visibly thicker", () => {
    const depths = [5, 15, 30, 50, 75, 100].map((mm) => depthWorldFor(mm, 100));
    for (let i = 1; i < depths.length; i++) expect(depths[i]).toBeGreaterThan(depths[i - 1]);
  });

  it("clamps extreme depths so the preview stays renderable", () => {
    expect(depthWorldFor(100000, 100)).toBe(MAX_DEPTH_WORLD);
    expect(depthWorldFor(0.01, 600)).toBe(MIN_DEPTH_WORLD);
  });

  it("falls back to the minimum for a non-finite depth", () => {
    expect(depthWorldFor(NaN, 100)).toBe(MIN_DEPTH_WORLD);
  });
});

describe("sideBandThickness", () => {
  it("is the real band, but never more than 40% or less than 15% of the depth", () => {
    expect(sideBandThickness(0.1, 0.0333)).toBeCloseTo(0.0333, 4);
    // shallow depth: the band is huge relative to the depth -> clamped to 40% of depth
    expect(sideBandThickness(0.05, 1)).toBeCloseTo(0.02, 6);
    // very deep letter: the band is a sliver -> clamped to 15% of depth
    expect(sideBandThickness(0.4, 0.001)).toBeCloseTo(0.06, 6);
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
    expect(neonRoundRadius(0.05, 10, 10)).toBeCloseTo(0.025, 6);
  });

  it("is limited by the 0.5 in (12.7 mm) tool, in world units at the sign's size", () => {
    expect(neonRoundRadius(10, 10, mmToWorld(12.7, 100))).toBeCloseTo(0.012, 3);
    expect(neonRoundRadius(10, 10, mmToWorld(12.7, 50))).toBeCloseTo(0.024, 3);
  });

  it("stays below the half-stroke so the front cap never inverts", () => {
    const r = neonRoundRadius(10, 0.3, 30);
    expect(r).toBeGreaterThan(0.2);
    expect(r).toBeLessThan(0.3);
  });
});

describe("litBandThickness", () => {
  it("is the stated share of the depth, else the real 10 mm band", () => {
    expect(litBandThickness(0.4, 100, 0.5)).toBeCloseTo(0.2, 6);
    expect(litBandThickness(0.4, 100)).toBeCloseTo(sideBandThickness(0.4, mmToWorld(10, 100)), 6);
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
    expect(wallGapFor("standoff", 100)).toBeCloseTo(mmToWorld(25.4, 100), 9); // one real 1" spacer
    expect(wallGapFor("standoff", 25)).toBeCloseTo(4 * wallGapFor("standoff", 100), 9); // a bigger share of a small sign
  });
});
