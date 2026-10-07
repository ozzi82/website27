import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { Profile } from "../../data/configurations";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { conicalInset, estimateHalfStroke, neonRoundRadius } from "./renderMath";
import { bevelStrength } from "./strokeGuard";

const TUBE_SEGMENTS = 8;
const CURVE_SEGMENTS = 12;
/** Walls turn smooth below this angle between neighbouring faces, so curved letters and the rounded edge do not facet. */
const CREASE_ANGLE = (35 * Math.PI) / 180;

/** ExtrudeGeometry shades every triangle flat; smooth the curved parts, keep the sharp corners. Keeps the material groups. */
function smoothed(geometry: THREE.ExtrudeGeometry): THREE.ExtrudeGeometry {
  return toCreasedNormals(geometry, CREASE_ANGLE) as THREE.ExtrudeGeometry;
}

/**
 * Builds one ExtrudeGeometry from the parsed artwork shapes, with ExtrudeGeometry's own two
 * material groups: index 0 = the front and back caps (the "face"), index 1 = the extruded
 * side walls. Depth is in world units (see depthWorldFor): the real millimetres at the size
 * the visitor entered, so the proportions of the letter are true.
 *
 * The visible letter always spans z in [0, depth] (back against the wall at z = 0), whatever
 * the profile:
 *  - flat / standard: a straight extrusion (flat is simply very thin).
 *  - thin artwork (see bevelStrength): conical and tube fall back to a straight extrusion.
 *  - conical: the widest layer sits at z = 0 and tapers to a smaller front face at z = depth.
 *    The mirrored taper below z = 0 lies behind the wall and is never seen.
 *  - tube (LP 11-N faux neon): only the FRONT edge is rounded, by at most 0.5" (see neonRoundRadius) and never more than
 *    half the thickness; the sides below the rounding stay straight and the back is flat against the wall. The conical
 *    profile needs per-stroke offset curves that arbitrary outlines don't give us, so it stays an approximation.
 */
export function useSignGeometry(
  shapes: THREE.Shape[],
  depth: number,
  profile: Profile = "standard",
  /** How far the faux-neon routing tool reaches (0.5"), in world units at the current size. */
  neonToolWorld = 0.012
): THREE.ExtrudeGeometry {
  const geometry = useMemo(() => {
    // Same points ShapeGeometry would triangulate (curveSegments 12), without
    // building a throwaway geometry just to read its bounding box.
    const box = new THREE.Box2();
    const rings = shapes.map((shape) => {
      const { shape: outline, holes } = shape.extractPoints(CURVE_SEGMENTS);
      for (const p of outline) box.expandByPoint(p);
      for (const hole of holes) for (const p of hole) box.expandByPoint(p);
      return { outline, holes };
    });
    const height = box.max.y - box.min.y || 1;
    // Thin art cannot carry a tube or cone profile: scale the rounding down with the stroke width and
    // fall back to a straight extrusion for hairlines, so it degrades gracefully instead of folding over.
    const halfStroke = estimateHalfStroke(rings);
    const strength = bevelStrength((2 * halfStroke) / height);
    const rounded = (profile === "conical" || profile === "tube") && strength > 0;

    // Deliberately NOT calling clearGroups()/addGroup(): ExtrudeGeometry already emits one
    // cap+side group pair per Shape (an earlier hand-rolled boundary produced a single pair
    // of overlapping groups, i.e. no face/side split, for every shape count). With a bevel
    // the bevel layers are part of the side group (1), so the face stays material 0.
    if (profile === "conical" && rounded) {
      const inset = conicalInset(height, halfStroke) * strength;
      const flatPart = depth * 0.001;
      return smoothed(
        new THREE.ExtrudeGeometry(shapes, {
          depth: flatPart,
          bevelEnabled: true,
          bevelThickness: depth - flatPart,
          bevelSize: inset,
          bevelOffset: -inset,
          bevelSegments: 1,
          curveSegments: CURVE_SEGMENTS,
        })
      );
    }

    if (profile === "tube" && rounded) {
      // The extrusion is symmetric (a bevel at both ends); the back one is squashed flat against the wall plane below,
      // so only the front edge is round.
      const r = neonRoundRadius(depth, halfStroke, neonToolWorld) * strength;
      if (r > 0) {
        const extruded = new THREE.ExtrudeGeometry(shapes, {
          depth: depth - r,
          bevelEnabled: true,
          bevelThickness: r,
          bevelSize: r,
          bevelOffset: -r,
          bevelSegments: TUBE_SEGMENTS,
          curveSegments: CURVE_SEGMENTS,
        });
        // Spans z in [-r, depth]: flatten everything behind the wall plane onto it (a flat back, no back rounding).
        const pos = extruded.attributes.position;
        for (let i = 0; i < pos.count; i++) if (pos.getZ(i) < 0) pos.setZ(i, 0);
        return smoothed(extruded);
      }
    }

    return smoothed(
      new THREE.ExtrudeGeometry(shapes, {
        depth,
        bevelEnabled: false,
        curveSegments: CURVE_SEGMENTS,
      })
    );
  }, [shapes, depth, profile, neonToolWorld]);

  // Free GPU buffers when the geometry is replaced or the scene unmounts.
  // Safe under StrictMode: dispose() only releases GPU resources, and three
  // re-uploads them if the same geometry renders again.
  useEffect(() => () => geometry.dispose(), [geometry]);

  return geometry;
}
