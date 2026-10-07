import * as THREE from "three";
import { mmToWorld } from "./realSize";

/** The standoff spacers Sunlite uses: clear plastic tubes, 1" long and 0.4" in diameter (owner, 2026-10-05). */
export const SPACER_LENGTH_MM = 25.4;
export const SPACER_DIAMETER_MM = 10.16;

const CURVE_SEGMENTS = 12;

export interface SpacerPoint {
  x: number;
  y: number;
}

/**
 * Where the spacers go: inside the thick parts of the letters, never closer to an edge than the tube's own radius, and
 * spread out. Takes the centre of each triangle of the letter's triangulation (they always lie inside the letter), keeps
 * those whose inscribed circle can hold a tube, and picks the biggest ones that are not too close to each other.
 */
export function spacerPoints(shapes: THREE.Shape[], heightWorld: number, sizeIn: number, max = 6): SpacerPoint[] {
  const radius = mmToWorld(SPACER_DIAMETER_MM, sizeIn) / 2;
  const candidates: { x: number; y: number; area: number }[] = [];
  for (const shape of shapes) {
    const { shape: outline, holes } = shape.extractPoints(CURVE_SEGMENTS);
    const pts = [...outline, ...holes.flat()];
    for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(outline, holes)) {
      const A = pts[a], B = pts[b], C = pts[c];
      const area = Math.abs((B.x - A.x) * (C.y - A.y) - (C.x - A.x) * (B.y - A.y)) / 2;
      const perimeter = A.distanceTo(B) + B.distanceTo(C) + C.distanceTo(A);
      const inradius = perimeter > 0 ? (2 * area) / perimeter : 0;
      if (inradius >= radius * 1.1) candidates.push({ x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3, area });
    }
  }
  candidates.sort((p, q) => q.area - p.area);
  const separation = Math.max(heightWorld * 0.3, radius * 6);
  const chosen: SpacerPoint[] = [];
  for (const cand of candidates) {
    if (chosen.length >= max) break;
    if (chosen.every((p) => Math.hypot(p.x - cand.x, p.y - cand.y) >= separation)) chosen.push({ x: cand.x, y: cand.y });
  }
  return chosen;
}
