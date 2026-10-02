import type { Mount } from "../../data/configurations";

export const MM_PER_INCH = 25.4;
export const MIN_DEPTH_RATIO = 0.01;
export const MAX_DEPTH_RATIO = 0.6;

/** Share of the letter height that the extrusion depth takes, so 1.2" deep looks very different on a 2" letter than on a 24" one. Clamped so extreme combinations stay renderable. */
export function depthRatioFor(depthMm: number, letterHeightIn: number): number {
  const ratio = depthMm / (letterHeightIn * MM_PER_INCH);
  if (Number.isNaN(ratio)) return MIN_DEPTH_RATIO;
  return Math.min(MAX_DEPTH_RATIO, Math.max(MIN_DEPTH_RATIO, ratio));
}

/** Nominal exposed acrylic band on partially side-lit letters (the brochure's standard is 10 mm). */
const BAND_MM = 10;

/**
 * World-unit thickness of the glowing band on a partial side-lit wall: the
 * 10 mm exposed acrylic scaled to the letter, kept between 15% and 40% of the
 * depth so it reads as a band (not a hairline, not the whole wall).
 */
export function sideBandThickness(depthWorld: number, heightWorld: number, letterHeightIn: number): number {
  const raw = (BAND_MM / (letterHeightIn * MM_PER_INCH)) * heightWorld;
  return Math.min(depthWorld * 0.4, Math.max(depthWorld * 0.15, raw));
}

interface Rings {
  outline: { x: number; y: number }[];
  holes: { x: number; y: number }[][];
}

function ringArea(ring: { x: number; y: number }[]): number {
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

function ringPerimeter(ring: { x: number; y: number }[]): number {
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    sum += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return sum;
}

/**
 * Rough half stroke width of the artwork: for a stroke of width w and length L the
 * area is w*L and the perimeter about 2L, so half the width is area / perimeter.
 * Exact for uniform strokes, a middling estimate for mixed ones. Used to keep the
 * tube and cone offsets from folding the outline over itself.
 */
export function estimateHalfStroke(shapes: Rings[]): number {
  let area = 0;
  let perimeter = 0;
  for (const { outline, holes } of shapes) {
    area += ringArea(outline) - holes.reduce((sum, h) => sum + ringArea(h), 0);
    perimeter += ringPerimeter(outline) + holes.reduce((sum, h) => sum + ringPerimeter(h), 0);
  }
  return perimeter > 0 && area > 0 ? area / perimeter : 0;
}

/** Corner radius of the neon-tube approximation: at most half the depth (a round tube is as thick as it is deep) and under the half-stroke so the front cap survives. */
export function tubeRadius(depthWorld: number, halfStroke: number): number {
  return Math.min(depthWorld / 2, halfStroke * 0.85);
}

/** How much narrower the front face of a conical letter is than its base, per side. */
export function conicalInset(heightWorld: number, halfStroke: number): number {
  return Math.min(heightWorld * 0.02, halfStroke * 0.5);
}

/** Distance between the back of the letter and the wall behind it, in world units. */
export function wallGapFor(mount: Mount): number {
  return mount === "standoff" ? 0.12 : 0.012;
}
