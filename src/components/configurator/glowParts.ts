import type { LightBehavior, Mount, Profile, SideLight } from "../../data/configurations";

/**
 * How light reaches the wall behind the letter:
 * - standoff: the letter floats on spacers and a halo washes the wall (LP 3.1, 11-B, 11-FB);
 * - flush: a flush back band leaks a thin ring of light around the edge (LP 3.2, 11-BS);
 * - none: nothing. Face-lit, front-band and full side-lit letters (and the unlit LP 1) do not light the wall behind them.
 */
export type WallSpill = "standoff" | "flush" | "none";

/** Which parts of a letter emit light in the 3D scene (the pure rule behind ConfigScene's material choices). */
export interface GlowParts {
  /** The front face glows (material-0). */
  face: boolean;
  /** How the side wall glows: none, a band at one edge, or all of it. */
  side: SideLight;
  /** Share of the side wall's depth that glows in the partial modes; null = the nominal brochure band. */
  sideBand: number | null;
  /** Light also washes the wall behind the letter. */
  wallSpill: WallSpill;
}

/**
 * Face, side and wall light are independent: a face-lit letter with a side band (LP 11-FS, 11-N) glows on both.
 * `profile` is accepted for symmetry with the geometry; the rounded neon profile glows exactly like any other
 * letter with the same light behaviour (face + front half of the side).
 */
export function glowParts(light: LightBehavior, _profile?: Profile, mount?: Mount): GlowParts {
  const face = light.face === "glow";
  // Only letters made to light the wall spill light on it: halo letters (standoff) and a back side band (a thin leak
  // when flush, a wash when stood off). A face-lit, front-band or side-lit letter does not light the wall behind it.
  const wallSpill: WallSpill =
    light.halo === "standoff"
      ? "standoff"
      : light.side === "partial-back"
        ? mount === "standoff"
          ? "standoff"
          : "flush"
        : "none";
  return {
    face,
    side: light.side,
    sideBand: light.side === "partial-back" || light.side === "partial-front" ? (light.sideBand ?? null) : null,
    wallSpill,
  };
}
