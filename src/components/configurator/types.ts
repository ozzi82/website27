import type { LightConfig } from "../../data/configurations";

export type Product = "trimless-letters" | "cast-block-acrylic";

export type DayNight = "day" | "night";

/** Paint/vinyl swatches Sunlite can actually fabricate for Trimless Letters' face/return. */
export const TRIMLESS_SWATCHES = [
  "white",
  "black",
  "red",
  "blue",
  "custom",
] as const;
export type TrimlessSwatch = (typeof TRIMLESS_SWATCHES)[number];

/** Cast Block Acrylic's real color options, per src/data/services.ts. */
export const ACRYLIC_COLORS = ["clear", "opal", "custom"] as const;
export type AcrylicColor = (typeof ACRYLIC_COLORS)[number];

export type IlluminationStyle = "face-lit" | "halo-lit" | "dual-lit";

/** 3 discrete depth presets for Trimless Letters — see the spec's "Trimless depth presets"
 *  section: exact inch values are a placeholder pending confirmation against real fabrication
 *  limits, so this type only encodes the preset names, not specific measurements. */
export type TrimlessDepth = "slim" | "standard" | "max";

export interface TrimlessConfig {
  product: "trimless-letters";
  illumination: IlluminationStyle;
  depth: TrimlessDepth;
  faceColor: TrimlessSwatch;
  returnColor: TrimlessSwatch;
  dayNight: DayNight;
}

export interface CastBlockAcrylicConfig {
  product: "cast-block-acrylic";
  acrylicColor: AcrylicColor;
  dayNight: DayNight;
}

export type ProductConfig = TrimlessConfig | CastBlockAcrylicConfig;

export function defaultConfigFor(product: Product): ProductConfig {
  if (product === "trimless-letters") {
    return {
      product: "trimless-letters",
      illumination: "face-lit",
      depth: "standard",
      faceColor: "white",
      returnColor: "black",
      dayNight: "day",
    };
  }
  return {
    product: "cast-block-acrylic",
    acrylicColor: "clear",
    dayNight: "day",
  };
}

// ---------------------------------------------------------------------------
// Revision 2 model: one state shape for all 12 EdgeLuxe configurations (the
// configuration itself lives in src/data/configurations.ts).

export interface ConfiguratorState {
  configId: string;
  /** Selected depth in millimetres; always one of the configuration's depthOptionsMm. */
  depthMm: number;
  /** Hex colour of the painted (opaque) parts. */
  color: string;
  /** Hex colour of the light-emitting parts. */
  glowColor: string;
  dayNight: DayNight;
  /** Real-world letter height in inches. */
  letterHeightIn: number;
}

export const DEFAULT_PAINT_COLOR = "#3a3d44";
export const DEFAULT_GLOW_COLOR = "#ffffff";
export const DEFAULT_LETTER_HEIGHT_IN = 12;
export const MIN_LETTER_HEIGHT_IN = 0.4;
export const MAX_LETTER_HEIGHT_IN = 240;

const PREFERRED_DEPTH_MM: Record<LightConfig["family"], number> = {
  "Flat cutout": 5,
  "Stainless steel": 50,
  "Block acrylic": 30,
};

export function defaultStateFor(config: LightConfig): ConfiguratorState {
  const preferred = PREFERRED_DEPTH_MM[config.family];
  const depthMm = config.depthOptionsMm.reduce((best, d) =>
    Math.abs(d - preferred) < Math.abs(best - preferred) ? d : best
  );
  return {
    configId: config.id,
    depthMm,
    color: DEFAULT_PAINT_COLOR,
    glowColor: DEFAULT_GLOW_COLOR,
    dayNight: "day",
    letterHeightIn: DEFAULT_LETTER_HEIGHT_IN,
  };
}

/** True when the entered letter height is under the configuration's minimum. A warning only, never a block. */
export function isBelowMinHeight(state: ConfiguratorState, config: LightConfig): boolean {
  return state.letterHeightIn * 25.4 < config.minHeightMm;
}

/** True when any part of the letter emits light (everything but the flat cutout). */
export function emitsLight(config: LightConfig): boolean {
  const { face, halo, side } = config.light;
  return face !== "none" || halo !== "none" || side !== "none";
}

// The brochure rounds some conversions up (15 mm is "0.5", 100 mm is "4"), so
// mirror its wording for the standard sizes and compute everything else.
const BROCHURE_INCHES: Record<number, string> = { 15: "0.5", 25: "1", 30: "1.2", 50: "2", 75: "3", 100: "4" };

/** US-first length for depths, heights and stroke widths: `1.2″ (30 mm)`. */
export function formatDepth(mm: number): string {
  const inches = mm / 25.4;
  const text =
    BROCHURE_INCHES[mm] ?? String(Number(inches.toFixed(inches < 0.1 ? 3 : inches < 10 ? 2 : 1)));
  return `${text}″ (${mm} mm)`;
}
