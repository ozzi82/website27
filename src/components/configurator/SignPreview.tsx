import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import TrimlessScene from "./TrimlessScene";
import AcrylicScene from "./AcrylicScene";
import type { ProductConfig } from "./types";

interface SignPreviewProps {
  shapes: THREE.Shape[];
  config: ProductConfig;
}

export default function SignPreview({ shapes, config }: SignPreviewProps) {
  const isNight = config.dayNight === "night";

  return (
    <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-border bg-card">
      <Canvas camera={{ position: [2.2, 1.2, 4], fov: 35 }}>
        <ambientLight intensity={isNight ? 0.15 : 0.6} />
        <directionalLight position={[3, 5, 2]} intensity={isNight ? 0.3 : 1} />
        <Environment files="/configurator/studio.hdr" />
        {config.product === "trimless-letters" ? (
          <TrimlessScene shapes={shapes} config={config} />
        ) : (
          <AcrylicScene shapes={shapes} config={config} />
        )}
      </Canvas>
    </div>
  );
}
