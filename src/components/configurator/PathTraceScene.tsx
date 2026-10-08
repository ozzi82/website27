import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { GradientEquirectTexture } from "three-gpu-pathtracer";
import type { LightConfig } from "../../data/configurations";
import { backgroundAtScale, getBackground } from "./backgrounds";
import { brightnessFactor } from "./brightness";
import { createHaloGlow } from "./haloTexture";
import Lp1Material from "./Lp1Material";
import { NightProvider } from "./NightContext";
import { DEFAULT_SIZE_IN, mmToWorld } from "./realSize";
import { NEON_MAX_ROUND_MM, depthWorldFor, wallGapFor } from "./renderMath";
import { GlowMaterial, PaintedMaterial } from "./SceneMaterials";
import { glowParts } from "./glowParts";
import { emitsLight, type ConfiguratorState } from "./types";
import { isLp1 } from "./lp1Materials";
import { useSignGeometry } from "./useSignGeometry";
import { useWallTexture } from "./useWallTexture";

export interface RenderPose {
  position: [number, number, number];
  target: [number, number, number];
}

interface PathTraceSceneProps {
  shapes: THREE.Shape[];
  config: LightConfig;
  state: ConfiguratorState;
  pose: RenderPose;
  /** Called once the environment and every texture are in place, so the path tracer can read the scene. */
  onReady: () => void;
}

const WALL = { w: 40, h: 24 };
/** Light spilled on the wall by the halo, in emissive strength (the preview pushes its spill above 1 for the same reason). */
const HALO_EMISSION = 2.4;

/**
 * The same sign and wall as the live preview, rebuilt from plain physical materials so a path tracer can light it properly:
 * the surroundings come from an image-based environment, the letters throw real shadows, and glow is genuine emitted light.
 */
export default function PathTraceScene({ shapes, config, state, pose, onReady }: PathTraceSceneProps) {
  const { scene, camera } = useThree();
  const night = state.dayNight === "night";
  const { light, profile } = config;
  const { sizeIn } = state;
  const geometry = useSignGeometry(shapes, depthWorldFor(state.depthMm, sizeIn), profile, mmToWorld(NEON_MAX_ROUND_MM, sizeIn));
  const background = useMemo(() => backgroundAtScale(getBackground(state.background), DEFAULT_SIZE_IN / sizeIn), [state.background, sizeIn]);
  const wall = useWallTexture(background.id);
  const gap = wallGapFor(state.mounting, sizeIn);
  const parts = glowParts(light, profile, state.mounting);
  const level = brightnessFactor(state.brightness);
  const lit = emitsLight(config);
  const glow = useMemo(() => new THREE.Color(state.glowColor), [state.glowColor]);

  // Camera: where the visitor was looking from.
  useEffect(() => {
    camera.position.set(...pose.position);
    camera.lookAt(...pose.target);
    camera.updateMatrixWorld();
  }, [camera, pose]);

  // Environment: the studio HDR by day, a dark sky by night. Signalled ready once it is loaded.
  useEffect(() => {
    let cancelled = false;
    scene.background = new THREE.Color(night ? "#05070d" : "#2b3242");
    if (night) {
      const sky = new GradientEquirectTexture();
      sky.topColor.set("#0b1222");
      sky.bottomColor.set("#05070c");
      sky.update();
      scene.environment = sky;
      scene.environmentIntensity = 1;
      onReady();
      return () => {
        sky.dispose();
        scene.environment = null;
      };
    }
    let hdr: THREE.Texture | null = null;
    new RGBELoader().load("/configurator/studio.hdr", (tex) => {
      if (cancelled) return tex.dispose();
      tex.mapping = THREE.EquirectangularReflectionMapping;
      hdr = tex;
      scene.environment = tex;
      scene.environmentIntensity = 2.2;
      onReady();
    });
    return () => {
      cancelled = true;
      hdr?.dispose();
      scene.environment = null;
    };
    // onReady is stable by contract
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, night]);

  // The wall: the same procedural texture, tiled to the real-size tile of the chosen wall.
  const wallMap = useMemo(() => {
    if (!wall) return null;
    const t = wall.texture.clone();
    t.repeat.set(WALL.w / background.tile.w, WALL.h / background.tile.h);
    t.updateMatrix(); // the path tracer reads the matrix directly
    t.needsUpdate = true;
    return t;
  }, [wall, background.tile.w, background.tile.h]);
  useEffect(() => () => wallMap?.dispose(), [wallMap]);

  // Halo: light spilling on the wall around the letters, as an emissive plane that only shows where the glow is.
  const spread = Math.min(5, Math.max(0.1, (parts.face ? 0.32 : parts.wallSpill === "standoff" ? 0.8 : 0.4) * (DEFAULT_SIZE_IN / sizeIn)));
  const halo = useMemo(() => (lit && parts.wallSpill !== "none" ? createHaloGlow(shapes, spread) : null), [lit, parts.wallSpill, shapes, spread]);
  useEffect(
    () => () => {
      halo?.texture.dispose();
      halo?.alphaTexture.dispose();
    },
    [halo]
  );

  const flat = isLp1(config);
  const face = flat ? (
    <Lp1Material attach="material-0" finish={state.finish} color={state.color} part="front" />
  ) : parts.face ? (
    <GlowMaterial attach="material-0" glow={state.glowColor} level={level} />
  ) : (
    <PaintedMaterial attach="material-0" color={state.color} />
  );
  const sides = flat ? (
    <Lp1Material attach="material-1" finish={state.finish} color={state.color} part="side" />
  ) : parts.side !== "none" && night ? (
    <meshPhysicalMaterial attach="material-1" color={state.color} emissive={glow} emissiveIntensity={1.4 * level} roughness={0.4} metalness={0} />
  ) : (
    <PaintedMaterial attach="material-1" color={state.color} />
  );

  return (
    <NightProvider isNight={night}>
      <mesh position={[0, 0, -gap]}>
        <planeGeometry args={[WALL.w, WALL.h]} />
        <meshStandardMaterial map={wallMap ?? undefined} color={wallMap ? "#ffffff" : background.day.color} roughness={0.92} metalness={0} />
      </mesh>
      <mesh geometry={geometry}>
        {sides}
        {face}
      </mesh>
      {night && halo && (
        <mesh position={[halo.center.x, halo.center.y, -gap + 0.004]}>
          <planeGeometry args={[halo.width, halo.height]} />
          <meshStandardMaterial
            color="#000000"
            emissive={glow}
            emissiveIntensity={HALO_EMISSION * level}
            alphaMap={halo.alphaTexture}
            transparent
            roughness={1}
            metalness={0}
          />
        </mesh>
      )}
    </NightProvider>
  );
}
