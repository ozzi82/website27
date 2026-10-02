import * as THREE from "three";
import type { Font } from "opentype.js";
import { textToShapes } from "../../textToShapes";

type Pt = [number, number];

/** The glyph's contours as polygons, in font units (curves flattened). */
function contours(font: Font, ch: string): Pt[][] {
  const out: Pt[][] = [];
  let cur: Pt[] = [];
  let last: Pt = [0, 0];
  const N = 16;
  for (const c of font.charToGlyph(ch).getPath(0, 0, font.unitsPerEm).commands) {
    if (c.type === "M") {
      if (cur.length) out.push(cur);
      cur = [[c.x, c.y]];
      last = [c.x, c.y];
    } else if (c.type === "L") {
      cur.push([c.x, c.y]);
      last = [c.x, c.y];
    } else if (c.type === "Q") {
      for (let i = 1; i <= N; i++) {
        const t = i / N, u = 1 - t;
        cur.push([u * u * last[0] + 2 * u * t * c.x1 + t * t * c.x, u * u * last[1] + 2 * u * t * c.y1 + t * t * c.y]);
      }
      last = [c.x, c.y];
    } else if (c.type === "C") {
      for (let i = 1; i <= N; i++) {
        const t = i / N, u = 1 - t;
        cur.push([
          u ** 3 * last[0] + 3 * u * u * t * c.x1 + 3 * u * t * t * c.x2 + t ** 3 * c.x,
          u ** 3 * last[1] + 3 * u * u * t * c.y1 + 3 * u * t * t * c.y2 + t ** 3 * c.y,
        ]);
      }
      last = [c.x, c.y];
    }
  }
  if (cur.length) out.push(cur);
  return out;
}

function winding(poly: Pt[], x: number, y: number): number {
  let w = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    if (y1 <= y) {
      if (y2 > y && (x2 - x1) * (y - y1) - (x - x1) * (y2 - y1) > 0) w++;
    } else if (y2 <= y && (x2 - x1) * (y - y1) - (x - x1) * (y2 - y1) < 0) w--;
  }
  return w;
}

function triangles(shape: THREE.Shape): [Pt, Pt, Pt][] {
  // Same winding fix-up ExtrudeGeometry applies before it triangulates the cap faces.
  let outline = shape.getPoints(16);
  if (!THREE.ShapeUtils.isClockWise(outline)) outline = outline.reverse();
  const holes = shape.holes.map((h) => {
    const pts = h.getPoints(16);
    return THREE.ShapeUtils.isClockWise(pts) ? pts.reverse() : pts;
  });
  // triangulateShape drops the duplicated closing points in place, so build the vertex list after it.
  const faces = THREE.ShapeUtils.triangulateShape(outline, holes);
  const verts = [...outline, ...holes.flat()];
  return faces.map(([a, b, c]) => [
    [verts[a].x, verts[a].y],
    [verts[b].x, verts[b].y],
    [verts[c].x, verts[c].y],
  ]);
}

function inTriangle([a, b, c]: [Pt, Pt, Pt], x: number, y: number): boolean {
  const d1 = (x - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (y - b[1]);
  const d2 = (x - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (y - c[1]);
  const d3 = (x - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (y - a[1]);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

/**
 * Fraction of sample points where the sign shapes (outline minus holes, unioned) disagree with the font's own
 * non-zero fill of the glyph. Filled-in counters, lost overlaps or mis-triangulated contours push it up.
 */
export function fillMismatch(font: Font, ch: string, grid = 36): number {
  const cs = contours(font, ch);
  if (cs.length === 0) return 0;
  const shapes = textToShapes(ch, font);
  const truth = new THREE.Box2();
  for (const c of cs) for (const [x, y] of c) truth.expandByPoint(new THREE.Vector2(x, y));
  const ours = new THREE.Box2();
  const tris = shapes.flatMap(triangles);
  for (const t of tris) for (const [x, y] of t) ours.expandByPoint(new THREE.Vector2(x, y));

  let bad = 0;
  for (let i = 0; i < grid; i++) {
    for (let j = 0; j < grid; j++) {
      const u = (i + 0.5) / grid, v = (j + 0.5) / grid;
      const tx = truth.min.x + u * (truth.max.x - truth.min.x);
      const ty = truth.min.y + v * (truth.max.y - truth.min.y);
      const t = cs.reduce((w, c) => w + winding(c, tx, ty), 0) !== 0;
      // our shapes are Y-flipped and normalised: same box, same relative position (y flipped)
      const ox = ours.min.x + u * (ours.max.x - ours.min.x);
      const oy = ours.max.y - v * (ours.max.y - ours.min.y);
      const o = tris.some((t) => inTriangle(t, ox, oy));
      if (t !== o) bad++;
    }
  }
  return bad / (grid * grid);
}
