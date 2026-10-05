import { defaultMount, type LightConfig, type Mount } from "../../data/configurations";
import { DEFAULT_BACKGROUND, type BackgroundId } from "./backgrounds";
import { DEFAULT_BRIGHTNESS } from "./brightness";
import {
  DEFAULT_LP1_BUILD,
  DEFAULT_LP1_FINISH,
  buildFor,
  isLp1,
  lp1DefaultDepth,
  lp1DepthOptions,
  nearestLp1Depth,
  type Lp1Build,
  type Lp1FinishId,
} from "./lp1Materials";

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
  /** LED dimmer, 0-100 percent (only meaningful for configurations that emit light). */
  brightness: number;
  /** The wall the sign is mounted on. */
  background: BackgroundId;
  /** How the letter is carried; always one of the configuration's `mounts`. */
  mounting: Mount;
  /** The configuration's optional variant (LP 5+3.1: face and halo lit) is switched on. */
  variant: boolean;
  /** LP 1 only: the material of the flat cutout letter. */
  finish: Lp1FinishId;
  /** LP 1 only: solid (thinner) or fabricated (hollow, thicker). */
  build: Lp1Build;
}

/** The depths offered for this configuration and state: LP 1 follows its build, the rest their brochure list. */
export function depthOptionsFor(config: LightConfig, state: Pick<ConfiguratorState, "build">): number[] {
  return isLp1(config) ? lp1DepthOptions(state.build) : config.depthOptionsMm;
}

export const DEFAULT_PAINT_COLOR = "#4b5059";
export const DEFAULT_GLOW_COLOR = "#fff4f0"; // 6000 K daylight white

const PREFERRED_DEPTH_MM: Record<LightConfig["family"], number> = {
  "Flat cutout": 5,
  "Stainless steel": 75,
  "Block acrylic": 30,
};

export function defaultStateFor(config: LightConfig): ConfiguratorState {
  const preferred = isLp1(config) ? lp1DefaultDepth(DEFAULT_LP1_BUILD) : PREFERRED_DEPTH_MM[config.family];
  const options = isLp1(config) ? lp1DepthOptions(DEFAULT_LP1_BUILD) : config.depthOptionsMm;
  const depthMm = options.reduce((best, d) =>
    Math.abs(d - preferred) < Math.abs(best - preferred) ? d : best
  );
  return {
    configId: config.id,
    depthMm,
    color: DEFAULT_PAINT_COLOR,
    glowColor: DEFAULT_GLOW_COLOR,
    dayNight: "day",
    brightness: DEFAULT_BRIGHTNESS,
    background: DEFAULT_BACKGROUND,
    mounting: defaultMount(config),
    variant: false,
    finish: DEFAULT_LP1_FINISH,
    build: DEFAULT_LP1_BUILD,
  };
}

/** Changes the LP 1 finish; a build the new finish cannot have falls back to solid, and the depth to its nearest step. */
export function withFinish(state: ConfiguratorState, finish: Lp1FinishId): ConfiguratorState {
  const build = buildFor(finish, state.build);
  return { ...state, finish, build, depthMm: nearestLp1Depth(build, state.depthMm) };
}

/** Changes the LP 1 build (solid or fabricated) and moves the depth to the nearest step of that build. */
export function withBuild(state: ConfiguratorState, build: Lp1Build): ConfiguratorState {
  const next = buildFor(state.finish, build);
  return { ...state, build: next, depthMm: nearestLp1Depth(next, state.depthMm) };
}

/**
 * Moves to another configuration in place: the visitor's paint and glow colours, brightness, day/night and
 * background carry over (re-picking them would be annoying), and so does the depth when the new configuration
 * offers it; otherwise the depth takes the new configuration's default.
 */
export function switchConfig(prev: ConfiguratorState, next: LightConfig): ConfiguratorState {
  const fresh = defaultStateFor(next);
  return {
    ...fresh,
    depthMm: depthOptionsFor(next, prev).includes(prev.depthMm) ? prev.depthMm : fresh.depthMm,
    mounting: next.mounts.includes(prev.mounting) ? prev.mounting : fresh.mounting,
    variant: false,
    finish: prev.finish,
    build: prev.build,
    color: prev.color,
    glowColor: prev.glowColor,
    brightness: prev.brightness,
    dayNight: prev.dayNight,
    background: prev.background,
  };
}

/** The configuration as chosen: with its variant (LP 5+3.1) applied when that is switched on. */
export function effectiveConfig(config: LightConfig, state: Pick<ConfiguratorState, "variant">): LightConfig {
  if (!state.variant || !config.variant) return config;
  const { variant } = config;
  return { ...config, code: variant.code, light: variant.light, mounts: variant.mounts };
}

/** Switches the variant on or off; its halo needs standoff mounting, and switching it off goes back to the default mounting. */
export function withVariant(config: LightConfig, state: ConfiguratorState, on: boolean): ConfiguratorState {
  if (!config.variant) return state;
  const next = { ...state, variant: on };
  const mounts = on ? config.variant.mounts : config.mounts;
  return mounts.includes(state.mounting) ? next : { ...next, mounting: defaultMount({ mounts }) };
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
