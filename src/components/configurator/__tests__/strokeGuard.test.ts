import { describe, it, expect } from "vitest";
import * as THREE from "three";
import {
  bevelStrength,
  formatNeededHeight,
  lineStackFactor,
  neededLetterHeightMm,
  strokeHeightRatio,
  thinStrokeAdvice,
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

  it("is exact now: it compares the real stroke (ratio x real height) with the configuration's minimum", () => {
    // strokes 3% of a 305 mm (12 in) tall artwork = 9.15 mm, under the 12 mm minimum
    const advice = thinStrokeAdvice(tube, 0.03, 305)!;
    expect(advice.severity).toBe("strong");
    expect(advice.message).toMatch(/thin strokes/i);
    expect(advice.message).toContain("0.47″ (12 mm)");
    expect(advice.message).toContain("16″"); // 12 mm / 0.03 = 400 mm = 15.7 in tall letters needed
    expect(advice.message).toContain("12″"); // and the artwork is 12 in tall now
    expect(thinStrokeAdvice(cone, 0.03, 305)?.severity).toBe("strong");
  });

  it("goes away when the sign is made bigger: the same artwork at twice the height has strokes twice as thick", () => {
    expect(thinStrokeAdvice(tube, 0.03, 305)).not.toBeNull(); // 9 mm
    expect(thinStrokeAdvice(tube, 0.03, 610)).toBeNull(); // 18 mm
  });

  it("is quiet when the strokes are thick enough for the configuration", () => {
    expect(thinStrokeAdvice(tube, 0.06, 305)).toBeNull(); // 18 mm
    expect(thinStrokeAdvice(cone, 0.2, 100)).toBeNull(); // 20 mm
  });

  it("gives other configurations a subtle note, in the same exact way", () => {
    // 1% strokes on a 600 mm tall artwork = 6 mm, under LP 5's 15 mm
    const subtle = thinStrokeAdvice(steel, 0.01, 600)!;
    expect(subtle.severity).toBe("subtle");
    expect(subtle.neededMm).toBeCloseTo(1500, 6); // 15 mm / 0.01
    expect(subtle.message).toContain("LP 5");
    expect(thinStrokeAdvice(steel, 0.04, 600)).toBeNull(); // 24 mm
  });

  it("measures typed text against one line: strokes stay the artwork's, but the letter height is one line of it", () => {
    // two lines, artwork 610 mm tall: one line about 244 mm (stack factor 2.5); ratio 0.03 -> 18 mm strokes: fine
    expect(thinStrokeAdvice(tube, 0.03, 610, 2)).toBeNull();
    const thin = thinStrokeAdvice(tube, 0.01, 610, 2)!; // 6 mm strokes
    expect(thin.neededMm).toBeCloseTo(12 / 0.01 / 2.5, 6);
  });

  it("gives no advice when the ratio or the size is unknown", () => {
    expect(thinStrokeAdvice(tube, null, 305)).toBeNull();
    expect(thinStrokeAdvice(tube, 0.03, null)).toBeNull();
    expect(thinStrokeAdvice(tube, 0.03)).toBeNull();
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
