import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { createHaloGlow } from "./haloTexture";

interface HaloGlowProps {
  shapes: THREE.Shape[];
  z: number;
  color: THREE.Color;
  /** How far the light reaches around the outline, in world units. */
  spread?: number;
}

// Soft light spill on the wall around the artwork outline (night only).
export default function HaloGlow({ shapes, z, color, spread = 1.4 }: HaloGlowProps) {
  const glow = useMemo(() => createHaloGlow(shapes, spread), [shapes, spread]);
  useEffect(() => () => glow?.texture.dispose(), [glow]);
  if (!glow) return null;
  return (
    <mesh position={[glow.center.x, glow.center.y, z]}>
      <planeGeometry args={[glow.width, glow.height]} />
      <meshBasicMaterial map={glow.texture} color={color} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
