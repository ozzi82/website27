import type { LightConfig } from "../../data/configurations";

/**
 * Finishes and builds for the unlit LP 1 flat cutout letters (owner list, 2026-10-03).
 * Solid = cut from one sheet or block, so thinner; Fabricated = a hollow welded body, so it can be thicker.
 * Which finishes are offered fabricated, and the depth steps of each build, are the owner's call and still to be
 * confirmed: the working assumption is that only the metals (stainless, corten) are fabricated, and wood and
 * acrylic are solid-only.
 */
export type Lp1FinishId =
  | "wood"
  | "mirror-gold"
  | "mirror-rose-gold"
  | "brushed-steel"
  | "corten"
  | "acrylic-clear"
  | "acrylic-clear-painted"
  | "acrylic-colored";

export type Lp1Build = "solid" | "fabricated";

export interface Lp1Finish {
  id: Lp1FinishId;
  label: string;
  /** Short label for the compact picker. */
  short: string;
  builds: Lp1Build[];
  /** Colour of the swatch button (a stand-in for the texture). */
  swatch: string;
  /** The finish takes the visitor's paint colour (the front of clear acrylic, or the whole coloured acrylic). */
  usesPaint: boolean;
}

export const LP1_FINISHES: Lp1Finish[] = [
  { id: "wood", label: "Wood", short: "Wood", builds: ["solid"], swatch: "linear-gradient(90deg,#9c6b3f,#7a4f2a,#a87a4a)", usesPaint: false },
  { id: "mirror-gold", label: "Mirror gold stainless steel", short: "Gold mirror", builds: ["solid", "fabricated"], swatch: "linear-gradient(135deg,#f7e08a,#b8862a,#f3d57a)", usesPaint: false },
  { id: "mirror-rose-gold", label: "Mirror rose gold stainless steel", short: "Rose gold mirror", builds: ["solid", "fabricated"], swatch: "linear-gradient(135deg,#f5cdbf,#c9806c,#efb9a8)", usesPaint: false },
  { id: "brushed-steel", label: "Silver metallic stainless steel", short: "Silver metallic", builds: ["solid", "fabricated"], swatch: "linear-gradient(135deg,#f4f6f8,#9aa0a6,#e8ebee)", usesPaint: false },
  { id: "corten", label: "Corten finish", short: "Corten", builds: ["solid", "fabricated"], swatch: "linear-gradient(135deg,#8a4524,#5e2d16,#a2562c)", usesPaint: false },
  { id: "acrylic-clear", label: "Clear acrylic", short: "Clear acrylic", builds: ["solid"], swatch: "linear-gradient(135deg,#eaf4f8,#bcd3dc,#f6fbfd)", usesPaint: false },
  { id: "acrylic-clear-painted", label: "Clear acrylic, coloured or painted front", short: "Clear + colour front", builds: ["solid"], swatch: "linear-gradient(90deg,#eaf4f8 50%,#b4332a 50%)", usesPaint: true },
  { id: "acrylic-colored", label: "Coloured acrylic", short: "Coloured acrylic", builds: ["solid"], swatch: "linear-gradient(135deg,#d65a4a,#b4332a)", usesPaint: true },
];

export const DEFAULT_LP1_FINISH: Lp1FinishId = "brushed-steel";
export const DEFAULT_LP1_BUILD: Lp1Build = "solid";

/** Depth steps (mm) per build, within the brochure's 1-200 mm range for LP 1. */
export const LP1_DEPTHS: Record<Lp1Build, number[]> = {
  solid: [3, 5, 10, 20],
  fabricated: [20, 50, 100, 200],
};
const DEFAULT_DEPTH: Record<Lp1Build, number> = { solid: 5, fabricated: 50 };

export function getLp1Finish(id: Lp1FinishId | undefined): Lp1Finish {
  return LP1_FINISHES.find((f) => f.id === id) ?? LP1_FINISHES.find((f) => f.id === DEFAULT_LP1_FINISH)!;
}

export function isLp1(config: LightConfig): boolean {
  return config.family === "Flat cutout";
}

export function isLp1FinishId(value: string | null | undefined): value is Lp1FinishId {
  return LP1_FINISHES.some((f) => f.id === value);
}

/** The build a finish can actually have: a fabricated request on a solid-only finish falls back to solid. */
export function buildFor(finish: Lp1FinishId, build: Lp1Build): Lp1Build {
  return getLp1Finish(finish).builds.includes(build) ? build : "solid";
}

export function lp1DepthOptions(build: Lp1Build): number[] {
  return LP1_DEPTHS[build];
}

export function lp1DefaultDepth(build: Lp1Build): number {
  return DEFAULT_DEPTH[build];
}

/** The nearest allowed depth to `mm` for a build (used when the build changes under the visitor). */
export function nearestLp1Depth(build: Lp1Build, mm: number): number {
  return LP1_DEPTHS[build].reduce((best, d) => (Math.abs(d - mm) < Math.abs(best - mm) ? d : best));
}
