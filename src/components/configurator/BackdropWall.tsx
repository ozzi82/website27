interface BackdropWallProps {
  gap: number;
  isNight: boolean;
}

// Oversized so its edges stay out of frame from the fixed camera — a smaller
// plane reads as a floating card.
export default function BackdropWall({ gap, isNight }: BackdropWallProps) {
  return (
    <mesh position={[0, 0, -gap]}>
      <planeGeometry args={[16, 10]} />
      <meshStandardMaterial
        color={isNight ? "#2a2d33" : "#737882"}
        emissive="#15171c"
        emissiveIntensity={isNight ? 1 : 0}
        roughness={0.9}
      />
    </mesh>
  );
}
