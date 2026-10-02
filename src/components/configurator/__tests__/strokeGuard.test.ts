import { describe, it, expect } from "vitest";
import * as THREE from "three";
import {
  bevelStrength,
  formatNeededHeight,
  lineStackFactor,
  neededLetterHeightMm,
  strokeHeightRatio,
  thinStrokeAdvice,
  THIN_STROKE_RATIO,
  MAX_REASONABLE_HEIGHT_MM,
} from "../strokeGuard";

const rect = (w: number, h: number) =>
  new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(w, 0), new THREE.Vector2(w, h), new THREE.Vector2(0, h)]);

/** A ring of the given outer radius and stroke width (a "hairline" circle logo when the stroke is tiny). */
function ring(outer: number, stroke: number, n = 128) {
  const pts = (r: number) =>
    Array.from({ length: n }, (_, i) => new THREE.Vector2(r * Math.cos((2 * Math.PI * i) / n), r * Math.sin((2 * Math.PI * i) / n)));
  const shape = new THREE.Shape(pts(outer));
  shape.holes = [new THREE.Path(pts(outer - stroke))];
  return shape;
}

describe("strokeHeightRatio", () => {
  it("is large for a thick block", () => {
    // 4 x 2 block: half stroke = area / perimeter = 8 / 12, stroke 1.33, height 2
    expect(strokeHeightRatio([rect(4, 2)])).toBeCloseTo(0.667, 2);
  });

  it("is the stroke width over the artwork height for a ring", () => {
    // outer radius 1 (height 2), stroke 0.3
    expect(strokeHeightRatio([ring(1, 0.3)])).toBeCloseTo(0.15, 2);
  });

  it("is tiny for a hairline ring", () => {
    expect(strokeHeightRatio([ring(1, 0.02)])).toBeCloseTo(0.01, 2);
  });

  it("is null when there is nothing to measure", () => {
    expect(strokeHeightRatio([])).toBeNull();
    expect(strokeHeightRatio([new THREE.Shape()])).toBeNull();
  });
});

describe("lineStackFactor", () => {
  it("is 1 for a single line and grows by 1.5 per extra line", () => {
    expect(lineStackFactor(1)).toBe(1);
    expect(lineStackFactor(2)).toBe(2.5);
    expect(lineStackFactor(3)).toBe(4);
  });

  it("never drops below 1 for zero or odd input", () => {
    expect(lineStackFactor(0)).toBe(1);
    expect(lineStackFactor(-3)).toBe(1);
  });
});

describe("neededLetterHeightMm", () => {
  it("is the minimum stroke divided by the stroke-to-height ratio", () => {
    // the 12 mm minimum on art whose strokes are 4% of its height needs a 300 mm (12 in) letter
    expect(neededLetterHeightMm(12, 0.04)).toBeCloseTo(300, 6);
    expect(neededLetterHeightMm(12, 0.08)).toBeCloseTo(150, 6);
  });

  it("is null for a missing or zero ratio", () => {
    expect(neededLetterHeightMm(12, 0)).toBeNull();
    expect(neededLetterHeightMm(12, null)).toBeNull();
  });
});

describe("formatNeededHeight", () => {
  it("rounds up to a whole inch for ordinary heights, US first", () => {
    expect(formatNeededHeight(150)).toBe("6″ (152 mm)");
    expect(formatNeededHeight(300)).toBe("12″ (305 mm)");
  });

  it("rounds big heights up to 5 inches and caps absurd ones", () => {
    expect(formatNeededHeight(1000)).toBe("40″ (1016 mm)");
    expect(formatNeededHeight(50000)).toBe("more than 10 ft");
  });
});

describe("thinStrokeAdvice", () => {
  const tube = { code: "LP 11-N", profile: "tube" as const, minStrokeMm: 12 };
  const cone = { code: "LP 11-C", profile: "conical" as const, minStrokeMm: 12 };
  const steel = { code: "LP 5", profile: "standard" as const, minStrokeMm: 15 };

  it("warns strongly for faux neon and conical letters when strokes are under 6% of the height", () => {
    expect(THIN_STROKE_RATIO).toBe(0.06);
    const advice = thinStrokeAdvice(tube, 0.03)!;
    expect(advice.severity).toBe("strong");
    expect(advice.message).toMatch(/thin strokes/i);
    expect(advice.message).toContain("0.47″ (12 mm)");
    expect(advice.message).toContain("16″"); // 12 mm / 0.03 = 400 mm = 15.7 in
    expect(thinStrokeAdvice(cone, 0.059)?.severity).toBe("strong");
  });

  it("stays quiet for tubes and cones with sturdy strokes", () => {
    expect(thinStrokeAdvice(tube, 0.06)).toBeNull();
    expect(thinStrokeAdvice(cone, 0.2)).toBeNull();
  });

  it("only gives a subtle note for other configurations, and only when the needed height is unreasonable", () => {
    expect(MAX_REASONABLE_HEIGHT_MM).toBeCloseTo(24 * 25.4, 6);
    // 15 mm / 0.04 = 375 mm (about 15 in): perfectly reasonable, no note
    expect(thinStrokeAdvice(steel, 0.04)).toBeNull();
    // 15 mm / 0.01 = 1500 mm (about 59 in): subtle
    const subtle = thinStrokeAdvice(steel, 0.01)!;
    expect(subtle.severity).toBe("subtle");
    expect(subtle.neededMm).toBeCloseTo(1500, 6);
    expect(subtle.message).toContain("LP 5");
  });

  it("gives no advice when the ratio is unknown", () => {
    expect(thinStrokeAdvice(tube, null)).toBeNull();
  });
});

describe("bevelStrength", () => {
  it("is 0 (straight extrusion) for hairlines, 1 for sturdy strokes, and ramps in between", () => {
    expect(bevelStrength(0.005)).toBe(0);
    expect(bevelStrength(0.3)).toBe(1);
    const mid = bevelStrength(0.05);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
    expect(bevelStrength(0.06)).toBeGreaterThan(bevelStrength(0.04));
  });
});
