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
import { depthRatioFor, sideBandThickness, wallGapFor } from "./renderMath";
import { brightnessFactor } from "./brightness";
import { emitsLight, type ConfiguratorState } from "./types";
import { glowParts } from "./glowParts";

interface ConfigSceneProps {
  shapes: THREE.Shape[];
  config: LightConfig;
  state: ConfiguratorState;
}

// Wall halo strength (pushed above 1 so it reads as light and feeds the bloom) and reach.
const STANDOFF_HALO = { scale: 0.8, spread: 1.4 };
// Flush-mounted partial back-lit letters only leak light around the letter's edge.
const FLUSH_HALO = { scale: 1.1, spread: 0.55 };

/**
 * One data-driven scene for all 12 configurations. What glows, where, and how
 * the letter is built all come from the configuration's `light`, `profile` and
 * `mount`; the state supplies colours, depth and size.
 */
export default function ConfigScene({ shapes, config, state }: ConfigSceneProps) {
  const { light, profile, mount } = config;
  const geometry = useSignGeometry(shapes, depthRatioFor(state.depthMm), profile);

  // Real extents of the built geometry (the visible letter spans z in [0, depth]).
  const { depth, height } = useMemo(() => {
    geometry.computeBoundingBox();
    const bb = geometry.boundingBox!;
    return { depth: bb.max.z, height: bb.max.y - bb.min.y };
  }, [geometry]);

  const background = getBackground(state.background);
  const wall = useWallTexture(background.id);
  const gap = wallGapFor(mount);
  const band = sideBandThickness(depth, height);
  const lit = emitsLight(config);
  const level = brightnessFactor(state.brightness);
  const glowColor = useMemo(() => new THREE.Color(state.glowColor), [state.glowColor]);
  const parts = glowParts(light, profile);
  const spill = parts.wallSpill === "standoff" ? STANDOFF_HALO : FLUSH_HALO;
  const haloColor = useMemo(() => glowColor.clone().multiplyScalar(spill.scale), [glowColor, spill]);

  // material-0 = front/back caps = the face; material-1 = extruded sides —
  // ExtrudeGeometry's own default group convention (see useSignGeometry.ts).
  const isTube = profile === "tube";
  const face =
    parts.face ? (
      <GlowMaterial attach="material-0" glow={state.glowColor} rounded={isTube} level={level} />
    ) : (
      <PaintedMaterial attach="material-0" color={state.color} />
    );
  const sides =
    parts.side !== "none" ? (
      <SideLitMaterial
        attach="material-1"
        color={state.color}
        glow={state.glowColor}
        mode={parts.side}
        band={band}
        depth={depth}
        level={level}
      />
    ) : parts.tubeSides ? (
      // The whole tube glows, not just its front.
      <GlowMaterial attach="material-1" glow={state.glowColor} rounded level={level} />
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

      <BackdropWall gap={gap} background={background} wall={wall} />

      {wallSpill && (
        <HaloGlow shapes={shapes} z={-gap + 0.003} color={haloColor} spread={spill.spread} background={background} wall={wall} level={level} />
      )}

      <NightEffects lit={lit} level={level} />
    </>
  );
}
