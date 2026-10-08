import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getMirrorEnvironment, getRoomEnvironment } from "./roomEnvironment";
import { useNightEffect } from "./NightContext";
import { lerp } from "./nightFade";
import { makeLp1Textures } from "./lp1Textures";
import type { Lp1FinishId } from "./lp1Materials";

const MIRROR = new Set<Lp1FinishId>(["mirror-gold", "mirror-rose-gold"]);
const REFLECTIVE = new Set<Lp1FinishId>(["mirror-gold", "mirror-rose-gold", "brushed-steel", "acrylic-clear", "acrylic-clear-painted", "acrylic-colored"]);

interface Lp1MaterialProps {
  attach: string;
  finish: Lp1FinishId;
  /** The visitor's paint colour: the front of clear acrylic, or the whole coloured acrylic. */
  color: string;
  /** "front" is the cap (material-0), "side" the extruded wall (material-1). */
  part: "front" | "side";
}

/**
 * PBR material of an unlit LP 1 letter. Wood, brushed steel and corten use small procedural textures; the mirror
 * and acrylics lean on a procedural studio environment for their reflections (see roomEnvironment.ts). Clear acrylic is plain
 * alpha transparency, not screen-space transmission: that costs a second render pass, which a software WebGL
 * fallback or a low-end phone cannot spare.
 */
export default function Lp1Material({ attach, finish, color, part }: Lp1MaterialProps) {
  const textures = useMemo(() => makeLp1Textures(finish), [finish]);
  useEffect(
    () => () => {
      textures.map?.dispose();
      textures.roughnessMap?.dispose();
    },
    [textures]
  );

  // The polished finishes reflect a procedural studio (see roomEnvironment.ts); in the night view the room is dark, so the
  // reflections fade down with it.
  const gl = useThree((t) => t.gl);
  const envMap = useMemo(() => (REFLECTIVE.has(finish) ? (MIRROR.has(finish) ? getMirrorEnvironment(gl) : getRoomEnvironment(gl)) : null), [finish, gl]);
  const envBase = finish === "mirror-gold" || finish === "mirror-rose-gold" ? 1 : finish === "brushed-steel" ? 1.5 : 0.4;
  const material = useRef<THREE.MeshPhysicalMaterial>(null);
  useNightEffect((n) => {
    if (material.current) material.current.envMapIntensity = lerp(envBase, envBase * 0.2, n);
  });
  const env = { ref: material, envMap, envMapIntensity: envBase } as const;

  switch (finish) {
    case "wood":
      return <meshPhysicalMaterial attach={attach} map={textures.map} color="#ffffff" roughness={0.7} metalness={0} />;
    case "mirror-gold":
      return <meshPhysicalMaterial {...env} attach={attach} color="#f0c15a" metalness={1} roughness={0.08} />;
    case "mirror-rose-gold":
      return <meshPhysicalMaterial {...env} attach={attach} color="#e8a592" metalness={1} roughness={0.08} />;
    case "brushed-steel":
      return <meshPhysicalMaterial {...env} attach={attach} map={textures.map} roughnessMap={textures.roughnessMap} color="#ffffff" metalness={1} roughness={1} />;
    case "corten":
      return <meshPhysicalMaterial attach={attach} map={textures.map} color="#ffffff" metalness={0.35} roughness={0.85} />;
    case "acrylic-clear":
      return (
        <meshPhysicalMaterial
          {...env}
          key={part}
          attach={attach}
          color={part === "side" ? "#b9e3dc" : "#e9f4f7"}
          transparent
          opacity={part === "side" ? 0.6 : 0.2}
          roughness={0.04}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.03}
          side={THREE.DoubleSide}
        />
      );
    case "acrylic-clear-painted":
      return part === "front" ? (
        <meshPhysicalMaterial {...env} key="front" attach={attach} color={color} roughness={0.14} metalness={0} clearcoat={1} clearcoatRoughness={0.05} />
      ) : (
        <meshPhysicalMaterial {...env} key="side" attach={attach} color="#b9e3dc" transparent opacity={0.6} roughness={0.04} metalness={0} clearcoat={1} clearcoatRoughness={0.03} side={THREE.DoubleSide} />
      );
    case "acrylic-colored":
      return <meshPhysicalMaterial {...env} attach={attach} color={color} roughness={0.12} metalness={0} clearcoat={1} clearcoatRoughness={0.05} />;
  }
}
