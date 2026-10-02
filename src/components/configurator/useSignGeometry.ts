import { useEffect, useMemo } from "react";
import * as THREE from "three";

/**
 * Builds one ExtrudeGeometry from the parsed artwork shapes, with two material
 * groups: index 0 = the extruded side walls (the "returns"), index 1 = the
 * front and back caps (the "face"). Depth is expressed as a fraction of the
 * combined shapes' bounding-box height, not an absolute unit — this keeps the
 * sign's proportions sensible regardless of the uploaded artwork's own scale,
 * since real-world inch values for Trimless's depth presets are still
 * unconfirmed (see the spec's "Trimless depth presets" section).
 */
export function useSignGeometry(shapes: THREE.Shape[], depthRatio: number): THREE.ExtrudeGeometry {
  const geometry = useMemo(() => {
    // Same points ShapeGeometry would triangulate (curveSegments 12), without
    // building a throwaway geometry just to read its bounding box.
    const box = new THREE.Box2();
    for (const shape of shapes) {
      const { shape: outline, holes } = shape.extractPoints(12);
      for (const p of outline) box.expandByPoint(p);
      for (const hole of holes) for (const p of hole) box.expandByPoint(p);
    }
    const height = box.max.y - box.min.y || 1;

    const depth = height * depthRatio;
    // Deliberately NOT calling clearGroups()/addGroup() here. ExtrudeGeometry
    // already assigns its own material groups when built from one or more
    // Shapes with bevelEnabled: false — materialIndex 0 for the front/back
    // caps, materialIndex 1 for the extruded side walls — and, critically for
    // multi-shape artwork (the normal case from parseArtwork), it emits one
    // cap+side GROUP PAIR PER SHAPE, not one global boundary for the whole
    // geometry. An earlier version of this hook tried to recompute that
    // boundary manually and was verified (by actually rendering it) to
    // produce a single pair of fully-overlapping groups covering the entire
    // geometry — i.e. no face/return split at all, for every shape count.
    // Trusting the built-in default groups, confirmed by live rendering to
    // already do this correctly, is both simpler and the thing that actually
    // works.
    const extruded = new THREE.ExtrudeGeometry(shapes, {
      depth,
      bevelEnabled: false,
      curveSegments: 12,
    });

    return extruded;
  }, [shapes, depthRatio]);

  // Free GPU buffers when the geometry is replaced or the scene unmounts.
  // Safe under StrictMode: dispose() only releases GPU resources, and three
  // re-uploads them if the same geometry renders again.
  useEffect(() => () => geometry.dispose(), [geometry]);

  return geometry;
}
