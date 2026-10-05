import type { Mount } from "../../data/configurations";

export const MM_PER_INCH = 25.4;
export const MIN_DEPTH_RATIO = 0.01;
export const MAX_DEPTH_RATIO = 0.6;

/**
 * The preview has no letter-height input (it made deeper-looking letters thinner), so depth is
 * drawn against one fixed, illustrative letter height: about 12 inches.
 */
export const NOMINAL_LETTER_HEIGHT_MM = 300;

/** Share of the (nominal) letter height that the extrusion depth takes. Clamped so extreme depths stay renderable. */
export function depthRatioFor(depthMm: number): number {
  const ratio = depthMm / NOMINAL_LETTER_HEIGHT_MM;
  if (Number.isNaN(ratio)) return MIN_DEPTH_RATIO;
  return Math.min(MAX_DEPTH_RATIO, Math.max(MIN_DEPTH_RATIO, ratio));
}

/** Nominal exposed acrylic band on partially side-lit letters (the brochure's standard is 10 mm). */
const BAND_MM = 10;

/**
 * World-unit thickness of the glowing band on a partial side-lit wall: the
 * 10 mm exposed acrylic scaled to the nominal letter, kept between 15% and 40% of the
 * depth so it reads as a band (not a hairline, not the whole wall).
 */
export function sideBandThickness(depthWorld: number, heightWorld: number): number {
  const raw = (BAND_MM / NOMINAL_LETTER_HEIGHT_MM) * heightWorld;
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

/** The LP 11-N routing tool rounds the front edge by at most 0.5" (owner fact, 2026-10-03). */
export const NEON_MAX_ROUND_MM = 12.7;

/**
 * Radius of LP 11-N's rounded FRONT edge in world units: at most 0.5" (scaled to the nominal letter), never more
 * than half the thickness, and under the half-stroke so the front cap survives thin strokes.
 */
export function neonRoundRadius(depthWorld: number, heightWorld: number, halfStroke: number): number {
  const byTool = (NEON_MAX_ROUND_MM / NOMINAL_LETTER_HEIGHT_MM) * heightWorld;
  return Math.max(0, Math.min(byTool, depthWorld / 2, halfStroke * 0.85));
}

/** World-unit thickness of the lit side band: `fraction` of the depth when the configuration says so, else the nominal brochure band. */
export function litBandThickness(depthWorld: number, heightWorld: number, fraction?: number): number {
  return fraction === undefined ? sideBandThickness(depthWorld, heightWorld) : depthWorld * Math.min(1, Math.max(0, fraction));
}

/** How much narrower the front face of a conical letter is than its base, per side. */
export function conicalInset(heightWorld: number, halfStroke: number): number {
  return Math.min(heightWorld * 0.035, halfStroke * 0.5);
}

/** The stand-off spacer length: 1" (see spacers.ts). */
const STANDOFF_MM = 25.4;

/**
 * Distance between the back of the letter and the wall behind it, in world units: flush sits against the wall, stand-off
 * is one spacer length (1") off it. `heightWorld` is the artwork height, standing for the nominal 12" letter.
 */
export function wallGapFor(mount: Mount, heightWorld = 2.4): number {
  return mount === "standoff" ? (STANDOFF_MM / NOMINAL_LETTER_HEIGHT_MM) * heightWorld : 0.012;
}
