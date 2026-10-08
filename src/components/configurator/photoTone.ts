import * as THREE from "three";

/**
 * The scene passes through an ACES tone mapper on screen (see DayNightToneMapping), which would darken and
 * shift a customer's photo. Baking the photo through the inverse of that curve makes the photo come out as it went in.
 */
function acesGrey(x: number): number {
  const c = x / 0.6;
  // Grey input through the same input / output matrices as the shader: rows of each matrix sum to 1.0267 and 1.0 respectively (see below).
  const r = (0.59719 + 0.35458 + 0.04823) * c;
  const g = (0.0760 + 0.90834 + 0.01566) * c;
  const b = (0.0284 + 0.13383 + 0.83777) * c;
  const curve = (v: number) => (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.432951) + 0.238081);
  const ro = curve(r), go = curve(g), bo = curve(b);
  const out = (1.60475 - 0.53108 - 0.07367) * ro + (-0.10208 + 1.10813 - 0.00605) * go + (-0.00327 - 0.07276 + 1.07602) * bo;
  return Math.min(1, Math.max(0, out / 3));
}

const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

/** For each 8-bit sRGB value, the linear scene value that comes out of the ACES mapper as that same sRGB value. */
export function acesInverseLut(): Float32Array {
  const lut = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const target = Math.min(srgbToLinear(i / 255), 0.985);
    let lo = 0;
    let hi = 60;
    for (let k = 0; k < 40; k++) {
      const mid = (lo + hi) / 2;
      if (acesGrey(mid) < target) lo = mid;
      else hi = mid;
    }
    lut[i] = (lo + hi) / 2;
  }
  return lut;
}

/** RGBA half-float texture of the photo, pre-compensated for the tone mapper. Rows are flipped for GL. */
export function photoTexture(source: CanvasImageSource, w: number, h: number): THREE.DataTexture | null {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;
  const lut = acesInverseLut();
  const half = Array.from(lut, (v) => THREE.DataUtils.toHalfFloat(v));
  const one = THREE.DataUtils.toHalfFloat(1);
  const out = new Uint16Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const src = y * w * 4;
    const dst = (h - 1 - y) * w * 4;
    for (let x = 0; x < w * 4; x += 4) {
      out[dst + x] = half[px[src + x]];
      out[dst + x + 1] = half[px[src + x + 1]];
      out[dst + x + 2] = half[px[src + x + 2]];
      out[dst + x + 3] = one;
    }
  }
  const tex = new THREE.DataTexture(out, w, h, THREE.RGBAFormat, THREE.HalfFloatType);
  tex.colorSpace = THREE.NoColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}
