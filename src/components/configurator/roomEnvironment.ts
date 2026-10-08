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
    const canvas = document.createElement("canvas");
    canvas.width = 4;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.45, "#e8e8e8");
    g.addColorStop(0.55, "#9a9a9a");
    g.addColorStop(1, "#3a3a3a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({ map, side: THREE.BackSide }));
    scene.add(dome);
    for (const x of [-9, 9]) {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(9, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(3.2), side: THREE.DoubleSide }));
      panel.position.set(x, 3, 6);
      panel.lookAt(0, 0, 0);
      scene.add(panel);
    }
    const pmrem = new THREE.PMREMGenerator(gl);
    texture = pmrem.fromScene(scene, 0.12).texture;
    pmrem.dispose();
    map.dispose();
    softCache.set(gl, texture);
  }
  return texture;
}
