import type { LightBehavior, Profile, SideLight } from "../../data/configurations";

/** Which parts of a letter emit light in the 3D scene (the pure rule behind ConfigScene's material choices). */
export interface GlowParts {
  /** The front face glows (material-0). */
  face: boolean;
  /** How the side wall glows: none, a band at one edge, or all of it. */
  side: SideLight;
  /** The whole side wall glows because the letter is a rounded neon tube. */
  tubeSides: boolean;
  /** Light also washes the wall behind the letter. */
  wallSpill: "standoff" | "flush" | "none";
}

/**
 * Face, side and wall light are independent: a face-lit letter with a side band (LP 11-FS) glows on both.
 * Flush-mount letters with a partial back band only leak light around their edge; standoff letters wash the wall.
 */
export function glowParts(light: LightBehavior, profile: Profile): GlowParts {
  return {
    face: light.face === "glow",
    side: light.side,
    tubeSides: profile === "tube" && light.side === "none",
    wallSpill: light.halo === "standoff" ? "standoff" : light.side === "partial-back" ? "flush" : "none",
  };
}
