import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { normalizeShapes, TARGET_SIZE } from "../normalizeShapes";

function bboxOf(shapes: THREE.Shape[]): THREE.Box2 {
  const b = new THREE.Box2();
  for (const s of shapes) {
    for (const p of s.getPoints(12)) b.expandByPoint(p);
    for (const h of s.holes) for (const p of h.getPoints(12)) b.expandByPoint(p);
  }
  return b;
}

function rect(x: number, y: number, w: number, h: number): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(x, y);
  s.lineTo(x + w, y);
  s.lineTo(x + w, y + h);
  s.lineTo(x, y + h);
  s.closePath();
  return s;
}

describe("normalizeShapes", () => {
  it("centers the combined bounding box at the origin", () => {
    const out = normalizeShapes([rect(10, 10, 100, 100), rect(170, 10, 100, 100)]);
    const b = bboxOf(out);
    const c = b.getCenter(new THREE.Vector2());
    expect(c.x).toBeCloseTo(0, 5);
    expect(c.y).toBeCloseTo(0, 5);
  });

  it("scales so the larger dimension equals TARGET_SIZE", () => {
    expect(TARGET_SIZE).toBe(2.4);
    const b = bboxOf(normalizeShapes([rect(10, 10, 260, 100)]));
    const size = b.getSize(new THREE.Vector2());
    expect(size.x).toBeCloseTo(TARGET_SIZE, 5);
    expect(size.y).toBeLessThan(TARGET_SIZE);
  });

  it("scales a tall artwork by its height", () => {
    const b = bboxOf(normalizeShapes([rect(0, 0, 50, 200)]));
    const size = b.getSize(new THREE.Vector2());
    expect(size.y).toBeCloseTo(TARGET_SIZE, 5);
  });

  it("preserves aspect ratio", () => {
    const b = bboxOf(normalizeShapes([rect(10, 10, 300, 100)]));
    const size = b.getSize(new THREE.Vector2());
    expect(size.x / size.y).toBeCloseTo(3, 5);
  });

  it("flips Y so SVG y-down becomes three.js y-up", () => {
    // Triangle with apex at SVG y=10 (top of the artwork on screen), base at y=110.
    const tri = new THREE.Shape();
    tri.moveTo(170, 110);
    tri.lineTo(220, 10);
    tri.lineTo(270, 110);
    tri.closePath();
    const out = normalizeShapes([tri]);
    const pts = out[0].getPoints(12);
    const apex = pts.reduce((a, p) => (p.y > a.y ? p : a));
    const maxY = Math.max(...pts.map((p) => p.y));
    expect(apex.y).toBeCloseTo(maxY, 5);
    // apex was the x=220 vertex, which is the horizontal middle of the triangle
    expect(apex.x).toBeCloseTo(0, 5);
    // and the base vertices are at the bottom
    const minY = Math.min(...pts.map((p) => p.y));
    expect(pts.filter((p) => Math.abs(p.y - minY) < 1e-6).length).toBeGreaterThanOrEqual(2);
  });

  it("preserves holes and transforms them with the outer shape", () => {
    const outer = rect(0, 0, 200, 200);
    const hole = new THREE.Path();
    hole.moveTo(50, 50);
    hole.lineTo(150, 50);
    hole.lineTo(150, 150);
    hole.lineTo(50, 150);
    hole.closePath();
    outer.holes.push(hole);

    const out = normalizeShapes([outer]);
    expect(out[0].holes.length).toBe(1);

    const outerBox = new THREE.Box2().setFromPoints(out[0].getPoints(12));
    const holeBox = new THREE.Box2().setFromPoints(out[0].holes[0].getPoints(12));
    // Outer is 2.4 square centered at origin; hole is the middle half (1.2 square).
    expect(outerBox.getSize(new THREE.Vector2()).x).toBeCloseTo(TARGET_SIZE, 5);
    expect(holeBox.getSize(new THREE.Vector2()).x).toBeCloseTo(TARGET_SIZE / 2, 5);
    expect(holeBox.getCenter(new THREE.Vector2()).x).toBeCloseTo(0, 5);
    expect(holeBox.getCenter(new THREE.Vector2()).y).toBeCloseTo(0, 5);
  });

  it("does not mutate the input shapes", () => {
    const input = rect(10, 10, 100, 50);
    const before = input.getPoints(12).map((p) => p.clone());
    const out = normalizeShapes([input]);
    expect(out[0]).not.toBe(input);
    const after = input.getPoints(12);
    expect(after.length).toBe(before.length);
    after.forEach((p, i) => {
      expect(p.x).toBe(before[i].x);
      expect(p.y).toBe(before[i].y);
    });
  });

  it("handles degenerate (zero-size) input without NaN or Infinity", () => {
    const dot = new THREE.Shape();
    dot.moveTo(5, 5);
    dot.lineTo(5, 5);
    dot.lineTo(5, 5);
    const out = normalizeShapes([dot]);
    for (const p of out[0].getPoints(12)) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    }
  });

  it("handles an empty list", () => {
    expect(normalizeShapes([])).toEqual([]);
  });
});
