import * as THREE from "three";
import type { Profile } from "../../data/configurations";
import { estimateHalfStroke } from "./renderMath";
import { formatDepth } from "./types";

const CURVE_SEGMENTS = 12;
const MM_PER_INCH = 25.4;

/**
 * Stroke width of the artwork as a share of its overall height, from the area / perimeter
 * half-stroke estimate. This is the average stroke (a mixed-weight face has thinner parts), and
 * it is scale free, so it can be turned into a real-world size once a minimum stroke is known:
 * a 0.47 in minimum stroke on art whose strokes are 4% of its height needs a 12 in tall letter.
 */
export function strokeHeightRatio(shapes: THREE.Shape[]): number | null {
  const box = new THREE.Box2();
  const rings = shapes.map((shape) => {
    const { shape: outline, holes } = shape.extractPoints(CURVE_SEGMENTS);
    for (const p of outline) box.expandByPoint(p);
    for (const hole of holes) for (const p of hole) box.expandByPoint(p);
    return { outline, holes };
  });
  if (box.isEmpty()) return null;
  const height = box.max.y - box.min.y;
  const half = estimateHalfStroke(rings);
  if (!(height > 0) || !(half > 0)) return null;
  return (2 * half) / height;
}

/**
 * Typed text is measured as a stack: n lines are about 1 + 1.5 (n - 1) times as tall as one line's ink
 * (1.2 em line pitch over roughly 0.8 em of ink), so the stroke-to-height ratio of the whole artwork
 * is multiplied by this to get the ratio against a single line's letters, which is what a visitor means by "letter height".
 */
export function lineStackFactor(lines: number): number {
  return 1 + 1.5 * Math.max(0, Math.floor(lines) - 1);
}

/** Smallest letter height (mm) at which this artwork's strokes reach `minStrokeMm`. */
export function neededLetterHeightMm(minStrokeMm: number, ratio: number | null): number | null {
  if (ratio === null || !(ratio > 0)) return null;
  return minStrokeMm / ratio;
}

/** Below this stroke/height ratio the tube and cone profiles cannot meet their 12 mm minimum on a sensible letter. */
export const THIN_STROKE_RATIO = 0.06;

/** A generic note is only worth showing when the letter would have to be taller than 24 in. */
export const MAX_REASONABLE_HEIGHT_MM = 24 * MM_PER_INCH;

/** "16″ (406 mm)": rounded up to a whole inch (5 in steps once past 30 in), so the figure is never optimistic. */
export function formatNeededHeight(mm: number): string {
  const inches = mm / MM_PER_INCH;
  if (inches > 120) return "more than 10 ft";
  const rounded = inches < 30 ? Math.ceil(inches) : Math.ceil(inches / 5) * 5;
  return `${rounded}″ (${Math.round(rounded * MM_PER_INCH)} mm)`;
}

export interface StrokeAdvice {
  /** `strong`: faux neon / conical, which look wrong with thin art. `subtle`: a heads-up for any other configuration. */
  severity: "strong" | "subtle";
  neededMm: number;
  message: string;
}

interface StrokeRules {
  code: string;
  profile: Profile;
  minStrokeMm: number;
}

/**
 * The informative note about thin strokes, or null when none is due.
 * LP 11-N and 11-C (tube / conical) are called out whenever the strokes are under 6% of the height:
 * they need 12 mm strokes, which on a 12 in letter is 4% and on a 6 in letter 8%. Every other
 * configuration only gets a quiet note when its own minimum stroke would force a letter over 24 in.
 */
export function thinStrokeAdvice(config: StrokeRules, ratio: number | null): StrokeAdvice | null {
  const neededMm = neededLetterHeightMm(config.minStrokeMm, ratio);
  if (neededMm === null || ratio === null) return null;
  const minStroke = formatDepth(config.minStrokeMm);
  const needed = formatNeededHeight(neededMm);
  const profiled = config.profile === "tube" || config.profile === "conical";
  if (profiled && ratio < THIN_STROKE_RATIO) {
    return {
      severity: "strong",
      neededMm,
      message: `This artwork has thin strokes. ${config.code} needs strokes of at least ${minStroke}, so the letters (or logo) would need to be at least about ${needed} tall. A bolder typeface or heavier line art works best.`,
    };
  }
  if (!profiled && neededMm > MAX_REASONABLE_HEIGHT_MM) {
    return {
      severity: "subtle",
      neededMm,
      message: `Thin strokes: to keep the ${minStroke} minimum stroke of ${config.code}, this artwork would need to be at least about ${needed} tall.`,
    };
  }
  return null;
}

const smoothstep = (lo: number, hi: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - lo) / (hi - lo)));
  return t * t * (3 - 2 * t);
};

/**
 * 0 to 1: how much of the tube / cone rounding the artwork's strokes can carry. Hairlines get
 * a plain straight extrusion (0) instead of a broken-looking tube; sturdy strokes keep the full
 * effect (1); in between it ramps smoothly so nothing pops as the artwork changes.
 */
export function bevelStrength(ratio: number): number {
  return smoothstep(0.02, 0.08, ratio);
}
