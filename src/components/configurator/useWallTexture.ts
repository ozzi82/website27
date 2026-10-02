import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import type { BackgroundId } from "./backgrounds";
import { createWallTexture, type WallTexture } from "./wallTextures";

/** The procedural wall texture for a background, freed when the background changes or the scene unmounts. */
export function useWallTexture(id: BackgroundId): WallTexture | null {
  const gl = useThree((s) => s.gl);
  const wall = useMemo(() => createWallTexture(id, Math.min(8, gl.capabilities.getMaxAnisotropy())), [id, gl]);
  // Safe under StrictMode: dispose() only releases GPU memory; three re-uploads a texture that is used again.
  useEffect(() => () => wall?.texture.dispose(), [wall]);
  return wall;
}
