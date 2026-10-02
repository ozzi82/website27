import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useSignGeometry } from "./useSignGeometry";
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

interface TrimlessSceneProps {
  shapes: THREE.Shape[];
  config: TrimlessConfig;
}

function TrimlessScene({ shapes, config }: TrimlessSceneProps) {
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
      metalness={0.1}
      roughness={0.3}
      emissive={faceGlows ? SWATCH_HEX[config.faceColor] : "#000000"}
      emissiveIntensity={faceGlows ? 1.5 : 0}
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

      {showBacking && (
        <mesh position={[0, 0, -0.5]}>
          <planeGeometry args={[4, 4]} />
          <meshStandardMaterial color="#e8e8e8" />
        </mesh>
      )}

      {haloGlows && (
        <pointLight position={[0, 0, -0.3]} intensity={3} distance={3} color="#fff4e0" />
      )}

      {bloomActive && (
        <EffectComposer>
          <Bloom intensity={0.8} luminanceThreshold={0.4} luminanceSmoothing={0.2} />
        </EffectComposer>
      )}
    </>
  );
}

interface SignPreviewProps {
  shapes: THREE.Shape[];
  config: TrimlessConfig;
}

export default function SignPreview({ shapes, config }: SignPreviewProps) {
  const isNight = config.dayNight === "night";

  return (
    <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-border bg-card">
      <Canvas camera={{ position: [2.2, 1.2, 4], fov: 35 }}>
        <ambientLight intensity={isNight ? 0.15 : 0.6} />
        <directionalLight position={[3, 5, 2]} intensity={isNight ? 0.3 : 1} />
        <Environment files="/configurator/studio.hdr" />
        <TrimlessScene shapes={shapes} config={config} />
      </Canvas>
    </div>
  );
}
