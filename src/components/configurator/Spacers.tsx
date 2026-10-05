import { useMemo } from "react";
import * as THREE from "three";
import { SPACER_DIAMETER_MM, SPACER_LENGTH_MM, mmToWorld, spacerPoints } from "./spacers";

interface SpacersProps {
  shapes: THREE.Shape[];
  /** Height of the artwork in world units (stands for the nominal 12" letter). */
  height: number;
}

const VISUAL_THICKNESS = 2;

/** The clear plastic stand-off tubes between the wall and the back of the letter (z from the wall up to 0). */
export default function Spacers({ shapes, height }: SpacersProps) {
  const points = useMemo(() => spacerPoints(shapes, height), [shapes, height]);
  const length = mmToWorld(SPACER_LENGTH_MM, height);
  // Drawn about twice as thick as the real 0.4" tubes, or they would vanish at the preview's distance; the length is true.
  const radius = (mmToWorld(SPACER_DIAMETER_MM, height) / 2) * VISUAL_THICKNESS;
  const geometry = useMemo(() => new THREE.CylinderGeometry(radius, radius, length, 20, 1), [radius, length]);
  return (
    <>
      {points.map((p, i) => (
        // A cylinder runs along Y; turn it to run along Z, from the wall to the back of the letter.
        <mesh key={i} geometry={geometry} position={[p.x, p.y, -length / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <meshPhysicalMaterial color="#e8f3f5" emissive="#6f8c96" emissiveIntensity={0.35} transparent opacity={0.7} roughness={0.05} metalness={0} clearcoat={1} clearcoatRoughness={0.03} ior={1.5} />
        </mesh>
      ))}
    </>
  );
}
