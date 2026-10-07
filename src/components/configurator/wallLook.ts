import * as THREE from "three";
import type { BackgroundDef } from "./backgrounds";

// Kept apart from backgrounds.ts so the pages that only need the background list (and the quote hand-over) do not pull in three.js.

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
