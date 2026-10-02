import * as THREE from "three";

const PX_PER_UNIT = 100;

// Three box-blur passes approximate a gaussian. Never writes into `src`: the
// six ping-pong passes would otherwise land the result back in the caller's
// array, so a second blur of the same mask would blur the already-blurred one.
export function gaussianBlur(src: Float32Array, w: number, h: number, sigma: number): Float32Array {
  const radius = Math.max(1, Math.round((Math.sqrt(4 * sigma * sigma + 1) - 1) / 2));
  const scale = 1 / (2 * radius + 1);
  let a = Float32Array.from(src);
  let b = new Float32Array(src.length);
  const pass = (horizontal: boolean) => {
    const lines = horizontal ? h : w;
    const len = horizontal ? w : h;
    const step = horizontal ? 1 : w;
    const lineStep = horizontal ? w : 1;
    for (let l = 0; l < lines; l++) {
      const base = l * lineStep;
      let sum = 0;
      for (let i = 0; i < radius; i++) sum += a[base + i * step];
      for (let i = 0; i < len; i++) {
        if (i + radius < len) sum += a[base + (i + radius) * step];
        b[base + i * step] = sum * scale;
        if (i - radius >= 0) sum -= a[base + (i - radius) * step];
      }
    }
    [a, b] = [b, a];
  };
  for (let n = 0; n < 3; n++) {
    pass(true);
    pass(false);
  }
  return a;
}

/**
 * Builds a blurred, float-precision silhouette of the artwork to stand in for
 * the light spilling onto the wall behind halo-lit letters: one point light
 * can't follow arbitrary letter outlines, and a scaled copy of the geometry
 * reads as a ghost duplicate under the 3/4 camera. Half-float rather than a
 * canvas texture because an 8-bit tail shows contour banding on a dark wall.
 */
export function createHaloGlow(shapes: THREE.Shape[], spread: number) {
  const rings = shapes.flatMap((s) => [s.getPoints(24), ...s.holes.map((h) => h.getPoints(24))]);
  const box = new THREE.Box2().setFromPoints(rings.flat());
  const center = box.getCenter(new THREE.Vector2());
  const size = box.getSize(new THREE.Vector2());
  const width = size.x + spread * 2;
  const height = size.y + spread * 2;
  const w = Math.ceil(width * PX_PER_UNIT);
  const h = Math.ceil(height * PX_PER_UNIT);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.beginPath();
  for (const ring of rings) {
    ring.forEach((p, i) => {
      const x = (p.x - center.x + width / 2) * PX_PER_UNIT;
      const y = (center.y - p.y + height / 2) * PX_PER_UNIT;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  }
  ctx.fillStyle = "#fff";
  ctx.fill("evenodd");

  const rgba = ctx.getImageData(0, 0, w, h).data;
  const mask = new Float32Array(w * h);
  for (let i = 0; i < mask.length; i++) mask[i] = rgba[i * 4 + 3] / 255;
  const wide = gaussianBlur(mask, w, h, spread * 0.1 * PX_PER_UNIT);
  const tight = gaussianBlur(mask, w, h, spread * 0.035 * PX_PER_UNIT);

  const data = new Uint16Array(w * h * 4);
  const one = THREE.DataUtils.toHalfFloat(1);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = THREE.DataUtils.toHalfFloat(Math.min(1, wide[y * w + x] * 1.2 + tight[y * w + x] * 0.8));
      const o = ((h - 1 - y) * w + x) * 4;
      data[o] = data[o + 1] = data[o + 2] = v;
      data[o + 3] = one;
    }
  }
  const texture = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.HalfFloatType);
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return { texture, width, height, center };
}
