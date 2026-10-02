import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useSignGeometry } from "./useSignGeometry";
import type { CastBlockAcrylicConfig } from "./types";

// Per the spec's "Face/return materials" section: services.ts publishes no
// real depth/thickness spec for this product, so this is a placeholder
// needing confirmation against real fabrication limits before launch — same
// caveat as Trimless's depth presets in TrimlessScene.tsx.
const ACRYLIC_DEPTH_RATIO = 0.1;

// Placeholder hex/physical values for Cast Block Acrylic's real color options
// (Clear / Opal / Custom per services.ts) — not confirmed material specs.
const ACRYLIC_APPEARANCE: Record<CastBlockAcrylicConfig["acrylicColor"], { color: string; transmission: number }> = {
  clear: { color: "#ffffff", transmission: 0.85 },
  opal: { color: "#f2ede1", transmission: 0.5 },
  custom: { color: "#cfcfcf", transmission: 0.3 },
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
      {/* One material for the whole mesh — no face/return split, per the
          spec: a solid cast block has no face/return distinction. Passing a
          single material (not an array) applies it across every group
          ExtrudeGeometry generated, regardless of the multi-shape grouping
          behavior documented in useSignGeometry.ts. */}
      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          color={appearance.color}
          transmission={appearance.transmission}
          roughness={0.15}
          thickness={0.5}
          emissive={isNight ? appearance.color : "#000000"}
          emissiveIntensity={isNight ? 1.2 : 0}
        />
      </mesh>

      {isNight && (
        <EffectComposer>
          <Bloom intensity={0.6} luminanceThreshold={0.4} luminanceSmoothing={0.2} />
        </EffectComposer>
      )}
    </>
  );
}
