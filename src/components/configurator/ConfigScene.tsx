import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { LightConfig } from "../../data/configurations";
import { useSignGeometry } from "./useSignGeometry";
import HaloGlow from "./HaloGlow";
import BackdropWall from "./BackdropWall";
import NightEffects from "./NightEffects";
import { backgroundAtScale, getBackground } from "./backgrounds";
import { useWallTexture } from "./useWallTexture";
import { GlowMaterial, PaintedMaterial, SideLitMaterial } from "./SceneMaterials";
import { FACE_BLOOM, FACE_HALO_BLOOM } from "./nightFade";
import { NEON_MAX_ROUND_MM, depthWorldFor, litBandThickness, wallGapFor } from "./renderMath";
import { DEFAULT_SIZE_IN, mmToWorld } from "./realSize";
import { brightnessFactor } from "./brightness";
import { emitsLight, type ConfiguratorState } from "./types";
import Lp1Material from "./Lp1Material";
import { isLp1 } from "./lp1Materials";
import Spacers from "./Spacers";
import { glowParts, type WallSpill } from "./glowParts";

interface ConfigSceneProps {
  shapes: THREE.Shape[];
  /** Raceways and cabinets of the visitor's drawing: plain painted boxes between the wall and the letters. */
  backing?: THREE.Shape[];
  /** The new configurator: the wall hides itself when the camera is behind it. */
  around?: boolean;
  /** Let the face or the sides glow softly once (a control that changes them is pointed at); `at` restarts it. */
  glow?: { surface: "face" | "sides"; at: number } | null;
  config: LightConfig;
  state: ConfiguratorState;
  /** Mount the sign on a fascia panel of this size (in the scene's own units) instead of an endless wall. */
  facade?: { width: number; height: number };
  /** Leave out the wall (and its light spill modulation): the sign is drawn over something else, such as the customer's photo. */
  bare?: boolean;
}

// Light on the wall behind the letter, by how it gets there (see WallSpill). `scale` is pushed above 1 so it reads as
// light and feeds the bloom; `spread` is its reach around the outline in world units.
const WALL_SPILL: Record<Exclude<WallSpill, "none">, { scale: number; spread: number }> = {
  standoff: { scale: 1.7, spread: 0.8 },
  flush: { scale: 4.2, spread: 0.4 },
};

// A face that already glows (LP 11-FB) only needs a tight, restrained halo: the face's own bloom does the rest, and a wide one reads as a blur.
const FACE_HALO_SPILL = { scale: 0.9, spread: 0.32 };

/**
 * One data-driven scene for all 12 configurations. What glows, where, and how
 * the letter is built all come from the configuration's `light`, `profile` and
 * `mount`; the state supplies colours, depth and size.
 */
export default function ConfigScene(props: ConfigSceneProps) {
  return props.shapes.length > 0 ? <SignScene {...props} /> : <EmptyScene {...props} />;
}

/** No artwork yet (typed text still empty): just the wall, so the 3D canvas can stay mounted instead of being rebuilt the moment text arrives. */
function EmptyScene({ config, state }: ConfigSceneProps) {
  const background = useMemo(() => backgroundAtScale(getBackground(state.background), DEFAULT_SIZE_IN / state.sizeIn), [state.background, state.sizeIn]);
  const wall = useWallTexture(background.id);
  return (
    <>
      <BackdropWall gap={wallGapFor(state.mounting, state.sizeIn)} background={background} wall={wall} />
      <NightEffects lit={emitsLight(config)} level={brightnessFactor(state.brightness)} />
    </>
  );
}

/** A raceway or cabinet: a plain dark box from the wall forward, a third of the letters' depth in front of their backs at most. */
function Backing({ shapes, gap, depth }: { shapes: THREE.Shape[]; gap: number; depth: number }) {
  const thick = Math.max(gap, depth * 0.35);
  const geometry = useMemo(() => new THREE.ExtrudeGeometry(shapes, { depth: thick, bevelEnabled: false, curveSegments: 8 }), [shapes, thick]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} position={[0, 0, -gap]} receiveShadow>
      <meshStandardMaterial color="#3f454d" roughness={0.6} metalness={0.15} />
    </mesh>
  );
}

/**
 * One soft glow, in and out, over the face or the sides: an orange veil just over the letter's own surface, so it works
 * with every material (owner, 2026-11-23: the part a control changes is shown; "the blinking is cool but too much").
 */
