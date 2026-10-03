import type { LightBehavior, Profile, SideLight } from "../../data/configurations";

/**
 * How light reaches the wall behind the letter:
 * - standoff: the letter floats on spacers and a halo washes the wall (LP 3.1, 11-B, 11-FB);
 * - flush: a flush back band leaks a thin ring of light around the edge (LP 3.2, 11-BS);
 * - edge: a lit side wall bleeds a little light onto the wall around it (11-S);
 * - glare: a lit face throws a faint soft wash around the letter (every face-lit letter);
 * - none: nothing (the unlit LP 1).
 */
export type WallSpill = "standoff" | "flush" | "edge" | "glare" | "none";

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
export function glowParts(light: LightBehavior, _profile?: Profile): GlowParts {
  const face = light.face === "glow";
  const wallSpill: WallSpill =
    light.halo === "standoff"
      ? "standoff"
      : light.side === "partial-back"
        ? "flush"
        : light.side === "full"
          ? "edge"
          : face
            ? "glare"
            : "none";
  return {
    face,
    side: light.side,
    sideBand: light.side === "partial-back" || light.side === "partial-front" ? (light.sideBand ?? null) : null,
    wallSpill,
  };
}
