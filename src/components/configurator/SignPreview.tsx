import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import ConfigScene from "./ConfigScene";
import { emitsLight, type ConfiguratorState } from "./types";
import type { LightConfig } from "../../data/configurations";

interface SignPreviewProps {
  shapes: THREE.Shape[];
  config: LightConfig;
  state: ConfiguratorState;
}

// Hoisted so the props are referentially stable across re-renders (a fresh
// camera/args object each render makes r3f re-apply them).
const CAMERA = { position: [2.6, 1.42, 4.73] as [number, number, number], fov: 35 };
const DPR: [number, number] = [1, 1.5]; // cap pixel ratio: 3x displays would push SwiftShader/low-end GPUs hard
const NIGHT_BACKGROUND: [string] = ["#04060a"];
const DAY_BACKGROUND: [string] = ["#2b3242"];

export default function SignPreview({ shapes, config, state }: SignPreviewProps) {
  const isNight = state.dayNight === "night";
  // At night the room goes dark so the lit parts carry the picture. An unlit
  // letter (LP 1) has nothing to glow, so it keeps a dim key light and stays readable.
  const dark = isNight && emitsLight(config);

  return (
    <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-border bg-card">
      <Canvas camera={CAMERA} dpr={DPR}>
        {/* Explicit background: the canvas is otherwise transparent, and the night bloom pass lets the page behind it bleed through as a grey haze. */}
        <color attach="background" args={isNight ? NIGHT_BACKGROUND : DAY_BACKGROUND} />
        <ambientLight intensity={dark ? 0.15 : isNight ? 0.06 : 0.04} />
        <directionalLight position={[3, 5, 4]} intensity={dark ? 0.6 : isNight ? 0.25 : 0.35} />
        {!isNight && <pointLight position={[-1.8, 1.5, 1.8]} intensity={9} />}
        {isNight && !dark && <pointLight position={[-1.8, 1.5, 1.8]} intensity={6} />}
        <Environment files="/configurator/studio.hdr" environmentIntensity={dark ? 0.05 : isNight ? 0.08 : 0.15} />
        <ConfigScene shapes={shapes} config={config} state={state} />
      </Canvas>
    </div>
  );
}
