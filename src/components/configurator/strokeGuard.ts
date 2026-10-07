import * as THREE from "three";
import type { Profile } from "../../data/configurations";
import { estimateHalfStroke } from "./renderMath";
import { formatDepth } from "./types";
import { formatInches } from "./realSize";

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
 * The informative note about thin strokes, or null when none is due. Exact now that the sign has a real size:
 * the artwork's average stroke is its stroke-to-height ratio times its real height, compared with the configuration's own
 * minimum stroke. LP 11-N and 11-C (tube / conical) are called out strongly (they look wrong with thin art); every other
 * configuration gets a quieter note. `lines` is the number of typed lines (1 for an uploaded file): the letters a visitor
 * means by "letter height" are one line of the artwork's total height.
 */
export function thinStrokeAdvice(config: StrokeRules, ratio: number | null, artworkHeightMm: number | null = null, lines = 1): StrokeAdvice | null {
  if (ratio === null || !(ratio > 0) || artworkHeightMm === null || !(artworkHeightMm > 0)) return null;
  const strokeMm = ratio * artworkHeightMm;
  if (strokeMm >= config.minStrokeMm) return null;
  const stack = lineStackFactor(lines);
  const neededMm = config.minStrokeMm / ratio / stack; // the letter height (one line) at which the strokes reach the minimum
  const minStroke = formatDepth(config.minStrokeMm);
  const needed = formatNeededHeight(neededMm);
  const have = formatInches(artworkHeightMm / stack / MM_PER_INCH);
  const profiled = config.profile === "tube" || config.profile === "conical";
  const strokeText = strokeMm < 10 ? `${Math.round(strokeMm * 10) / 10} mm` : `${Math.round(strokeMm)} mm`;
  return {
    severity: profiled ? "strong" : "subtle",
    neededMm,
    message: profiled
      ? `Thin strokes: at about ${have} tall this artwork's strokes are only about ${strokeText}, and ${config.code} needs at least ${minStroke}. Make the letters (or logo) at least about ${needed} tall, or use a bolder typeface or heavier line art.`
      : `Thin strokes: at about ${have} tall this artwork's strokes are about ${strokeText}; ${config.code} needs at least ${minStroke}, which takes letters of about ${needed} or taller.`,
  };
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
