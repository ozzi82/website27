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
