export type BackgroundId = "concrete" | "light-concrete" | "warm-concrete" | "brick";

export interface BackgroundDef {
  id: BackgroundId;
  label: string;
  /** CSS colour for the picker chip. */
  swatch: string;
  /** CSS `background` for the picker thumbnail (a cheap stand-in for the real texture). */
  thumb: string;
  /** World-unit size one texture tile covers (the artwork is about 2.4 units across): the photographed piece of wall at its real size. */
  tile: { w: number; h: number };
  /** Wall as lit by day. `scene` is the colour behind/around the wall. A negative `bumpScale` inverts the relief (brick: bright mortar is the recessed part). */
  day: { color: string; roughness: number; bumpScale: number; scene: string };
  /** Wall at night: darker, with a faint self-lit lift (emissive, faded in with the night amount) so the texture stays readable. */
  night: { color: string; emissive: string; emissiveIntensity: number; scene: string };
  /** 0-1: how much the wall texture modulates the halo light spilled onto it (0 = flat glow). */
  haloModulation: number;
}

export const DEFAULT_BACKGROUND: BackgroundId = "concrete";

// Concrete is the brochure look and keeps the original wall values; the other two concretes share its
// character (same relief and form-tie holes) in a lighter cool grey and a warmer beige grey. Brick is a small
// format. All are tuned to read clearly at both ends of the day/night fade without washing out the halo and side glows.
export const BACKGROUNDS: readonly BackgroundDef[] = [
  {
    id: "concrete",
    label: "Concrete",
    swatch: "#8a8f98",
    thumb: "url(/configurator/walls/concrete/thumb.jpg) center / cover, #8a8f98",
    tile: { w: 2.56, h: 2.56 },
    day: { color: "#8d929d", roughness: 0.92, bumpScale: 0.9, scene: "#2b3242" },
    night: { color: "#363a44", emissive: "#171a20", emissiveIntensity: 1, scene: "#04060a" },
    haloModulation: 0.55,
  },
  {
    id: "light-concrete",
    label: "Light concrete",
    swatch: "#b9bdc6",
    thumb: "url(/configurator/walls/concrete/thumb.jpg) center / cover, #b9bdc6",
    tile: { w: 2.56, h: 2.56 },
    day: { color: "#bcc0c9", roughness: 0.9, bumpScale: 0.8, scene: "#323a4b" },
    night: { color: "#464a55", emissive: "#1d2026", emissiveIntensity: 1, scene: "#05070b" },
    haloModulation: 0.5,
  },
  {
    id: "warm-concrete",
    label: "Warm concrete",
    swatch: "#a39a8c",
    thumb: "url(/configurator/walls/concrete/thumb.jpg) center / cover, #a39a8c",
    tile: { w: 2.56, h: 2.56 },
    day: { color: "#a69d8f", roughness: 0.92, bumpScale: 0.9, scene: "#34302a" },
    night: { color: "#403b36", emissive: "#1c1916", emissiveIntensity: 1, scene: "#070605" },
    haloModulation: 0.55,
  },
  {
    id: "brick",
    label: "Brick",
    swatch: "#9a4b36",
    thumb: "url(/configurator/walls/brick/thumb.jpg) center / cover, #9a4b36",
    tile: { w: 0.945, h: 0.945 },
    day: { color: "#ffffff", roughness: 0.95, bumpScale: -1.1, scene: "#2e211e" },
    night: { color: "#6b5754", emissive: "#241512", emissiveIntensity: 1, scene: "#070404" },
    haloModulation: 0.35,
  },
];

export function getBackground(id: BackgroundId): BackgroundDef {
  return BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0];
}

/**
 * The wall's texture is a real piece of concrete or brick, so at another sign size it covers a different share of the
 * (always 2.4 unit wide) picture: a 12" sign sits on a few big tiles, a 20 ft one on many small ones. The tiles above are
 * drawn for the 100" default; `scale` is 100 / the real size.
 */
export function backgroundAtScale(def: BackgroundDef, scale: number): BackgroundDef {
  return scale === 1 ? def : { ...def, tile: { w: def.tile.w * scale, h: def.tile.h * scale } };
}
