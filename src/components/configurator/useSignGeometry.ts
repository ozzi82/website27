import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { Profile } from "../../data/configurations";
import { tubeRadius } from "./renderMath";

/** How much narrower the front face of a conical letter is than its base, per side, as a share of the letter height. */
const CONICAL_INSET = 0.02;
const TUBE_SEGMENTS = 8;
const CURVE_SEGMENTS = 12;

/**
 * Builds one ExtrudeGeometry from the parsed artwork shapes, with ExtrudeGeometry's own two
 * material groups: index 0 = the front and back caps (the "face"), index 1 = the extruded
 * side walls. Depth is expressed as a fraction of the combined shapes' bounding-box height
 * (see depthRatioFor), not an absolute unit, so the proportions hold whatever the artwork's
 * own scale.
 *
 * The visible letter always spans z in [0, depth] (back against the wall at z = 0), whatever
 * the profile:
 *  - flat / standard: a straight extrusion (flat is simply very thin).
 *  - conical: the widest layer sits at z = 0 and tapers to a smaller front face at z = depth.
 *    The mirrored taper below z = 0 lies behind the wall and is never seen.
 *  - tube: a heavily rounded bevel all round, approximating a neon tube. True tube and
 *    conical geometry need per-stroke offset curves that arbitrary outlines don't give us,
 *    so both are an approximation.
 */
export function useSignGeometry(
  shapes: THREE.Shape[],
  depthRatio: number,
  profile: Profile = "standard"
): THREE.ExtrudeGeometry {
  const geometry = useMemo(() => {
    // Same points ShapeGeometry would triangulate (curveSegments 12), without
    // building a throwaway geometry just to read its bounding box.
    const box = new THREE.Box2();
    for (const shape of shapes) {
      const { shape: outline, holes } = shape.extractPoints(CURVE_SEGMENTS);
      for (const p of outline) box.expandByPoint(p);
      for (const hole of holes) for (const p of hole) box.expandByPoint(p);
    }
    const height = box.max.y - box.min.y || 1;
    const depth = height * depthRatio;

    // Deliberately NOT calling clearGroups()/addGroup(): ExtrudeGeometry already emits one
    // cap+side group pair per Shape (an earlier hand-rolled boundary produced a single pair
    // of overlapping groups, i.e. no face/side split, for every shape count). With a bevel
    // the bevel layers are part of the side group (1), so the face stays material 0.
    if (profile === "conical") {
      const inset = height * CONICAL_INSET;
      const flatPart = depth * 0.001;
      return new THREE.ExtrudeGeometry(shapes, {
        depth: flatPart,
        bevelEnabled: true,
        bevelThickness: depth - flatPart,
        bevelSize: inset,
        bevelOffset: -inset,
        bevelSegments: 1,
        curveSegments: CURVE_SEGMENTS,
      });
    }

    if (profile === "tube") {
      const r = tubeRadius(depth, height);
      const extruded = new THREE.ExtrudeGeometry(shapes, {
        depth: Math.max(depth - 2 * r, depth * 0.001),
        bevelEnabled: true,
        bevelThickness: r,
        bevelSize: r,
        bevelOffset: -r,
        bevelSegments: TUBE_SEGMENTS,
        curveSegments: CURVE_SEGMENTS,
      });
      extruded.translate(0, 0, r); // bevel runs from z = -r; bring the back to the wall plane
      return extruded;
    }

    return new THREE.ExtrudeGeometry(shapes, {
      depth,
      bevelEnabled: false,
      curveSegments: CURVE_SEGMENTS,
    });
  }, [shapes, depthRatio, profile]);

  // Free GPU buffers when the geometry is replaced or the scene unmounts.
  // Safe under StrictMode: dispose() only releases GPU resources, and three
  // re-uploads them if the same geometry renders again.
  useEffect(() => () => geometry.dispose(), [geometry]);

  return geometry;
}
