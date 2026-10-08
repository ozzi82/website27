import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createHaloGlow } from "./haloTexture";
import { useNightEffect } from "./NightContext";
import type { BackgroundDef } from "./backgrounds";
import type { WallTexture } from "./wallTextures";

interface HaloGlowProps {
  shapes: THREE.Shape[];
  z: number;
  color: THREE.Color;
  /** How far the light reaches around the outline, in world units. */
  spread?: number;
  background: BackgroundDef;
  wall: WallTexture | null;
  /** Dimmer, 0-1 (see brightnessFactor): scales the light spilled on the wall. */
  level?: number;
}

const VERTEX = /* glsl */ `
varying vec2 vUv;
varying vec2 vWorld;
void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xy;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

// Light spilled on a textured wall catches the relief: the glow is modulated by the wall's
// own luminance (normalised by its mean so the overall strength is unchanged) at the same
// world position, using the same tiling as the wall itself.
const FRAGMENT = /* glsl */ `
uniform sampler2D uHalo;
uniform sampler2D uWall;
uniform vec3 uColor;
uniform float uOpacity;
uniform vec2 uTile;
uniform float uMean;
uniform float uMod;
varying vec2 vUv;
varying vec2 vWorld;
void main() {
  float halo = texture2D(uHalo, vUv).r;
  vec3 wall = texture2D(uWall, vWorld / uTile + 0.5).rgb;
  float lum = dot(wall, vec3(0.2126, 0.7152, 0.0722));
  float k = mix(1.0, clamp(lum / uMean, 0.2, 2.2), uMod);
  gl_FragColor = vec4(uColor * halo * k * uOpacity, 1.0);
}`;

// Soft light spill on the wall around the artwork outline; fades in with the night amount.
export default function HaloGlow({ shapes, z, color, spread = 1.4, background, wall, level = 1 }: HaloGlowProps) {
  const glow = useMemo(() => createHaloGlow(shapes, spread), [shapes, spread]);
  useEffect(
    () => () => {
      glow?.texture.dispose();
      glow?.alphaTexture.dispose();
    },
    [glow]
  );
  const mesh = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uHalo: { value: null as THREE.Texture | null },
      uWall: { value: null as THREE.Texture | null },
      uColor: { value: new THREE.Color() },
      uOpacity: { value: 0 },
      uTile: { value: new THREE.Vector2(1, 1) },
      uMean: { value: 1 },
      uMod: { value: 0 },
    }),
    []
  );
  // Mutated in render on purpose (as in SideLitMaterial): the shader holds these same objects.
  uniforms.uHalo.value = glow?.texture ?? null;
  uniforms.uWall.value = wall?.texture ?? glow?.texture ?? null;
  uniforms.uColor.value.copy(color);
  uniforms.uTile.value.set(background.tile.w, background.tile.h);
  uniforms.uMean.value = wall?.meanLuminance ?? 1;
  uniforms.uMod.value = wall ? background.haloModulation : 0;

  useNightEffect((n) => {
    uniforms.uOpacity.value = n * level;
    if (mesh.current) mesh.current.visible = n * level > 0.002;
  });
  if (!glow) return null;
  return (
    <mesh ref={mesh} visible={false} position={[glow.center.x, glow.center.y, z]}>
      <planeGeometry args={[glow.width, glow.height]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
