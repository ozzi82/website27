import { useEffect, useMemo, useState } from "react";
import { useThree } from "@react-three/fiber";
import type { BackgroundId } from "./backgrounds";
import { loadWallPhoto } from "./wallPhotos";
import { createWallTexture, type WallTexture } from "./wallTextures";

const dispose = (w: WallTexture | null) => {
  w?.texture.dispose();
  w?.normal?.dispose();
};

/**
 * The wall's material for a background: the drawn texture at once, replaced by the photographed one as soon as its
 * pictures have loaded (and kept where they cannot be loaded). Freed when the background changes or the scene unmounts.
 */
export function useWallTexture(id: BackgroundId): WallTexture | null {
  const gl = useThree((s) => s.gl);
  const anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
  const drawn = useMemo(() => createWallTexture(id, anisotropy), [id, anisotropy]);
  // Safe under StrictMode: dispose() only releases GPU memory; three re-uploads a texture that is used again.
  useEffect(() => () => dispose(drawn), [drawn]);
  const [photo, setPhoto] = useState<{ id: BackgroundId; wall: WallTexture } | null>(null);
  useEffect(() => {
    let gone = false;
    let loaded: WallTexture | null = null;
    loadWallPhoto(id, anisotropy).then(
      (wall) => {
        if (gone) return dispose(wall);
        loaded = wall;
        setPhoto({ id, wall });
      },
      () => undefined
    );
    return () => {
      gone = true;
      dispose(loaded);
    };
  }, [id, anisotropy]);
  return photo?.id === id ? photo.wall : drawn;
}
