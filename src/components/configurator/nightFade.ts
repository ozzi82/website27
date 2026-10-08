/** Seconds a day <-> night change takes. */
export const FADE_SECONDS = 0.9;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Moves `progress` toward `target` (0 = day, 1 = night) at a constant rate so a full
 * change takes `duration` seconds, never overshooting. Reversing mid-fade simply
 * continues from wherever it is.
 */
export function stepProgress(progress: number, target: number, dt: number, duration = FADE_SECONDS): number {
  if (!(dt > 0)) return progress;
  const step = dt / duration;
  return progress < target ? Math.min(target, progress + step) : Math.max(target, progress - step);
}

/** Smoothstep, so the fade eases in and out instead of starting abruptly. */
export function easeInOut(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

export interface Atmosphere {
  ambient: number;
  directional: number;
  /** The warm key point light of the daytime look. */
  point: number;
  /** Environment-map (reflection) intensity. */
  environment: number;
}

const DAY: Atmosphere = { ambient: 0.05, directional: 0.4, point: 9, environment: 0.3 };
// At night the room goes dark so the lit parts carry the picture...
const NIGHT_DARK: Atmosphere = { ambient: 0.15, directional: 0.6, point: 0, environment: 0.05 };
// ...except an unlit letter (LP 1), which keeps a dim key light and stays readable.
const NIGHT_DIM: Atmosphere = { ambient: 0.06, directional: 0.25, point: 6, environment: 0.08 };

/** Light levels at night amount `n` (0 = day, 1 = night). `dark`: the letter emits light, so the room goes dark. */
export function atmosphereFor(n: number, dark: boolean): Atmosphere {
  const night = dark ? NIGHT_DARK : NIGHT_DIM;
  return {
    ambient: lerp(DAY.ambient, night.ambient, n),
    directional: lerp(DAY.directional, night.directional, n),
    point: lerp(DAY.point, night.point, n),
    environment: lerp(DAY.environment, night.environment, n),
  };
}

const NIGHT_BLOOM = 0.35;
export const NIGHT_BLOOM_DEFAULT = NIGHT_BLOOM;
/** Letters whose face is the light (LP 5, LP 11-F, ...) glow into the air around them, like an illuminated sign photographed at night. */
/** Face lit and halo on the wall (LP 11-FB): less bloom, or the two glows smear into one blur. */
export const FACE_HALO_BLOOM = 0.6;
export const FACE_BLOOM = 1.2;

/**
 * Bloom stays mounted and only its strength follows the fade; an unlit letter never blooms.
 * `level` is the dimmer (0-1): at 0 there is no bloom at all, so a switched-off sign shows no halo artefacts.
 */
export function bloomIntensityFor(n: number, lit: boolean, level = 1, strength = NIGHT_BLOOM): number {
  return lit ? strength * n * level : 0;
}
