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
  it("counts the 22 mm grid points that keep 5 mm from the edge", () => {
    // 100 × 56 mm: 5 columns (centred, 6 mm from the sides) × 3 rows (6 mm from top and bottom)
    const { s, sizeIn } = rect(100, 56);
    expect(estimateDiodes([s], sizeIn)).toBe(15);
  });
  it("leaves out letters too narrow for a diode", () => {
    const { s, sizeIn } = rect(100, 8);
    expect(estimateDiodes([s], sizeIn)).toBe(0);
  });
  it("states the watts at 0.06 W a diode on 24 V", () => {
    expect(formatLedEstimate(100)).toBe("about 100 LEDs, 6.0 W at 24 V");
  });
});
