import * as THREE from "three";
import { worldToMm } from "./realSize";

/** One LP 11 LED diode on a 24 V system (owner, 2026-11-15). The CRM and SunliteDraw use the same figures. */
export const DIODE_WATTS = 0.06;
export const DIODE_VOLTS = 24;
/** Diodes sit on a 12 mm grid (22 mm until 2026-11-19), their centres 5 mm inside the letter's outline (the CRM's layout rule). */
export const DIODE_PITCH_MM = 12;
export const DIODE_EDGE_MM = 5;

type P = { x: number; y: number };

const inRing = (p: P, ring: P[]): boolean => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
};

const nearEdge = (p: P, ring: P[], margin: number): boolean => {
  const m2 = margin * margin;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[j], b = ring[i];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    const t = len2 > 0 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2)) : 0;
    const ex = a.x + t * dx - p.x, ey = a.y + t * dy - p.y;
    if (ex * ex + ey * ey < m2) return true;
  }
  return false;
};

/**
 * How many single LED diodes an LP 11 sign of this artwork and size takes: per letter, the points of a 12 mm grid
 * (centred on the letter) that lie inside it and at least 5 mm from its edges. An estimate; the factory's layout decides.
 */
export function estimateDiodes(shapes: THREE.Shape[], sizeIn: number): number {
  let count = 0;
  for (const shape of shapes) {
    const pts = shape.extractPoints(12);
    const mm = (ring: THREE.Vector2[]): P[] => ring.map((p) => ({ x: worldToMm(p.x, sizeIn), y: worldToMm(p.y, sizeIn) }));
    const outer = mm(pts.shape);
    const holes = pts.holes.map(mm);
    if (outer.length < 3) continue;
    const xs = outer.map((p) => p.x), ys = outer.map((p) => p.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const nx = Math.floor((x1 - x0) / DIODE_PITCH_MM), ny = Math.floor((y1 - y0) / DIODE_PITCH_MM);
    const ox = x0 + (x1 - x0 - nx * DIODE_PITCH_MM) / 2, oy = y0 + (y1 - y0 - ny * DIODE_PITCH_MM) / 2;
    for (let i = 0; i <= nx; i++)
      for (let j = 0; j <= ny; j++) {
        const p = { x: ox + i * DIODE_PITCH_MM, y: oy + j * DIODE_PITCH_MM };
        if (!inRing(p, outer) || holes.some((h) => inRing(p, h))) continue;
        if (nearEdge(p, outer, DIODE_EDGE_MM) || holes.some((h) => nearEdge(p, h, DIODE_EDGE_MM))) continue;
        count++;
      }
  }
  return count;
}

/** "about 120 LEDs, 7.2 W at 24 V" */
export function formatLedEstimate(diodes: number): string {
  return `about ${diodes} LEDs, ${(diodes * DIODE_WATTS).toFixed(1)} W at ${DIODE_VOLTS} V`;
}
