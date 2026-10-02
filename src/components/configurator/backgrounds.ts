import * as THREE from "three";

export type BackgroundId = "concrete" | "brick" | "wood" | "plaster";

export interface BackgroundDef {
  id: BackgroundId;
  label: string;
  /** CSS colour for the picker chip. */
  swatch: string;
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

// Concrete is the brochure look and keeps the original wall values; the others are tuned to read
// clearly at both ends of the fade without washing out the halo and side glows.
export const BACKGROUNDS: readonly BackgroundDef[] = [
  {
    id: "concrete",
    label: "Concrete",
    swatch: "#8a8f98",
    tile: { w: 6, h: 6 },
    day: { color: "#8d929d", roughness: 0.92, bumpScale: 0.9, scene: "#2b3242" },
    night: { color: "#363a44", emissive: "#171a20", emissiveIntensity: 1, scene: "#04060a" },
    haloModulation: 0.55,
  },
  {
    id: "brick",
    label: "Brick",
    swatch: "#9a4b36",
    tile: { w: 6, h: 4 },
    day: { color: "#e4dad6", roughness: 0.95, bumpScale: -1.6, scene: "#2e211e" },
    night: { color: "#6b5754", emissive: "#241512", emissiveIntensity: 1, scene: "#070404" },
    haloModulation: 0.35,
  },
  {
    id: "wood",
    label: "Wood slats",
    swatch: "#b07a47",
    tile: { w: 4.8, h: 4.8 },
    day: { color: "#ffffff", roughness: 0.62, bumpScale: 0.8, scene: "#2a1f17" },
    night: { color: "#6e5a48", emissive: "#241810", emissiveIntensity: 1, scene: "#060403" },
    haloModulation: 0.6,
  },
  {
    id: "plaster",
    label: "White plaster",
    swatch: "#e6e2da",
    tile: { w: 6, h: 6 },
    day: { color: "#e9e6df", roughness: 0.88, bumpScale: 0.35, scene: "#33363d" },
    night: { color: "#5c5f66", emissive: "#181b20", emissiveIntensity: 1, scene: "#05060a" },
    haloModulation: 0.25,
  },
];

export function getBackground(id: BackgroundId): BackgroundDef {
  return BACKGROUNDS.find((b) => b.id === id) ?? BACKGROUNDS[0];
}

export interface WallLook {
  color: THREE.Color;
  emissive: THREE.Color;
  emissiveIntensity: number;
  /** Colour of the scene behind the wall. */
  scene: THREE.Color;
}

export const makeWallLook = (): WallLook => ({
  color: new THREE.Color(),
  emissive: new THREE.Color(),
  emissiveIntensity: 0,
  scene: new THREE.Color(),
});

const A = new THREE.Color();
const B = new THREE.Color();

/** Wall colours at night amount `n` (0 = day, 1 = night), written into `out` (no allocation per frame). */
export function wallLookAt(def: BackgroundDef, n: number, out: WallLook): WallLook {
  out.color.lerpColors(A.set(def.day.color), B.set(def.night.color), n);
  out.emissive.set(def.night.emissive);
  out.emissiveIntensity = def.night.emissiveIntensity * n;
  out.scene.lerpColors(A.set(def.day.scene), B.set(def.night.scene), n);
  return out;
}