function PartGlow({ geometry, glow }: { geometry: THREE.BufferGeometry; glow: { surface: "face" | "sides"; at: number } }) {
  const face = useRef<THREE.MeshBasicMaterial>(null);
  const sides = useRef<THREE.MeshBasicMaterial>(null);
  const started = useRef(0);
  useEffect(() => {
    started.current = performance.now();
  }, [glow.at, glow.surface]);
  useFrame(() => {
    const t = (performance.now() - started.current) / 1400;
    const strength = t >= 0 && t < 1 ? Math.sin(Math.PI * t) * 0.22 : 0;
    if (face.current) face.current.opacity = glow.surface === "face" ? strength : 0;
    if (sides.current) sides.current.opacity = glow.surface === "sides" ? strength : 0;
  });
  const veil = { color: "#f1671c", transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, toneMapped: false } as const;
  return (
    <mesh geometry={geometry} renderOrder={4}>
      <meshBasicMaterial ref={face} attach="material-0" {...veil} />
      <meshBasicMaterial ref={sides} attach="material-1" {...veil} />
    </mesh>
  );
}

function SignScene({ shapes, backing, config, state, facade, bare, around, glow }: ConfigSceneProps) {
  const { light, profile } = config;
  const { sizeIn } = state;
  const geometry = useSignGeometry(shapes, depthWorldFor(state.depthMm, sizeIn), profile, mmToWorld(NEON_MAX_ROUND_MM, sizeIn));

  // Real extents of the built geometry (the visible letter spans z in [0, depth]).
  const { depth, height } = useMemo(() => {
    geometry.computeBoundingBox();
    const bb = geometry.boundingBox!;
    return { depth: bb.max.z, height: bb.max.y - bb.min.y };
  }, [geometry]);

  const background = useMemo(() => backgroundAtScale(getBackground(state.background), DEFAULT_SIZE_IN / sizeIn), [state.background, sizeIn]);
  const wall = useWallTexture(background.id);
  const gap = wallGapFor(state.mounting, sizeIn);
  const lit = emitsLight(config);
  const level = brightnessFactor(state.brightness);
  const glowColor = useMemo(() => new THREE.Color(state.glowColor), [state.glowColor]);
  const parts = glowParts(light, profile, state.mounting);
  const band = litBandThickness(depth, sizeIn, parts.sideBand ?? undefined);
  const spill = parts.face && parts.wallSpill !== "none" ? FACE_HALO_SPILL : WALL_SPILL[parts.wallSpill === "none" ? "flush" : parts.wallSpill];
  const haloColor = useMemo(() => glowColor.clone().multiplyScalar(spill.scale), [glowColor, spill]);
  // The light's reach on the wall is a distance in millimetres, so it is a bigger share of a small sign and a smaller one of a large sign.
  const haloSpread = Math.min(5, Math.max(0.1, spill.spread * (DEFAULT_SIZE_IN / sizeIn)));

  // material-0 = front/back caps = the face; material-1 = extruded sides —
  // ExtrudeGeometry's own default group convention (see useSignGeometry.ts).
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
  ) : parts.side !== "none" ? (
      <SideLitMaterial
        attach="material-1"
        color={state.color}
        glow={state.glowColor}
        mode={parts.side}
        band={band}
        depth={depth}
        level={level}
      />
    ) : (
      <PaintedMaterial attach="material-1" color={state.color} />
    );

  const wallSpill = parts.wallSpill !== "none";

  return (
    <>
      <mesh key={config.id} geometry={geometry} castShadow>
        {sides}
        {face}
      </mesh>

      {glow ? <PartGlow geometry={geometry} glow={glow} /> : null}
      {backing?.length ? <Backing shapes={backing} gap={gap} depth={depth} /> : null}

      {!bare && <BackdropWall gap={gap} background={background} wall={wall} hideFromBehind={around} size={facade ? { w: facade.width, h: facade.height } : undefined} />}
      {state.mounting === "standoff" && <Spacers shapes={shapes} height={height} sizeIn={sizeIn} />}

      {wallSpill && (
        <HaloGlow shapes={shapes} z={-gap + 0.003} color={haloColor} spread={haloSpread} background={background} wall={wall} level={level} />
      )}

      <NightEffects lit={lit} level={level} bloom={parts.face ? (wallSpill ? FACE_HALO_BLOOM : FACE_BLOOM) : undefined} />
    </>
  );
}
