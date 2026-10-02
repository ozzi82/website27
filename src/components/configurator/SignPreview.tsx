import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import TrimlessScene from "./TrimlessScene";
import AcrylicScene from "./AcrylicScene";
import type { ProductConfig } from "./types";

interface SignPreviewProps {
  shapes: THREE.Shape[];
  config: ProductConfig;
}

// Hoisted so the props are referentially stable across re-renders (a fresh
// camera/args object each render makes r3f re-apply them).
const CAMERA = { position: [2.6, 1.42, 4.73] as [number, number, number], fov: 35 };
const DPR: [number, number] = [1, 1.5]; // cap pixel ratio: 3x displays would push SwiftShader/low-end GPUs hard
const NIGHT_BACKGROUND: [string] = ["#04060a"];
const DAY_BACKGROUND: [string] = ["#2b3242"];

export default function SignPreview({ shapes, config }: SignPreviewProps) {
  const isNight = config.dayNight === "night";

  return (
    <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-border bg-card">
      <Canvas camera={CAMERA} dpr={DPR}>
        {/* Explicit background: the canvas is otherwise transparent, and the night bloom pass lets the page behind it bleed through as a grey haze. */}
        <color attach="background" args={isNight ? NIGHT_BACKGROUND : DAY_BACKGROUND} />
        <ambientLight intensity={isNight ? 0.02 : 0.04} />
        <directionalLight position={[3, 5, 4]} intensity={isNight ? 0.1 : 0.35} />
        {!isNight && <pointLight position={[-1.8, 1.5, 1.8]} intensity={9} />}
        <Environment files="/configurator/studio.hdr" environmentIntensity={isNight ? 0.03 : 0.15} />
        {config.product === "trimless-letters" ? (
          <TrimlessScene shapes={shapes} config={config} />
        ) : (
          <AcrylicScene shapes={shapes} config={config} />
        )}
      </Canvas>
    </div>
  );
}
