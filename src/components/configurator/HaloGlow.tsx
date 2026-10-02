import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createHaloGlow } from "./haloTexture";
import { useNightEffect } from "./NightContext";

interface HaloGlowProps {
  shapes: THREE.Shape[];
  z: number;
  color: THREE.Color;
  /** How far the light reaches around the outline, in world units. */
  spread?: number;
}

// Soft light spill on the wall around the artwork outline; fades in with the night amount.
export default function HaloGlow({ shapes, z, color, spread = 1.4 }: HaloGlowProps) {
  const glow = useMemo(() => createHaloGlow(shapes, spread), [shapes, spread]);
  useEffect(() => () => glow?.texture.dispose(), [glow]);
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  useNightEffect((n) => {
    if (material.current) material.current.opacity = n;
    if (mesh.current) mesh.current.visible = n > 0.002;
  });
  if (!glow) return null;
  return (
    <mesh ref={mesh} visible={false} position={[glow.center.x, glow.center.y, z]}>
      <planeGeometry args={[glow.width, glow.height]} />
      <meshBasicMaterial ref={material} map={glow.texture} color={color} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
