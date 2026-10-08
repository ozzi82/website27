import { describe, it, expect } from "vitest";
import { distanceToFill, fitInside, photoWorldSize, pxPerInFromReference, scaleToMaxSide, startPxPerIn } from "../photoMath";
import { acesInverseLut } from "../photoTone";
import { mmToWorld, MM_PER_INCH } from "../realSize";

describe("photoMath", () => {
  it("measures pixels per inch from two points", () => {
    expect(pxPerInFromReference({ x: 0, y: 0 }, { x: 300, y: 400 }, 100)).toBeCloseTo(5, 9);
    expect(pxPerInFromReference({ x: 1, y: 1 }, { x: 1, y: 1 }, 80)).toBeNull();
    expect(pxPerInFromReference({ x: 0, y: 0 }, { x: 10, y: 0 }, 0)).toBeNull();
  });

  it("starts with a sign about a third of the photo wide", () => {
    const ppi = startPxPerIn(2000, 1500, 100, 4); // 100" x 25" sign
    expect((100 * ppi) / 2000).toBeLessThanOrEqual(0.35 + 1e-9);
    expect((25 * ppi) / 1500).toBeLessThanOrEqual(0.3 + 1e-9);
  });

  it("converts a photo to world units so a sign of the entered size spans its real inches", () => {
    const size = photoWorldSize(2000, 1000, 10, 100); // 200" x 100" scene
    const perInch = mmToWorld(MM_PER_INCH, 100);
    expect(size.w).toBeCloseTo(200 * perInch, 9);
    expect(size.h / size.w).toBeCloseTo(0.5, 9);
  });

  it("fits the photo inside a box without distortion", () => {
    const f = fitInside(1000, 500, 2000, 2000);
    expect(f).toEqual({ w: 500, h: 500 });
  });

  it("finds the camera distance that fills the view", () => {
    expect(distanceToFill(2, 90)).toBeCloseTo(1, 9);
  });

  it("limits the longest side only when needed", () => {
    expect(scaleToMaxSide(1000, 500)).toEqual({ w: 1000, h: 500 });
    expect(scaleToMaxSide(4800, 2400)).toEqual({ w: 2400, h: 1200 });
  });
});

describe("acesInverseLut", () => {
  it("is increasing, starts near zero and stays finite", () => {
    const lut = acesInverseLut();
    expect(lut[0]).toBeLessThan(0.001);
    for (let i = 1; i < 256; i++) expect(lut[i]).toBeGreaterThanOrEqual(lut[i - 1]);
    expect(Number.isFinite(lut[255])).toBe(true);
  });
});
