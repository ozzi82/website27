import * as THREE from "three";
import { ToneMappingMode } from "postprocessing";
import { EffectComposer, Bloom, ToneMapping } from "@react-three/postprocessing";
import { useSignGeometry } from "./useSignGeometry";
import BackdropWall from "./BackdropWall";
import HaloGlow from "./HaloGlow";
import type { CastBlockAcrylicConfig } from "./types";

// Per the spec's "Face/return materials" section: services.ts publishes no
// real depth/thickness spec for this product, so this is a placeholder
// needing confirmation against real fabrication limits before launch — same
// caveat as Trimless's depth presets in TrimlessScene.tsx.
const ACRYLIC_DEPTH_RATIO = 0.1;

// Cast acrylic is lit from within and glows brightest where light exits through
// the edges; a flat emissive reads as a matte card. Weighting emissive by view
// angle keeps a single material while brightening the sides. bodyGlow is the
// share of that brightness the broad face keeps (opal diffuses, clear doesn't).
const addEdgeGlow = (bodyGlow: number) => (shader: { uniforms: Record<string, unknown>; fragmentShader: string }) => {
  shader.uniforms.bodyGlow = { value: bodyGlow };
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", "#include <common>\nuniform float bodyGlow;")
    .replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
      float rim = 1.0 - saturate(dot(normalize(normal), normalize(vViewPosition)));
      totalEmissiveRadiance *= mix(bodyGlow, 2.4, rim * rim);`,
    );
};

// Flush against the wall, like a real mounted block.
const WALL_GAP = 0.05;

// Placeholder hex/physical values for Cast Block Acrylic's real color options
// (Clear / Opal / Custom per services.ts) — not confirmed material specs.
const ACRYLIC_APPEARANCE: Record<
  CastBlockAcrylicConfig["acrylicColor"],
  { color: string; transmission: number; roughness: number; glow: string; glowIntensity: number; bodyGlow: number; spill: THREE.Color }
> = {
  clear: { color: "#ffffff", transmission: 1, roughness: 0.03, glow: "#cfe6ff", glowIntensity: 1.6, bodyGlow: 0.06, spill: new THREE.Color("#bcd8ff").multiplyScalar(0.35) },
  opal: { color: "#f2ede1", transmission: 0.55, roughness: 0.4, glow: "#fff1d6", glowIntensity: 1.6, bodyGlow: 0.35, spill: new THREE.Color("#ffe9c4").multiplyScalar(0.5) },
  custom: { color: "#cfcfcf", transmission: 0.3, roughness: 0.3, glow: "#cfcfcf", glowIntensity: 1.4, bodyGlow: 0.2, spill: new THREE.Color("#dddddd").multiplyScalar(0.6) },
};

interface AcrylicSceneProps {
  shapes: THREE.Shape[];
  config: CastBlockAcrylicConfig;
}

export default function AcrylicScene({ shapes, config }: AcrylicSceneProps) {
  const geometry = useSignGeometry(shapes, ACRYLIC_DEPTH_RATIO);
  const isNight = config.dayNight === "night";
  const appearance = ACRYLIC_APPEARANCE[config.acrylicColor];

  return (
    <>
      <BackdropWall gap={WALL_GAP} isNight={isNight} />

      {isNight && <HaloGlow shapes={shapes} z={-WALL_GAP + 0.003} color={appearance.spill} />}

      {/* One material for the whole mesh — no face/return split, per the
          spec: a solid cast block has no face/return distinction. Passing a
          single material (not an array) applies it across every group
          ExtrudeGeometry generated, regardless of the multi-shape grouping
          behavior documented in useSignGeometry.ts. */}
      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          key={config.acrylicColor}
          onBeforeCompile={addEdgeGlow(appearance.bodyGlow)}
          color={appearance.color}
          transmission={appearance.transmission}
          roughness={appearance.roughness}
          ior={1.49}
          thickness={0.5}
          attenuationColor="#e4f3ff"
          attenuationDistance={3}
          emissive={isNight ? appearance.glow : "#000000"}
          emissiveIntensity={isNight ? appearance.glowIntensity : 0}
        />
      </mesh>

      {isNight && (
        <EffectComposer>
          <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.6} luminanceSmoothing={0.3} radius={0.7} />
          {/* See TrimlessScene: the composer drops the renderer's tone mapping. */}
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      )}
    </>
  );
}
