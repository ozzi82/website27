import { useCallback, useMemo, useRef } from "react";
import * as THREE from "three";
import type { SideLight } from "../../data/configurations";
import { useNightEffect } from "./NightContext";
import { lerp } from "./nightFade";

// Painted metal / painted acrylic: slightly metallic with a soft clearcoat.
const PAINT = { metalness: 0.12, roughness: 0.36, clearcoat: 0.55, clearcoatRoughness: 0.22 } as const;

// How hard lit acrylic drives the emissive channel at night. Well above 1 so the surface is a light source: the bloom
// pass spreads it and the neutral tone mapper compresses the hottest part toward a whiter core, while a saturated red
// or blue keeps its hue (it is compressed, not clipped to white).
export const GLOW_INTENSITY = 1.5;

type Shader = { uniforms: Record<string, unknown>; vertexShader: string; fragmentShader: string };

/**
 * What lit acrylic looks like with the LEDs off. Whites and warm whites stay milky; a coloured glow (red, blue, green...)
 * is pigmented acrylic, so it keeps its colour instead of fading to a pale tint: the more saturated the glow, the closer the
 * unlit surface is to the colour itself.
 */
export function milkyTint(glow: string): THREE.Color {
  const target = new THREE.Color(glow);
  const hsl = { h: 0, s: 0, l: 0 };
  target.getHSL(hsl);
  const t = Math.min(0.97, 0.3 + 0.7 * Math.min(1, hsl.s * 1.1));
  const unlit = new THREE.Color("#f3f0ea").lerp(target, t);
  // Keep strongly coloured acrylic a touch deeper than the glow itself, as pigmented acrylic looks in daylight.
  return hsl.s > 0.6 ? unlit.multiplyScalar(0.9) : unlit;
}

interface Attach {
  attach: string;
}

export function PaintedMaterial({ attach, color }: Attach & { color: string }) {
  return <meshPhysicalMaterial attach={attach} color={color} {...PAINT} />;
}

interface GlowMaterialProps extends Attach {
  glow: string;
  /** Dimmer, 0-1 (see brightnessFactor): scales how hard it glows at night. */
  level?: number;
}

/** Light-emitting acrylic: milky tinted acrylic by day, glowing in `glow` at night, fading between the two. */
export function GlowMaterial({ attach, glow, level = 1 }: GlowMaterialProps) {
  const material = useRef<THREE.MeshPhysicalMaterial>(null);
  // Lit, the surface is the glow colour itself; a milky diffuse base on top of the
  // emission would wash saturated colours out toward white.
  const milk = useMemo(() => milkyTint(glow), [glow]);
  const lit = useMemo(() => new THREE.Color(glow).multiplyScalar(0.15), [glow]);
  useNightEffect((n) => {
    const m = material.current;
    if (!m) return;
    m.color.copy(milk).lerp(lit, n);
    m.emissiveIntensity = lerp(0, GLOW_INTENSITY, n) * level;
  });
  return (
    <meshPhysicalMaterial
      ref={material}
      attach={attach}
      metalness={0}
      roughness={0.35}
      clearcoat={0.5}
      clearcoatRoughness={0.25}
      emissive={glow}
      emissiveIntensity={0}
    />
  );
}

const SIDE_MODE: Record<SideLight, number> = { none: 0, full: 1, "partial-back": 2, "partial-front": 3 };

interface SideLitMaterialProps extends Attach {
  color: string;
  glow: string;
  mode: SideLight;
  /** World-unit thickness of the lit band (partial modes). */
  band: number;
  /** Total letter depth in world units (front face z). */
  depth: number;
  /** Dimmer, 0-1 (see brightnessFactor): scales the band's night glow. */
  level?: number;
}

/**
 * Painted side wall with a lit band keyed to object-space z (back = 0, front = depth):
 * `full` lights the whole wall, `partial-back` / `partial-front` a band at that edge.
 * By day the band is milky acrylic; at night it also emits the glow colour, faded in with the night amount.
 */
export function SideLitMaterial({ attach, color, glow, mode, band, depth, level = 1 }: SideLitMaterialProps) {
  const uniforms = useMemo(
    () => ({
      uMode: { value: 0 },
      uBand: { value: 0 },
      uDepth: { value: 1 },
      uNight: { value: 0 },
      uDim: { value: 0 },
      uGlow: { value: new THREE.Color() },
      uGlowBase: { value: new THREE.Color() },
      uMilk: { value: new THREE.Color() },
    }),
    []
  );
  // Mutated in render on purpose: the shader holds these same objects, so the
  // lit band follows the controls without recompiling the program.
  uniforms.uMode.value = SIDE_MODE[mode];
  uniforms.uBand.value = band;
  uniforms.uDepth.value = depth;
  uniforms.uGlow.value.set(glow).multiplyScalar(GLOW_INTENSITY * level);
  uniforms.uMilk.value.copy(milkyTint(glow));
  // Dimmed all the way down at night the band goes dark like a switched-off LED: its milky base fades to the dark tinted base a lit band has.
  uniforms.uDim.value = 1 - level;
  uniforms.uGlowBase.value.set(glow).multiplyScalar(0.15);
  useNightEffect((n) => {
    uniforms.uNight.value = n;
  });

  const onBeforeCompile = useCallback(
    (shader: Shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying float vObjZ;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvObjZ = position.z;");
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
          varying float vObjZ;
          uniform float uMode, uBand, uDepth, uNight, uDim;
          uniform vec3 uGlow, uGlowBase, uMilk;`
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          float lit = 0.0;
          float soft = max(uBand * 0.12, 0.002);
          if (uMode > 2.5) lit = smoothstep(uDepth - uBand - soft, uDepth - uBand, vObjZ);
          else if (uMode > 1.5) lit = 1.0 - smoothstep(uBand, uBand + soft, vObjZ);
          else if (uMode > 0.5) lit = 1.0;
          diffuseColor.rgb = mix(diffuseColor.rgb, mix(uMilk, uGlowBase, uNight * uDim), lit);`
        )
        .replace(
          "#include <metalnessmap_fragment>",
          `#include <metalnessmap_fragment>
          metalnessFactor *= 1.0 - lit;`
        )
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
          totalEmissiveRadiance += uGlow * lit * uNight;`
        );
    },
    [uniforms]
  );

  return (
    <meshPhysicalMaterial
      attach={attach}
      color={color}
      {...PAINT}
      onBeforeCompile={onBeforeCompile}
      customProgramCacheKey={() => "side-lit"}
    />
  );
}
