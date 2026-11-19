import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { estimateDiodes, formatLedEstimate } from "../ledEstimate";
import { TARGET_SIZE } from "../normalizeShapes";

/** A rectangle w × h mm as a shape in world units, when the larger side (w) is `sizeIn` inches. */
function rect(wMm: number, hMm: number) {
  const sizeIn = wMm / 25.4;
  const k = TARGET_SIZE / wMm;
  const s = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(wMm * k, 0), new THREE.Vector2(wMm * k, hMm * k), new THREE.Vector2(0, hMm * k)]);
  return { s, sizeIn };
}

describe("LP 11 LED estimate", () => {
  it("counts the 12 mm grid points that keep 5 mm from the edge", () => {
    // 100 × 56 mm on the 12 mm grid (centre to centre; 22 mm until 2026-11-19): the same count as the CRM's 3D view
    const { s, sizeIn } = rect(100, 56);
    expect(estimateDiodes([s], sizeIn)).toBe(21);
  });
  it("leaves out letters too narrow for a diode", () => {
    const { s, sizeIn } = rect(100, 8);
    expect(estimateDiodes([s], sizeIn)).toBe(0);
  });
  it("states the watts at 0.06 W a diode on 24 V", () => {
    expect(formatLedEstimate(100)).toBe("about 100 LEDs, 6.0 W at 24 V");
  });
});

import { thinStrokeAdvice } from "../strokeGuard";
import { configurations } from "../../../data/configurations";

describe("LP 11-S stroke width (owner, 2026-11-16)", () => {
  it("asks for 20 mm strokes so the LEDs do not show as spots", () => {
    const s = configurations.find((c) => c.id === "lp-11-s-side-lit")!;
    expect(s.minStrokeMm).toBe(20);
    expect(s.specs.find((r) => r.label === "Min. stroke width")!.value).toMatch(/20 mm\) recommended, so the LEDs do not show as spots/);
    // Strokes a tenth of a 6" letter (15 mm): too thin, and why
    expect(thinStrokeAdvice(s, 0.1, 152.4)!.message).toMatch(/LP 11-S needs at least 0.79″ \(20 mm\) \(narrower, the LEDs show as spots/);
  });
});
