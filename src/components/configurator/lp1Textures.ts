import * as THREE from "three";
import { makeFbm, makeTileableNoise, mulberry32 } from "./wallNoise";
import type { Lp1FinishId } from "./lp1Materials";

const SIZE = 256;
/** How many texture tiles span one world unit: the tile covers about a third of a normalised letter. */
export const LP1_TEXTURE_REPEAT = 0.3;

type Rgb = [number, number, number];
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function paint(painter: (u: number, v: number) => Rgb, colorSpace: string): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const image = ctx.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const [r, g, b] = painter(x / SIZE, y / SIZE);
      const i = (y * SIZE + x) * 4;
      image.data[i] = clamp01(r) * 255;
      image.data[i + 1] = clamp01(g) * 255;
      image.data[i + 2] = clamp01(b) * 255;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(LP1_TEXTURE_REPEAT, LP1_TEXTURE_REPEAT);
  texture.colorSpace = colorSpace as THREE.ColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// Wood: long grain along x (the noise is stretched), darker growth rings and fine pores.
function woodPainter(): (u: number, v: number) => Rgb {
  const rings = makeTileableNoise(3, 11);
  const grain = makeFbm(4, 3, 12);
  const pores = mulberry32(13);
  const light: Rgb = [0.86, 0.64, 0.4];
  const dark: Rgb = [0.34, 0.19, 0.09];
  return (u, v) => {
    const warp = grain(u, v) * 0.12;
    const band = 0.5 + 0.5 * Math.sin((v + warp + rings(u, v) * 0.1) * Math.PI * 2 * 14);
    const fine = (grain(u, v * 6) - 0.5) * 0.35;
    const k = clamp01(band * 0.45 + fine * 1.4 + 0.1 + (pores() - 0.5) * 0.08);
    return mixRgb(light, dark, k);
  };
}

// Brushed steel: fine horizontal streaks of varying brightness.
function brushedPainter(): (u: number, v: number) => Rgb {
  const streak = makeTileableNoise(12, 21);
  const wide = makeFbm(3, 2, 22);
  return (u, v) => {
    const l = 0.7 + (streak(u, v * 10) - 0.5) * 0.28 + (wide(u, v) - 0.5) * 0.08;
    return [l * 0.97, l * 0.98, l];
  };
}

// Corten: blotchy oxidised browns and oranges with dark pitting.
function cortenPainter(): (u: number, v: number) => Rgb {
  const blotch = makeFbm(4, 5, 31);
  const fine = makeTileableNoise(64, 32);
  const rust: Rgb = [0.55, 0.26, 0.1];
  const deep: Rgb = [0.25, 0.11, 0.06];
  const bright: Rgb = [0.72, 0.38, 0.14];
  return (u, v) => {
    const b = blotch(u, v);
    const base = b < 0.5 ? mixRgb(deep, rust, b * 2) : mixRgb(rust, bright, (b - 0.5) * 2);
    const f = 0.85 + (fine(u, v) - 0.5) * 0.4;
    return [base[0] * f, base[1] * f, base[2] * f];
  };
}

// Roughness variation for brushed steel: streaks scatter the highlight.
function streakRoughness(): (u: number, v: number) => Rgb {
  const streak = makeTileableNoise(12, 41);
  return (u, v) => {
    const r = 0.35 + (streak(u, v * 10) - 0.5) * 0.3;
    return [r, r, r];
  };
}

export interface Lp1Textures {
  map: THREE.CanvasTexture | null;
  roughnessMap: THREE.CanvasTexture | null;
}

/** Procedural textures for the finishes that have a surface pattern; null where the finish is plain. */
export function makeLp1Textures(finish: Lp1FinishId): Lp1Textures {
  switch (finish) {
    case "wood":
      return { map: paint(woodPainter(), THREE.SRGBColorSpace), roughnessMap: null };
    case "brushed-steel":
      return { map: paint(brushedPainter(), THREE.SRGBColorSpace), roughnessMap: paint(streakRoughness(), THREE.NoColorSpace) };
    case "corten":
      return { map: paint(cortenPainter(), THREE.SRGBColorSpace), roughnessMap: null };
    default:
      return { map: null, roughnessMap: null };
  }
}
