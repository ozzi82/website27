import { useMemo } from "react";
import * as THREE from "three";
import type { LightConfig } from "../../data/configurations";
import { useSignGeometry } from "./useSignGeometry";
import HaloGlow from "./HaloGlow";
import BackdropWall from "./BackdropWall";
import NightEffects from "./NightEffects";
import { getBackground } from "./backgrounds";
import { useWallTexture } from "./useWallTexture";
import { GlowMaterial, PaintedMaterial, SideLitMaterial } from "./SceneMaterials";
import { depthRatioFor, litBandThickness, wallGapFor } from "./renderMath";
import { brightnessFactor } from "./brightness";
import { emitsLight, type ConfiguratorState } from "./types";
import Lp1Material from "./Lp1Material";
import { isLp1 } from "./lp1Materials";
import Spacers from "./Spacers";
import { glowParts, type WallSpill } from "./glowParts";

interface ConfigSceneProps {
  shapes: THREE.Shape[];
  config: LightConfig;
  state: ConfiguratorState;
  /** Mount the sign on a fascia panel this wide (world units) instead of an endless wall. */
  facadeWidth?: number;
}

// Light on the wall behind the letter, by how it gets there (see WallSpill). `scale` is pushed above 1 so it reads as
// light and feeds the bloom; `spread` is its reach around the outline in world units.
const WALL_SPILL: Record<Exclude<WallSpill, "none">, { scale: number; spread: number }> = {
  standoff: { scale: 1.1, spread: 1.5 },
  flush: { scale: 1.5, spread: 0.6 },
};

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
  const background = getBackground(state.background);
  const wall = useWallTexture(background.id);
  return (
    <>
      <BackdropWall gap={wallGapFor(state.mounting)} background={background} wall={wall} />
      <NightEffects lit={emitsLight(config)} level={brightnessFactor(state.brightness)} />
    </>
  );
}

function SignScene({ shapes, config, state, facadeWidth }: ConfigSceneProps) {
  const { light, profile } = config;
  const geometry = useSignGeometry(shapes, depthRatioFor(state.depthMm), profile);

  // Real extents of the built geometry (the visible letter spans z in [0, depth]).
  const { depth, height } = useMemo(() => {
    geometry.computeBoundingBox();
    const bb = geometry.boundingBox!;
    return { depth: bb.max.z, height: bb.max.y - bb.min.y };
  }, [geometry]);

  const background = getBackground(state.background);
  const wall = useWallTexture(background.id);
  const gap = wallGapFor(state.mounting, height);
  const lit = emitsLight(config);
  const level = brightnessFactor(state.brightness);
  const glowColor = useMemo(() => new THREE.Color(state.glowColor), [state.glowColor]);
  const parts = glowParts(light, profile, state.mounting);
  const band = litBandThickness(depth, height, parts.sideBand ?? undefined);
  const spill = WALL_SPILL[parts.wallSpill === "none" ? "flush" : parts.wallSpill];
  const haloColor = useMemo(() => glowColor.clone().multiplyScalar(spill.scale), [glowColor, spill]);

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
      <mesh key={config.id} geometry={geometry}>
        {sides}
        {face}
      </mesh>

      <BackdropWall gap={gap} background={background} wall={wall} size={facadeWidth ? { w: facadeWidth, h: Math.max(2.2, height + 1.3) } : undefined} />
      {state.mounting === "standoff" && <Spacers shapes={shapes} height={height} />}

      {wallSpill && (
        <HaloGlow shapes={shapes} z={-gap + 0.003} color={haloColor} spread={spill.spread} background={background} wall={wall} level={level} />
      )}

      <NightEffects lit={lit} level={level} />
    </>
  );
}
