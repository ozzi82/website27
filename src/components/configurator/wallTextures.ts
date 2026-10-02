import * as THREE from "three";
import type { BackgroundId } from "./backgrounds";
import { makeFbm, makeTileableNoise, mulberry32 } from "./wallNoise";

const SIZE = 512;

type Rgb = [number, number, number];
type Painter = (u: number, v: number, x: number, y: number) => Rgb;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
const scaleRgb = (c: Rgb, k: number): Rgb => [c[0] * k, c[1] * k, c[2] * k];
const grey = (l: number): Rgb => [l, l, l];

function hash(a: number, b: number): number {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Poured concrete: broad mottling, fine grain, a faint panel joint at the tile edges and form-tie holes.
function concretePainter(): Painter {
  const mottle = makeFbm(3, 4, 11);
  const grain = makeTileableNoise(96, 12);
  const speckle = mulberry32(13);
  const joint = 3 / SIZE;
  return (u, v) => {
    const speck = speckle();
    let l = 0.8 + (mottle(u, v) - 0.5) * 0.4 + (grain(u, v) - 0.5) * 0.12 + (speck - 0.5) * 0.045;
    const edge = Math.min(u, 1 - u, v, 1 - v);
    if (edge < joint) l *= 0.62 + 0.38 * (edge / joint);
    // Form-tie holes at the quarter points; the quick bounds test skips almost every pixel.
    const nu = Math.abs(u - 0.25) < 0.016 ? 0.25 : Math.abs(u - 0.75) < 0.016 ? 0.75 : 0;
    const nv = Math.abs(v - 0.25) < 0.016 ? 0.25 : Math.abs(v - 0.75) < 0.016 ? 0.75 : 0;
    if (nu && nv) {
      const d = Math.hypot(u - nu, v - nv) * SIZE;
      if (d < 5) l *= 0.45 + 0.55 * (d / 5);
      else if (d < 7 && v > nv) l += 0.05 * (1 - (d - 5) / 2); // lit lower lip of the hole
    }
    return grey(clamp01(l));
  };
}

// Clay brick in running bond: four bricks across, eight courses per tile.
function brickPainter(): Painter {
  const fine = makeFbm(24, 2, 21);
  const mortarNoise = makeTileableNoise(64, 22);
  const BRICK_W = SIZE / 4;
  const BRICK_H = SIZE / 8;
  const MORTAR = 7;
  const lo: Rgb = [0.5, 0.2, 0.14];
  const hi: Rgb = [0.72, 0.34, 0.22];
  return (u, v, x, y) => {
    const course = Math.floor(y / BRICK_H);
    const px = x + (course % 2) * (BRICK_W / 2);
    const bx = ((px % BRICK_W) + BRICK_W) % BRICK_W;
    const by = y % BRICK_H;
    const id = Math.floor(px / BRICK_W) % 4;
    const dx = Math.min(bx - MORTAR / 2, BRICK_W - MORTAR / 2 - bx);
    const dy = Math.min(by - MORTAR / 2, BRICK_H - MORTAR / 2 - by);
    const edge = Math.min(dx, dy);
    if (edge < 0) {
      const m = 0.66 + (mortarNoise(u, v) - 0.5) * 0.2;
      return [m * 1.0, m * 0.96, m * 0.88];
    }
    const tone = hash(id + 7, course + 3);
    let c = mixRgb(lo, hi, tone * tone * 0.6 + tone * 0.4);
    if (hash(id + 40, course + 90) > 0.9) c = scaleRgb(c, 0.72); // the odd darker, over-fired brick
    c = scaleRgb(c, 0.82 + fine(u, v) * 0.36);
    c = scaleRgb(c, 0.88 + 0.12 * clamp01(edge / 4)); // slightly worn arris
    return c;
  };
}

// Vertical timber slats: eight per tile with dark gaps, long grain streaks and a tone per slat.
function woodPainter(): Painter {
  // Few lattice cells vertically (long streaks), many horizontally (narrow fibres).
  const long = makeTileableNoise(3, 31);
  const medium = makeTileableNoise(6, 32);
  const fine = makeTileableNoise(12, 33);
  const SLAT = SIZE / 8;
  const GAP = 4;
  const dark: Rgb = [0.4, 0.23, 0.11];
  const light: Rgb = [0.8, 0.55, 0.32];
  return (u, v, x) => {
    const slat = Math.floor(x / SLAT);
    const sx = x % SLAT;
    if (sx < GAP / 2 || sx > SLAT - GAP / 2) return [0.05, 0.035, 0.02];
    const shift = hash(slat, 5);
    const g =
      long(u * 8, v + shift) * 0.5 + medium(u * 10, v + shift * 2) * 0.32 + fine(u * 16, v + shift * 3) * 0.18;
    let c = mixRgb(dark, light, clamp01((g - 0.25) * 1.5));
    c = scaleRgb(c, 0.8 + hash(slat, 9) * 0.34);
    const edge = Math.min(sx - GAP / 2, SLAT - GAP / 2 - sx);
    c = scaleRgb(c, 0.78 + 0.22 * clamp01(edge / 3)); // eased slat edges
    return c;
  };
}

// Smooth painted plaster: nearly flat, with soft trowel mottling and fine grain.
function plasterPainter(): Painter {
  const mottle = makeFbm(2, 4, 41);
  const grain = makeTileableNoise(128, 42);
  return (u, v) => {
    const l = 0.93 + (mottle(u, v) - 0.5) * 0.07 + (grain(u, v) - 0.5) * 0.03;
    return [clamp01(l * 1.0), clamp01(l * 0.985), clamp01(l * 0.955)];
  };
}

const PAINTERS: Record<BackgroundId, () => Painter> = {
  concrete: concretePainter,
  brick: brickPainter,
  wood: woodPainter,
  plaster: plasterPainter,
};

// sRGB byte -> linear, for the mean-luminance estimate the halo shader normalises by.
const LINEAR = Float32Array.from({ length: 256 }, (_, i) => {
  const c = i / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
});

export interface WallTexture {
  texture: THREE.CanvasTexture;
  /** Average linear luminance of the texture. */
  meanLuminance: number;
}

/** Paints a small seamless wall texture on a canvas. Returns null where there is no 2D canvas (e.g. jsdom). */
export function createWallTexture(id: BackgroundId, maxAnisotropy = 4): WallTexture | null {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const image = ctx.createImageData(SIZE, SIZE);
  const paint = PAINTERS[id]();
  let sum = 0;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const [r, g, b] = paint((x + 0.5) / SIZE, (y + 0.5) / SIZE, x, y);
      const o = (y * SIZE + x) * 4;
      const R = Math.round(clamp01(r) * 255);
      const G = Math.round(clamp01(g) * 255);
      const B = Math.round(clamp01(b) * 255);
      image.data[o] = R;
      image.data[o + 1] = G;
      image.data[o + 2] = B;
      image.data[o + 3] = 255;
      sum += 0.2126 * LINEAR[R] + 0.7152 * LINEAR[G] + 0.0722 * LINEAR[B];
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = maxAnisotropy;
  return { texture, meanLuminance: sum / (SIZE * SIZE) };
}
