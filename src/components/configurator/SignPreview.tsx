import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
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

/** Resolves to a small JPEG data URL of the current preview, or null if it could not be captured. */
export type CaptureSnapshot = () => Promise<string | null>;

interface SignPreviewProps {
  shapes: THREE.Shape[];
  config: LightConfig;
  state: ConfiguratorState;
  /** Filled with the snapshot function while the preview is mounted (used by "Get a Quote"). */
  captureRef?: MutableRefObject<CaptureSnapshot | null>;
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

const SNAPSHOT_WIDTH = 720;

/** Downscales the WebGL canvas into a small JPEG. Must run in the same task as the render that filled the drawing buffer. */
function snapshotOf(source: HTMLCanvasElement): string | null {
  if (!source.width || !source.height) return null;
  const out = document.createElement("canvas");
  out.width = SNAPSHOT_WIDTH;
  out.height = Math.max(1, Math.round((SNAPSHOT_WIDTH * source.height) / source.width));
  const ctx = out.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, out.width, out.height);
  return out.toDataURL("image/jpeg", 0.85);
}

/**
 * Lets the page grab the current frame. A WebGL canvas without preserveDrawingBuffer is blank once the task that
 * rendered it ends, so the capture waits for the next frame and reads it in a frame callback that runs after the
 * composer's render (priority 2 > the composer's 1), still inside that same task.
 */
function SnapshotBridge({ captureRef }: { captureRef: MutableRefObject<CaptureSnapshot | null> }) {
  const canvas = useThree((s) => s.gl.domElement);
  const waiting = useRef<((url: string | null) => void)[]>([]);

  useFrame(() => {
    if (waiting.current.length === 0) return;
    let url: string | null = null;
    try {
      url = snapshotOf(canvas);
    } catch {
      url = null;
    }
    for (const resolve of waiting.current.splice(0)) resolve(url);
  }, 2);

  useEffect(() => {
    captureRef.current = () =>
      new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), 2500); // a hidden tab pauses frames: never hang the click
        waiting.current.push((url) => {
          clearTimeout(timer);
          resolve(url);
        });
      });
    return () => {
      captureRef.current = null;
      for (const resolve of waiting.current.splice(0)) resolve(null);
    };
  }, [captureRef]);

  return null;
}

export default function SignPreview({ shapes, config, state, captureRef }: SignPreviewProps) {
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
          {captureRef && <SnapshotBridge captureRef={captureRef} />}
        </NightProvider>
      </Canvas>
    </PreviewFrame>
  );
}
