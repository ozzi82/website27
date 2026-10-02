import * as THREE from "three";

/** World-unit size of the larger artwork dimension after normalization. */
export const TARGET_SIZE = 2.4;

const CURVE_SEGMENTS = 12;

/**
 * Normalizes parsed artwork shapes into the preview's coordinate space:
 * centered on the origin, uniformly scaled so the larger of width/height is
 * TARGET_SIZE, and flipped from SVG/PDF screen space (Y-down) to three.js
 * (Y-up). Shapes are rebuilt from sampled points (holes included) and the
 * inputs are never mutated. ExtrudeGeometry re-corrects winding order, so the
 * mirroring flip is safe.
 */
export function normalizeShapes(shapes: THREE.Shape[]): THREE.Shape[] {
  if (shapes.length === 0) return [];

  // Shapes that never drew a segment (a lone moveTo) sample to zero points, and
  // `new THREE.Shape([])` throws on points[0]; there is nothing to extrude.
  const sampled = shapes
    .map((shape) => ({
      outline: shape.getPoints(CURVE_SEGMENTS),
      holes: shape.holes.map((hole) => hole.getPoints(CURVE_SEGMENTS)).filter((h) => h.length > 0),
    }))
    .filter(({ outline }) => outline.length > 0);
  if (sampled.length === 0) return [];

  const box = new THREE.Box2();
  for (const { outline, holes } of sampled) {
    for (const p of outline) box.expandByPoint(p);
    for (const hole of holes) for (const p of hole) box.expandByPoint(p);
  }

  const width = box.max.x - box.min.x;
  const height = box.max.y - box.min.y;
  const largest = Math.max(width, height);
  // Zero-size (or non-finite) artwork: keep scale at 1 rather than dividing by 0.
  const scale = Number.isFinite(largest) && largest > 0 ? TARGET_SIZE / largest : 1;
  const cx = (box.min.x + box.max.x) / 2;
  const cy = (box.min.y + box.max.y) / 2;

  const transform = (p: THREE.Vector2) =>
    new THREE.Vector2((p.x - cx) * scale, -(p.y - cy) * scale);

  return sampled.map(({ outline, holes }) => {
    const shape = new THREE.Shape(outline.map(transform));
    shape.holes = holes.map((hole) => new THREE.Path(hole.map(transform)));
    return shape;
  });
}
