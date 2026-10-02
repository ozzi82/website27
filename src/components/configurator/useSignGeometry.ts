import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { Profile } from "../../data/configurations";
import { conicalInset, estimateHalfStroke, tubeRadius } from "./renderMath";
import { bevelStrength } from "./strokeGuard";

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
 *  - thin artwork (see bevelStrength): conical and tube fall back to a straight extrusion.
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
    const rings = shapes.map((shape) => {
      const { shape: outline, holes } = shape.extractPoints(CURVE_SEGMENTS);
      for (const p of outline) box.expandByPoint(p);
      for (const hole of holes) for (const p of hole) box.expandByPoint(p);
      return { outline, holes };
    });
    const height = box.max.y - box.min.y || 1;
    const depth = height * depthRatio;
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

    if (profile === "tube" && rounded) {
      // Leave a sliver of straight wall so the two bevels never meet exactly.
      const r = Math.min(tubeRadius(depth, halfStroke) * strength, depth * 0.499);
      const extruded = new THREE.ExtrudeGeometry(shapes, {
        depth: depth - 2 * r,
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
