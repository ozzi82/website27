import { useEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import CameraRig, { type CameraApi } from "./CameraRig";
import ConfigScene from "./ConfigScene";
import PreviewFrame from "./PreviewFrame";
import { HOME_POSITION } from "./cameraMath";
import { NightProvider, useNightEffect } from "./NightContext";
import { getBackground, type BackgroundDef } from "./backgrounds";
import { makeWallLook, wallLookAt } from "./wallLook";
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
  hideHint?: boolean;
  /** Photo render requested from the current view. */
  onRender?: (pose: { position: [number, number, number]; target: [number, number, number] }) => void;
  /** Desktop: a floating bar over the preview, given the camera commands. */
  renderBar?: (api: { zoomIn: () => void; zoomOut: () => void; reset: () => void }) => ReactNode;
}

// Hoisted so the props are referentially stable across re-renders (a fresh
// camera/args object each render makes r3f re-apply them).
const CAMERA = { position: HOME_POSITION, fov: 35, near: 0.03, far: 80 };
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
      {/* The key light casts the letters' shadow onto the wall: the contact shadow that makes a sign look mounted, not pasted. */}
      <directionalLight
        ref={directional}
        position={[3, 5, 4]}
        intensity={0.35}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-camera-near={0.5}
        shadow-camera-far={18}
        shadow-bias={-0.0004}
        shadow-normalBias={0.004}
      />
      {/* Always mounted (intensity 0 when off): adding/removing a light recompiles every material. */}
      <pointLight ref={point} position={[-1.8, 1.5, 1.8]} intensity={9} />
      <Environment files="/configurator/studio.hdr" />
    </>
  );
}

/** Resolves to a large JPEG data URL of the current view (rendered at a higher pixel ratio), or null. */
export type RenderHiRes = () => Promise<string | null>;

const HIRES_WIDTH = 2800;
const HIRES_SETTLE_FRAMES = 4;

/**
 * Renders the current view at ~2800 px wide: raises the pixel ratio, waits a few frames for the composer and
 * shadow map to settle, reads the frame, then restores the live resolution.
 */
export function HiResBridge({ renderRef }: { renderRef: MutableRefObject<RenderHiRes | null> }) {
  const gl = useThree((s) => s.gl);
  const setDpr = useThree((s) => s.setDpr);
  const job = useRef<{ frames: number; prevDpr: number; done: (url: string | null) => void } | null>(null);

  useFrame(() => {
    const j = job.current;
    if (!j) return;
    if (j.frames-- > 0) return;
    job.current = null;
    let url: string | null = null;
    try {
      url = gl.domElement.toDataURL("image/jpeg", 0.92);
    } catch {
      url = null;
    }
    setDpr(j.prevDpr);
    j.done(url);
  }, 2);

  useEffect(() => {
    renderRef.current = () =>
      new Promise((resolve) => {
        if (job.current) return resolve(null);
        const el = gl.domElement;
        const prevDpr = gl.getPixelRatio();
        const cssWidth = el.clientWidth || el.width / prevDpr;
        const maxPx = Math.min(HIRES_WIDTH, gl.capabilities.maxTextureSize);
        const target = Math.max(prevDpr, maxPx / cssWidth);
        const timer = setTimeout(() => {
          if (job.current) {
            setDpr(job.current.prevDpr);
            job.current = null;
          }
          resolve(null);
        }, 8000);
        job.current = {
          frames: HIRES_SETTLE_FRAMES,
          prevDpr,
          done: (url) => {
            clearTimeout(timer);
            resolve(url);
          },
        };
        setDpr(target);
      });
    return () => {
      renderRef.current = null;
    };
  }, [renderRef, gl, setDpr]);

  return null;
}

const SNAPSHOT_WIDTH = 720;

/** Downscales the WebGL canvas into a small JPEG. Must run in the same task as the render that filled the drawing buffer. */
function snapshotOf(source: HTMLCanvasElement, width = SNAPSHOT_WIDTH, quality = 0.85): string | null {
  if (!source.width || !source.height) return null;
  const out = document.createElement("canvas");
  out.width = width;
  out.height = Math.max(1, Math.round((width * source.height) / source.width));
  const ctx = out.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, out.width, out.height);
  return out.toDataURL("image/jpeg", quality);
}

/**
 * Lets the page grab the current frame. A WebGL canvas without preserveDrawingBuffer is blank once the task that
 * rendered it ends, so the capture waits for the next frame and reads it in a frame callback that runs after the
 * composer's render (priority 2 > the composer's 1), still inside that same task.
 */
export function SnapshotBridge({ captureRef, width, quality }: { captureRef: MutableRefObject<CaptureSnapshot | null>; width?: number; quality?: number }) {
  const canvas = useThree((s) => s.gl.domElement);
  const waiting = useRef<((url: string | null) => void)[]>([]);

  useFrame(() => {
    if (waiting.current.length === 0) return;
    let url: string | null = null;
    try {
      url = snapshotOf(canvas, width, quality);
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

export default function SignPreview({ shapes, config, state, captureRef, hideHint, renderBar, onRender }: SignPreviewProps) {
  const isNight = state.dayNight === "night";
  // At night the room goes dark so the lit parts carry the picture. An unlit
  // letter (LP 1) has nothing to glow, so it keeps a dim key light and stays readable.
  const dark = emitsLight(config);

  const camera = useRef<CameraApi>(null);
  const hiRes = useRef<RenderHiRes | null>(null);

  // The busy state lives in PreviewFrame: re-rendering this component would make r3f reset the pixel ratio mid-capture.
  async function download() {
    const url = await hiRes.current?.();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `sunlite-sign-${isNight ? "night" : "day"}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <PreviewFrame
      onZoomIn={() => camera.current?.zoomIn()}
      onZoomOut={() => camera.current?.zoomOut()}
      onReset={() => camera.current?.reset()}
      onRotate={(dTheta, dPhi) => camera.current?.rotate(dTheta, dPhi)}
      onDownload={download}
      hideHint={hideHint}
      onRender={onRender ? () => camera.current && onRender(camera.current.getPose()) : undefined}
      hideControls={Boolean(renderBar)}
      bar={renderBar?.({ zoomIn: () => camera.current?.zoomIn(), zoomOut: () => camera.current?.zoomOut(), reset: () => camera.current?.reset() })}
    >
      <Canvas shadows camera={CAMERA} dpr={DPR}>
        <NightProvider isNight={isNight}>
          <SceneAtmosphere dark={dark} background={getBackground(state.background)} />
          <ConfigScene shapes={shapes} config={config} state={state} />
          <CameraRig ref={camera} />
          {captureRef && <SnapshotBridge captureRef={captureRef} />}
          <HiResBridge renderRef={hiRes} />
        </NightProvider>
      </Canvas>
    </PreviewFrame>
  );
}
