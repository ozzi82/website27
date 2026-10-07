export type BackgroundId = "concrete" | "light-concrete" | "warm-concrete" | "brick";

export interface BackgroundDef {
  id: BackgroundId;
  label: string;
  /** CSS colour for the picker chip. */
  swatch: string;
  /** CSS `background` for the picker thumbnail (a cheap stand-in for the real texture). */
  thumb: string;
  /** World-unit size one texture tile covers (the artwork is about 2.4 units across). */
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
    thumb: "radial-gradient(circle at 28% 35%, rgba(255,255,255,0.16), transparent 55%), radial-gradient(circle at 75% 70%, rgba(0,0,0,0.14), transparent 50%), #8a8f98",
    tile: { w: 6, h: 6 },
    day: { color: "#8d929d", roughness: 0.92, bumpScale: 0.9, scene: "#2b3242" },
    night: { color: "#363a44", emissive: "#171a20", emissiveIntensity: 1, scene: "#04060a" },
    haloModulation: 0.55,
  },
  {
    id: "light-concrete",
    label: "Light concrete",
    swatch: "#b9bdc6",
    thumb: "radial-gradient(circle at 28% 35%, rgba(255,255,255,0.16), transparent 55%), radial-gradient(circle at 75% 70%, rgba(0,0,0,0.14), transparent 50%), #b9bdc6",
    tile: { w: 6, h: 6 },
    day: { color: "#bcc0c9", roughness: 0.9, bumpScale: 0.8, scene: "#323a4b" },
    night: { color: "#464a55", emissive: "#1d2026", emissiveIntensity: 1, scene: "#05070b" },
    haloModulation: 0.5,
  },
  {
    id: "warm-concrete",
    label: "Warm concrete",
    swatch: "#a39a8c",
    thumb: "radial-gradient(circle at 28% 35%, rgba(255,255,255,0.16), transparent 55%), radial-gradient(circle at 75% 70%, rgba(0,0,0,0.14), transparent 50%), #a39a8c",
    tile: { w: 6, h: 6 },
    day: { color: "#a69d8f", roughness: 0.92, bumpScale: 0.9, scene: "#34302a" },
    night: { color: "#403b36", emissive: "#1c1916", emissiveIntensity: 1, scene: "#070605" },
    haloModulation: 0.55,
  },
  {
    id: "brick",
    label: "Brick",
    swatch: "#9a4b36",
    thumb:
      "repeating-linear-gradient(0deg, transparent 0 4px, rgba(225,214,205,0.75) 4px 5px), repeating-linear-gradient(90deg, transparent 0 9px, rgba(225,214,205,0.75) 9px 10px), #9a4b36",
    tile: { w: 6, h: 4 },
    day: { color: "#e4dad6", roughness: 0.95, bumpScale: -1.1, scene: "#2e211e" },
    night: { color: "#6b5754", emissive: "#241512", emissiveIntensity: 1, scene: "#070404" },
    haloModulation: 0.35,
  },
];

export function getBackground(id: BackgroundId): BackgroundDef {
  return BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0];
}
