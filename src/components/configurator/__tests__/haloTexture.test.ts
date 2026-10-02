import { describe, it, expect } from "vitest";
import { gaussianBlur } from "../haloTexture";

function dot(w: number, h: number): Float32Array {
  const m = new Float32Array(w * h);
  m[Math.floor(h / 2) * w + Math.floor(w / 2)] = 1;
  return m;
}

describe("gaussianBlur", () => {
  it("does not mutate its input", () => {
    const src = dot(41, 41);
    const before = Float32Array.from(src);
    gaussianBlur(src, 41, 41, 3);
    expect(Array.from(src)).toEqual(Array.from(before));
  });

  it("returns a fresh array, not the input", () => {
    const src = dot(41, 41);
    expect(gaussianBlur(src, 41, 41, 3)).not.toBe(src);
  });

  it("a wider sigma spreads further than a tight one from the same mask", () => {
    const src = dot(61, 61);
    const tight = gaussianBlur(src, 61, 61, 1);
    const wide = gaussianBlur(src, 61, 61, 4);
    const centre = 30 * 61 + 30;
    expect(wide[centre]).toBeLessThan(tight[centre]);
    const far = 30 * 61 + 30 + 8;
    expect(wide[far]).toBeGreaterThan(tight[far]);
  });

  it("preserves total mass for an interior mask", () => {
    const src = dot(61, 61);
    const out = gaussianBlur(src, 61, 61, 3);
    expect(out.reduce((s, v) => s + v, 0)).toBeCloseTo(1, 3);
  });
});
