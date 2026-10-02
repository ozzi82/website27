import { useMemo, useRef } from "react";
import * as THREE from "three";
import { getBackground, makeWallLook, wallLookAt } from "./backgrounds";
import { useNightEffect } from "./NightContext";

interface BackdropWallProps {
  gap: number;
}

// Oversized so its edges stay out of frame from the fixed camera — a smaller
// plane reads as a floating card.
export default function BackdropWall({ gap }: BackdropWallProps) {
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const look = useMemo(makeWallLook, []);
  const background = getBackground("concrete");
  useNightEffect((n) => {
    const m = material.current;
    if (!m) return;
    wallLookAt(background, n, look);
    m.color.copy(look.color);
    m.emissive.copy(look.emissive);
    m.emissiveIntensity = look.emissiveIntensity;
  });
  return (
    <mesh position={[0, 0, -gap]}>
      <planeGeometry args={[16, 10]} />
      <meshStandardMaterial ref={material} roughness={0.9} />
    </mesh>
  );
}
