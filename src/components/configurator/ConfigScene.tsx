import { useMemo } from "react";
import * as THREE from "three";
import { ToneMappingMode } from "postprocessing";
import { EffectComposer, Bloom, ToneMapping } from "@react-three/postprocessing";
import type { LightConfig } from "../../data/configurations";
import { useSignGeometry } from "./useSignGeometry";
import HaloGlow from "./HaloGlow";
import BackdropWall from "./BackdropWall";
import { GlowMaterial, PaintedMaterial, SideLitMaterial } from "./SceneMaterials";
import { depthRatioFor, sideBandThickness, wallGapFor } from "./renderMath";
import { emitsLight, type ConfiguratorState } from "./types";

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
  const isNight = state.dayNight === "night";
  const geometry = useSignGeometry(shapes, depthRatioFor(state.depthMm), profile);

  // Real extents of the built geometry (the visible letter spans z in [0, depth]).
  const { depth, height } = useMemo(() => {
    geometry.computeBoundingBox();
    const bb = geometry.boundingBox!;
    return { depth: bb.max.z, height: bb.max.y - bb.min.y };
  }, [geometry]);

  const gap = wallGapFor(mount);
  const band = sideBandThickness(depth, height);
  const lit = emitsLight(config);
  const glowColor = useMemo(() => new THREE.Color(state.glowColor), [state.glowColor]);
  const spill = light.halo === "standoff" ? STANDOFF_HALO : FLUSH_HALO;
  const haloColor = useMemo(() => glowColor.clone().multiplyScalar(spill.scale), [glowColor, spill]);

  // material-0 = front/back caps = the face; material-1 = extruded sides —
  // ExtrudeGeometry's own default group convention (see useSignGeometry.ts).
  const isTube = profile === "tube";
  const face =
    light.face === "glow" ? (
      <GlowMaterial attach="material-0" glow={state.glowColor} isNight={isNight} rounded={isTube} />
    ) : (
      <PaintedMaterial attach="material-0" color={state.color} />
    );
  const sides =
    light.side !== "none" ? (
      <SideLitMaterial
        attach="material-1"
        color={state.color}
        glow={state.glowColor}
        isNight={isNight}
        mode={light.side}
        band={band}
        depth={depth}
      />
    ) : isTube ? (
      // The whole tube glows, not just its front.
      <GlowMaterial attach="material-1" glow={state.glowColor} isNight={isNight} rounded />
    ) : (
      <PaintedMaterial attach="material-1" color={state.color} />
    );

  const wallSpill = isNight && (light.halo === "standoff" || light.side === "partial-back");

  return (
    <>
      <mesh key={config.id} geometry={geometry}>
        {sides}
        {face}
      </mesh>

      <BackdropWall gap={gap} isNight={isNight} />

      {wallSpill && <HaloGlow shapes={shapes} z={-gap + 0.003} color={haloColor} spread={spill.spread} />}

      {isNight && lit && (
        <EffectComposer>
          <Bloom mipmapBlur intensity={0.45} luminanceThreshold={0.7} luminanceSmoothing={0.25} radius={0.6} />
          {/* EffectComposer switches the renderer's tone mapping off, so re-apply one. Neutral rather than ACES: ACES pulls saturated glows (cyan, red) toward white. */}
          <ToneMapping mode={ToneMappingMode.NEUTRAL} />
        </EffectComposer>
      )}
    </>
  );
}
