import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { BackgroundDef } from "./backgrounds";
import { makeWallLook, wallLookAt } from "./wallLook";
import { useNightEffect } from "./NightContext";
import type { WallTexture } from "./wallTextures";

interface BackdropWallProps {
  gap: number;
  background: BackgroundDef;
  wall: WallTexture | null;
  /** Panel size in world units; the default is a wall big enough to fill any view. */
  size?: { w: number; h: number };
}

/** World size of the wall. */
export const WALL_SIZE = { w: 120, h: 60 };

// Big enough that its edges stay out of frame even when the camera is orbited and
// zoomed out; a smaller plane reads as a floating card. The texture tiles across it,
// with a tile centred on the origin so tile seams never cross the artwork.
export default function BackdropWall({ gap, background, wall, size = WALL_SIZE }: BackdropWallProps) {
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const look = useMemo(makeWallLook, []);
  const { tile } = background;

  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(size.w, size.h);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (uv.getX(i) - 0.5) * (size.w / tile.w) + 0.5, (uv.getY(i) - 0.5) * (size.h / tile.h) + 0.5);
    }
    return g;
  }, [tile.w, tile.h, size.w, size.h]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useNightEffect((n) => {
    const m = material.current;
    if (!m) return;
    wallLookAt(background, n, look);
    m.color.copy(look.color);
    m.emissive.copy(look.emissive);
    m.emissiveIntensity = look.emissiveIntensity;
  });

  const map = wall?.texture;
  return (
    <mesh position={[0, 0, -gap]} geometry={geometry} receiveShadow>
      {/* The same canvas serves as colour, relief and (faintly) self-lit texture, so the wall keeps its character in the dark. */}
      <meshStandardMaterial
        ref={material}
        map={map}
        bumpMap={map}
        bumpScale={background.day.bumpScale}
        emissiveMap={map}
        roughness={background.day.roughness}
      />
    </mesh>
  );
}
