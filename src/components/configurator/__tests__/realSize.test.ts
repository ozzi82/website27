import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  DEFAULT_SIZE_IN,
  MAX_SIZE_IN,
  MIN_SIZE_IN,
  aspectOf,
  clampSizeIn,
  dimensionsIn,
  formatSize,
  mmPerUnit,
  mmToWorld,
  sizeFromHeightIn,
  sizeFromWidthIn,
  worldToMm,
} from "../realSize";

const rect = (w: number, h: number) => {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(w, 0);
  s.lineTo(w, h);
  s.lineTo(0, h);
  s.closePath();
  return s;
};

describe("true-scale conversion", () => {
  it("a default 100 inch sign is 2.4 world units, so one unit is about 1058 mm", () => {
    expect(DEFAULT_SIZE_IN).toBe(100);
    expect(mmPerUnit(100)).toBeCloseTo(1058.33, 1);
    expect(mmToWorld(1058.33, 100)).toBeCloseTo(1, 3);
  });

  it("the same millimetres are more world units on a smaller sign", () => {
    expect(mmToWorld(25.4, 12)).toBeCloseTo(mmToWorld(25.4, 100) * (100 / 12), 9);
    expect(worldToMm(mmToWorld(30, 48), 48)).toBeCloseTo(30, 9);
  });

  it("clamps typed sizes and falls back to the default for nonsense", () => {
    expect(clampSizeIn(2)).toBe(MIN_SIZE_IN);
    expect(clampSizeIn(5000)).toBe(MAX_SIZE_IN);
    expect(clampSizeIn(NaN)).toBe(DEFAULT_SIZE_IN);
    expect(clampSizeIn(48)).toBe(48);
  });
});

describe("width and height", () => {
  it("a wide artwork's larger side is its width; a tall one's is its height", () => {
    expect(dimensionsIn(100, 4)).toEqual({ width: 100, height: 25 });
    expect(dimensionsIn(100, 0.5)).toEqual({ width: 50, height: 100 });
  });

  it("typing the width or the height finds the larger side back", () => {
    expect(sizeFromWidthIn(80, 4)).toBe(80);
    expect(sizeFromWidthIn(50, 0.5)).toBe(100);
    expect(sizeFromHeightIn(20, 4)).toBe(80);
    expect(sizeFromHeightIn(100, 0.5)).toBe(100);
  });

  it("measures the aspect of the shapes", () => {
    expect(aspectOf([rect(4, 1)])).toBeCloseTo(4, 6);
    expect(aspectOf([])).toBe(1);
  });

  it("describes a size in inches and millimetres", () => {
    expect(formatSize(100, 4)).toBe("100″ × 25″ (2540 × 635 mm)");
    expect(formatSize(12, 2)).toBe("12″ × 6″ (305 × 152 mm)");
  });
});
