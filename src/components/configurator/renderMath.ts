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

/** Corner radius of the neon-tube approximation: half the depth at most, and small relative to the letter so thin strokes don't invert. */
export function tubeRadius(depthWorld: number, heightWorld: number): number {
  return Math.min(depthWorld / 2, heightWorld * 0.04);
}

/** Distance between the back of the letter and the wall behind it, in world units. */
export function wallGapFor(mount: Mount): number {
  return mount === "standoff" ? 0.12 : 0.012;
}
