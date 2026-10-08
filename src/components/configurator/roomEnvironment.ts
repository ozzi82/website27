import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const cache = new WeakMap<THREE.WebGLRenderer, THREE.Texture>();

/**
 * A small procedural studio (three's RoomEnvironment) prefiltered for reflections, built once per renderer. The HDR the
 * scene uses for ambience is dim and sparse by design, so a mirror finish reflecting it alone just goes black; this one
 * has bright panels all round, needs no download and cannot fail to load.
 */
export function getRoomEnvironment(gl: THREE.WebGLRenderer): THREE.Texture {
  let texture = cache.get(gl);
  if (!texture) {
    const pmrem = new THREE.PMREMGenerator(gl);
    texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    cache.set(gl, texture);
  }
  return texture;
}

const softCache = new WeakMap<THREE.WebGLRenderer, THREE.Texture>();

/**
 * Smooth studio for polished-mirror metals: a gradient dome (bright sky, light horizon, darker floor) and two large soft
 * panels. RoomEnvironment's hard-edged light panels read as vertical stripes on a mirror, which looks brushed; this one
 * has no hard edges, so a flat polished face is one clean tone that shifts smoothly as the view moves.
 */
export function getMirrorEnvironment(gl: THREE.WebGLRenderer): THREE.Texture {
  let texture = softCache.get(gl);
  if (!texture) {
    const W = 512;
    const H = 256;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    const img = ctx.createImageData(W, H);
    // Brightness = a vertical sky/floor profile times a broad light-and-dark sweep around the dome (3 cycles). A polished face
    // sees only a slice of it, so the letters get a smooth bright-to-dark sweep with a hot highlight: the look of a mirror.
    const profile = (v: number) => (v < 0.45 ? 0.75 + 0.25 * (1 - v / 0.45) : v < 0.62 ? 1 : Math.max(0.03, 1 - (v - 0.62) / 0.14));
    for (let y = 0; y < H; y++) {
      const v = y / (H - 1);
      for (let x = 0; x < W; x++) {
        const wave = Math.pow(0.5 + 0.5 * Math.cos((x / W) * Math.PI * 6 + 1.4), 1.6);
        const k = Math.min(1, profile(v) * (0.2 + 1.3 * wave));
        const c = Math.round(Math.pow(k, 1 / 2.2) * 255);
        const i = (y * W + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = c;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({ map, side: THREE.BackSide }));
    scene.add(dome);
    for (const [x, y, w, h, k] of [[-10, 4, 7, 14, 6], [11, 2, 5, 12, 5], [0, 12, 16, 4, 4]] as const) {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(k), side: THREE.DoubleSide }));
      panel.position.set(x, y, 7);
      panel.lookAt(0, 0, 0);
      scene.add(panel);
    }
    const pmrem = new THREE.PMREMGenerator(gl);
    texture = pmrem.fromScene(scene, 0.02).texture;
    pmrem.dispose();
    map.dispose();
    softCache.set(gl, texture);
  }
  return texture;
}
