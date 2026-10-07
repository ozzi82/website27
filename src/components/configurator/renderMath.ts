import type { Mount } from "../../data/configurations";
import { DEFAULT_SIZE_IN, mmToWorld } from "./realSize";

/** Smallest depth drawn, in world units, so a very thin sign on a very large size still has a visible edge. */
export const MIN_DEPTH_WORLD = 0.0015;
/** Deepest drawing, in world units: a deep letter on a tiny sign must still fit the picture. */
export const MAX_DEPTH_WORLD = 2.4;

/** The letter's depth in world units at this size: the real millimetres, converted (see realSize.ts). */
export function depthWorldFor(depthMm: number, sizeIn: number): number {
  const world = mmToWorld(depthMm, sizeIn);
  if (Number.isNaN(world)) return MIN_DEPTH_WORLD;
  return Math.min(MAX_DEPTH_WORLD, Math.max(MIN_DEPTH_WORLD, world));
}

/** Exposed acrylic band on partially side-lit letters (the brochure's standard is 10 mm). */
export const BAND_MM = 10;

/**
 * World-unit thickness of the glowing band on a partial side-lit wall: the real 10 mm exposed acrylic, kept between
 * 15% and 40% of the depth so it reads as a band (not a hairline, not the whole wall).
 */
export function sideBandThickness(depthWorld: number, bandWorld: number): number {
  return Math.min(depthWorld * 0.4, Math.max(depthWorld * 0.15, bandWorld));
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
 * Radius of LP 11-N's rounded FRONT edge in world units: at most 0.5" (`toolWorld`, the tool's reach at this size), never
 * more than half the thickness, and under the half-stroke so the front cap survives thin strokes.
 */
export function neonRoundRadius(depthWorld: number, halfStroke: number, toolWorld: number): number {
  return Math.max(0, Math.min(toolWorld, depthWorld / 2, halfStroke * 0.85));
}

/** World-unit thickness of the lit side band: `fraction` of the depth when the configuration says so, else the real 10 mm band. */
export function litBandThickness(depthWorld: number, sizeIn: number, fraction?: number): number {
  return fraction === undefined ? sideBandThickness(depthWorld, mmToWorld(BAND_MM, sizeIn)) : depthWorld * Math.min(1, Math.max(0, fraction));
}

/** How much narrower the front face of a conical letter is than its base, per side. */
export function conicalInset(heightWorld: number, halfStroke: number): number {
  return Math.min(heightWorld * 0.035, halfStroke * 0.5);
}

/** The standoff spacer length: 1" (see spacers.ts). */
const STANDOFF_MM = 25.4;

/**
 * Distance between the back of the letter and the wall behind it, in world units: flush sits (almost) against the wall,
 * standoff is one real spacer length (1") off it, at this size.
 */
export function wallGapFor(mount: Mount, sizeIn = DEFAULT_SIZE_IN): number {
  return mount === "standoff" ? mmToWorld(STANDOFF_MM, sizeIn) : 0.012;
}
