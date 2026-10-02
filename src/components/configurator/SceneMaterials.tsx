import { useCallback, useMemo } from "react";
import * as THREE from "three";
import type { SideLight } from "../../data/configurations";

// Painted metal / painted acrylic: slightly metallic with a soft clearcoat.
const PAINT = { metalness: 0.35, roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.4 } as const;

// How hard lit acrylic drives the emissive channel at night. Above 1 so the
// bloom pass picks it up, but low enough that ACES doesn't wash colours to white.
const GLOW_INTENSITY = 0.8;

type Shader = { uniforms: Record<string, unknown>; vertexShader: string; fragmentShader: string };

/** Unlit translucent acrylic reads as milky white with a hint of its glow colour. */
export function milkyTint(glow: string): THREE.Color {
  return new THREE.Color("#f3f0ea").lerp(new THREE.Color(glow), 0.35);
}

interface Attach {
  attach: string;
}

export function PaintedMaterial({ attach, color }: Attach & { color: string }) {
  return <meshPhysicalMaterial attach={attach} color={color} {...PAINT} />;
}

// A neon tube is brightest where it faces the camera and falls off toward its
// rounded edges; without that a flat emissive reads as a cut-out, not a tube.
const addTubeShading = (shader: Shader) => {
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <emissivemap_fragment>",
    `#include <emissivemap_fragment>
    float facing = saturate(dot(normalize(normal), normalize(vViewPosition)));
    totalEmissiveRadiance *= mix(0.3, 1.0, pow(facing, 0.6));`
  );
};

interface GlowMaterialProps extends Attach {
  glow: string;
  isNight: boolean;
  /** Shade by view angle so a rounded profile reads as a tube. */
  rounded?: boolean;
}

/** Light-emitting acrylic: glows in `glow` at night, milky tinted acrylic by day. */
export function GlowMaterial({ attach, glow, isNight, rounded = false }: GlowMaterialProps) {
  // Lit, the surface is the glow colour itself; a milky diffuse base on top of the
  // emission would wash saturated colours out toward white.
  const tint = useMemo(
    () => (isNight ? new THREE.Color(glow).multiplyScalar(0.15) : milkyTint(glow)),
    [glow, isNight]
  );
  return (
    <meshPhysicalMaterial
      key={rounded ? "rounded" : "flat"}
      attach={attach}
      color={tint}
      metalness={0}
      roughness={0.35}
      clearcoat={0.5}
      clearcoatRoughness={0.25}
      emissive={isNight ? glow : "#000000"}
      emissiveIntensity={isNight ? GLOW_INTENSITY : 0}
      onBeforeCompile={rounded ? addTubeShading : undefined}
      customProgramCacheKey={() => (rounded ? "glow-rounded" : "glow-flat")}
    />
  );
}

const SIDE_MODE: Record<SideLight, number> = { none: 0, full: 1, "partial-back": 2, "partial-front": 3 };

interface SideLitMaterialProps extends Attach {
  color: string;
  glow: string;
  isNight: boolean;
  mode: SideLight;
  /** World-unit thickness of the lit band (partial modes). */
  band: number;
  /** Total letter depth in world units (front face z). */
  depth: number;
}

/**
 * Painted side wall with a lit band keyed to object-space z (back = 0, front = depth):
 * `full` lights the whole wall, `partial-back` / `partial-front` a band at that edge.
 * By day the band is milky acrylic; at night it also emits the glow colour.
 */
export function SideLitMaterial({ attach, color, glow, isNight, mode, band, depth }: SideLitMaterialProps) {
  const uniforms = useMemo(
    () => ({
      uMode: { value: 0 },
      uBand: { value: 0 },
      uDepth: { value: 1 },
      uNight: { value: 0 },
      uGlow: { value: new THREE.Color() },
      uMilk: { value: new THREE.Color() },
    }),
    []
  );
  // Mutated in render on purpose: the shader holds these same objects, so the
  // lit band follows the controls without recompiling the program.
  uniforms.uMode.value = SIDE_MODE[mode];
  uniforms.uBand.value = band;
  uniforms.uDepth.value = depth;
  uniforms.uNight.value = isNight ? 1 : 0;
  uniforms.uGlow.value.set(glow).multiplyScalar(GLOW_INTENSITY);
  uniforms.uMilk.value.copy(milkyTint(glow));

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
          uniform float uMode, uBand, uDepth, uNight;
          uniform vec3 uGlow, uMilk;`
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          float lit = 0.0;
          float soft = max(uBand * 0.12, 0.002);
          if (uMode > 2.5) lit = smoothstep(uDepth - uBand - soft, uDepth - uBand, vObjZ);
          else if (uMode > 1.5) lit = 1.0 - smoothstep(uBand, uBand + soft, vObjZ);
          else if (uMode > 0.5) lit = 1.0;
          diffuseColor.rgb = mix(diffuseColor.rgb, uMilk, lit);`
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
