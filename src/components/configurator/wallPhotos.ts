import * as THREE from "three";
import type { BackgroundId } from "./backgrounds";
import type { WallTexture } from "./wallTextures";

/**
 * Photographed wall materials: colour and relief (a normal map) as separate pictures, so light catches the
 * joints and pores the way it does on a real wall. The scans are from Poly Haven (polyhaven.com), CC0: "Concrete Wall 008"
 * and "Red Brick 03", resized, the concrete made neutral grey so the three concrete tones can tint it, the brick lightened.
 * `meanLuminance` is the colour picture's average linear luminance (the halo's light on the wall is normalised by it).
 */
const PHOTOS: Record<BackgroundId, { folder: string; meanLuminance: number }> = {
  concrete: { folder: "concrete", meanLuminance: 0.604 },
  "light-concrete": { folder: "concrete", meanLuminance: 0.604 },
  "warm-concrete": { folder: "concrete", meanLuminance: 0.604 },
  brick: { folder: "brick", meanLuminance: 0.223 },
};

/** Loads the two pictures of a wall; rejects when one cannot be loaded (the caller keeps the drawn wall then). */
export function loadWallPhoto(id: BackgroundId, maxAnisotropy = 4): Promise<WallTexture> {
  const { folder, meanLuminance } = PHOTOS[id];
  const loader = new THREE.TextureLoader();
  const load = (name: string, colour: boolean) =>
    loader.loadAsync(`/configurator/walls/${folder}/${name}.jpg`).then((t) => {
      t.colorSpace = colour ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = maxAnisotropy;
      return t;
    });
  return Promise.all([load("color", true), load("normal", false)]).then(([texture, normal]) => ({ texture, normal, meanLuminance }));
}
