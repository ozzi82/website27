import type { LightConfig } from "../../data/configurations";

export type DayNight = "day" | "night";

/** Everything the user chooses; the configuration itself lives in src/data/configurations.ts. */
export interface ConfiguratorState {
  configId: string;
  /** Selected depth in millimetres; always one of the configuration's depthOptionsMm. */
  depthMm: number;
  /** Hex colour of the painted (opaque) parts. */
  color: string;
  /** Hex colour of the light-emitting parts. */
  glowColor: string;
  dayNight: DayNight;
}

export const DEFAULT_PAINT_COLOR = "#4b5059";
export const DEFAULT_GLOW_COLOR = "#ffffff";

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
  };
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
