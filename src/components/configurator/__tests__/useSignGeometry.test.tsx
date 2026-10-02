import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import * as THREE from "three";
import { useSignGeometry } from "../useSignGeometry";

// A curved outline with a hole, so the bounding height depends on bezier points.
function curvedShape(scale = 1): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0, 2 * scale, 3 * scale, 2 * scale, 3 * scale, 0);
  s.lineTo(3 * scale, -1 * scale);
  s.lineTo(0, -1 * scale);
  s.closePath();
  const hole = new THREE.Path();
  hole.moveTo(0.5 * scale, -0.2 * scale);
  hole.lineTo(1.5 * scale, -0.2 * scale);
  hole.lineTo(1.5 * scale, -0.6 * scale);
  hole.closePath();
  s.holes.push(hole);
  return s;
}

describe("useSignGeometry", () => {
  it("extrudes to depthRatio times the shapes' bounding height (same as a ShapeGeometry box)", () => {
    const shapes = [curvedShape()];
    const reference = new THREE.ShapeGeometry(shapes);
    reference.computeBoundingBox();
    const height = reference.boundingBox!.max.y - reference.boundingBox!.min.y;

    const { result } = renderHook(() => useSignGeometry(shapes, 0.25));
    result.current.computeBoundingBox();
    const bb = result.current.boundingBox!;
    expect(bb.max.z - bb.min.z).toBeCloseTo(height * 0.25, 6);
  });

  it("disposes the geometry on unmount", () => {
    const { result, unmount } = renderHook(() => useSignGeometry([curvedShape()], 0.1));
    const spy = vi.spyOn(result.current, "dispose");
    unmount();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("disposes the previous geometry when the shapes are replaced", () => {
    const first = [curvedShape()];
    const { result, rerender } = renderHook(({ s }) => useSignGeometry(s, 0.1), {
      initialProps: { s: first },
    });
    const old = result.current;
    const spy = vi.spyOn(old, "dispose");
    rerender({ s: [curvedShape(2)] });
    expect(result.current).not.toBe(old);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
