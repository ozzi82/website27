import { useMemo, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import CameraRig, { type CameraApi } from "./CameraRig";
import ConfigScene from "./ConfigScene";
import PreviewFrame from "./PreviewFrame";
import { HOME_POSITION } from "./cameraMath";
import { NightProvider, useNightEffect } from "./NightContext";
import { getBackground, makeWallLook, wallLookAt, type BackgroundDef } from "./backgrounds";
import { atmosphereFor } from "./nightFade";
import { emitsLight, type ConfiguratorState } from "./types";
import type { LightConfig } from "../../data/configurations";

interface SignPreviewProps {
  shapes: THREE.Shape[];
  config: LightConfig;
  state: ConfiguratorState;
}

// Hoisted so the props are referentially stable across re-renders (a fresh
// camera/args object each render makes r3f re-apply them).
const CAMERA = { position: HOME_POSITION, fov: 35 };
const DPR: [number, number] = [1, 1.5]; // cap pixel ratio: 3x displays would push SwiftShader/low-end GPUs hard

/** Lights, environment and the colour behind the wall, all following the day/night fade. */
function SceneAtmosphere({ dark, background }: { dark: boolean; background: BackgroundDef }) {
  const ambient = useRef<THREE.AmbientLight>(null);
  const directional = useRef<THREE.DirectionalLight>(null);
  const point = useRef<THREE.PointLight>(null);
  const backdrop = useRef<THREE.Color>(null);
  const scene = useThree((s) => s.scene);
  const look = useMemo(makeWallLook, []);

  useNightEffect((n) => {
    const a = atmosphereFor(n, dark);
    if (ambient.current) ambient.current.intensity = a.ambient;
    if (directional.current) directional.current.intensity = a.directional;
    if (point.current) point.current.intensity = a.point;
    scene.environmentIntensity = a.environment;
    wallLookAt(background, n, look);
    backdrop.current?.copy(look.scene);
  });

  return (
    <>
      {/* Explicit background: the canvas is otherwise transparent, and the bloom pass lets the page behind it bleed through as a grey haze. */}
      <color ref={backdrop} attach="background" args={["#2b3242"]} />
      <ambientLight ref={ambient} intensity={0.04} />
      <directionalLight ref={directional} position={[3, 5, 4]} intensity={0.35} />
      {/* Always mounted (intensity 0 when off): adding/removing a light recompiles every material. */}
      <pointLight ref={point} position={[-1.8, 1.5, 1.8]} intensity={9} />
      <Environment files="/configurator/studio.hdr" />
    </>
  );
}

export default function SignPreview({ shapes, config, state }: SignPreviewProps) {
  const isNight = state.dayNight === "night";
  // At night the room goes dark so the lit parts carry the picture. An unlit
  // letter (LP 1) has nothing to glow, so it keeps a dim key light and stays readable.
  const dark = emitsLight(config);

  const camera = useRef<CameraApi>(null);

  return (
    <PreviewFrame
      onZoomIn={() => camera.current?.zoomIn()}
      onZoomOut={() => camera.current?.zoomOut()}
      onReset={() => camera.current?.reset()}
      onRotate={(dTheta, dPhi) => camera.current?.rotate(dTheta, dPhi)}
    >
      <Canvas camera={CAMERA} dpr={DPR}>
        <NightProvider isNight={isNight}>
          <SceneAtmosphere dark={dark} background={getBackground(state.background)} />
          <ConfigScene shapes={shapes} config={config} state={state} />
          <CameraRig ref={camera} />
        </NightProvider>
      </Canvas>
    </PreviewFrame>
  );
}
