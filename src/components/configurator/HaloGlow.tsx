import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { createHaloGlow } from "./haloTexture";

interface HaloGlowProps {
  shapes: THREE.Shape[];
  z: number;
  color: THREE.Color;
}

// Soft light spill on the wall around the artwork outline (night only).
export default function HaloGlow({ shapes, z, color }: HaloGlowProps) {
  const glow = useMemo(() => createHaloGlow(shapes, 1.4), [shapes]);
  useEffect(() => () => glow?.texture.dispose(), [glow]);
  if (!glow) return null;
  return (
    <mesh position={[glow.center.x, glow.center.y, z]}>
      <planeGeometry args={[glow.width, glow.height]} />
      <meshBasicMaterial map={glow.texture} color={color} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
