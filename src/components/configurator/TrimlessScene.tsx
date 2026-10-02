import * as THREE from "three";
import { ToneMappingMode } from "postprocessing";
import { EffectComposer, Bloom, ToneMapping } from "@react-three/postprocessing";
import { useSignGeometry } from "./useSignGeometry";
import HaloGlow from "./HaloGlow";
import BackdropWall from "./BackdropWall";
import type { TrimlessConfig } from "./types";

const DEPTH_RATIOS: Record<TrimlessConfig["depth"], number> = {
  slim: 0.08,
  standard: 0.15,
  max: 0.22,
};

// Placeholder hex values for the curated swatch names — real fabricable paint
// codes should replace these before launch (see spec: "a curated swatch list
// of colors Sunlite can actually fabricate," not a free picker — these
// specific hex values are this plan's placeholder, not confirmed brand colors).
const SWATCH_HEX: Record<string, string> = {
  white: "#f2f2f2",
  black: "#1a1a1a",
  red: "#b4332a",
  blue: "#2b4c8c",
  custom: "#999999",
};

// Halo-lit letters stand slightly off the wall so the light has somewhere to spill.
const WALL_GAP = 0.08;
// Pushed above 1.0 so the glow reads as a light source and feeds the bloom.
const HALO_COLOR = new THREE.Color("#ffe9c4").multiplyScalar(2);

interface TrimlessSceneProps {
  shapes: THREE.Shape[];
  config: TrimlessConfig;
}

export default function TrimlessScene({ shapes, config }: TrimlessSceneProps) {
  const geometry = useSignGeometry(shapes, DEPTH_RATIOS[config.depth]);
  const isNight = config.dayNight === "night";
  const showBacking = config.illumination === "halo-lit" || config.illumination === "dual-lit";
  const faceGlows = isNight && (config.illumination === "face-lit" || config.illumination === "dual-lit");
  const haloGlows = isNight && showBacking;
  const bloomActive = faceGlows || haloGlows;

  // material-0 = front/back caps = the face; material-1 = extruded sides =
  // the returns — this mapping is ExtrudeGeometry's own default group
  // convention (see useSignGeometry.ts), confirmed by actually rendering it.
  const faceMaterial = (
    <meshPhysicalMaterial
      attach="material-0"
      color={SWATCH_HEX[config.faceColor]}
      metalness={0.05}
      roughness={0.45}
      emissive={faceGlows ? SWATCH_HEX[config.faceColor] : "#000000"}
      emissiveIntensity={faceGlows ? 0.7 : 0}
    />
  );

  const returnMaterial = (
    <meshPhysicalMaterial
      attach="material-1"
      color={SWATCH_HEX[config.returnColor]}
      metalness={0.6}
      roughness={0.4}
    />
  );

  return (
    <>
      <mesh geometry={geometry}>
        {returnMaterial}
        {faceMaterial}
      </mesh>

      {showBacking && <BackdropWall gap={WALL_GAP} isNight={isNight} />}

      {haloGlows && <HaloGlow shapes={shapes} z={-WALL_GAP + 0.003} color={HALO_COLOR} />}

      {bloomActive && (
        <EffectComposer>
          <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.45} luminanceSmoothing={0.3} radius={0.7} />
          {/* EffectComposer switches the renderer's tone mapping off, so re-apply it or night renders flatter than day. */}
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      )}
    </>
  );
}
