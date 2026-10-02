import { useMemo } from "react";
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
  return useMemo(() => {
    const combined = new THREE.ShapeGeometry(shapes);
    combined.computeBoundingBox();
    const bbox = combined.boundingBox!;
    const height = bbox.max.y - bbox.min.y || 1;
    combined.dispose();

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
    const geometry = new THREE.ExtrudeGeometry(shapes, {
      depth,
      bevelEnabled: false,
      curveSegments: 12,
    });

    return geometry;
  }, [shapes, depthRatio]);
}
