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

  describe("profiles", () => {
    function boundsOf(shapes: THREE.Shape[]) {
      const g = new THREE.ShapeGeometry(shapes);
      g.computeBoundingBox();
      return g.boundingBox!;
    }

    // x extent of the vertices lying on a given z plane
    function widthAtZ(geometry: THREE.BufferGeometry, z: number) {
      const pos = geometry.attributes.position;
      let min = Infinity;
      let max = -Infinity;
      for (let i = 0; i < pos.count; i++) {
        if (Math.abs(pos.getZ(i) - z) < 1e-6) {
          min = Math.min(min, pos.getX(i));
          max = Math.max(max, pos.getX(i));
        }
      }
      return max - min;
    }

    it("treats flat like standard: a plain thin extrusion", () => {
      const shapes = [curvedShape()];
      const height = boundsOf(shapes).max.y - boundsOf(shapes).min.y;
      const { result } = renderHook(() => useSignGeometry(shapes, 0.02, "flat"));
      result.current.computeBoundingBox();
      const bb = result.current.boundingBox!;
      expect(bb.min.z).toBeCloseTo(0, 6);
      expect(bb.max.z).toBeCloseTo(height * 0.02, 6);
    });

    it("conical: front face lands at the full depth and is visibly smaller than the base", () => {
      const shapes = [curvedShape()];
      const height = boundsOf(shapes).max.y - boundsOf(shapes).min.y;
      const { result } = renderHook(() => useSignGeometry(shapes, 0.2, "conical"));
      const geometry = result.current;
      geometry.computeBoundingBox();
      const depth = height * 0.2;
      expect(geometry.boundingBox!.max.z).toBeCloseTo(depth, 6);
      const base = widthAtZ(geometry, 0);
      const front = widthAtZ(geometry, depth);
      expect(front).toBeGreaterThan(0);
      expect(front).toBeLessThan(base - 0.01);
    });

    it("conical: the taper below the wall plane is hidden behind the wall, never in front of it", () => {
      const shapes = [curvedShape()];
      const { result } = renderHook(() => useSignGeometry(shapes, 0.2, "conical"));
      result.current.computeBoundingBox();
      expect(result.current.boundingBox!.min.z).toBeLessThan(0);
    });

    it("tube: occupies exactly z in [0, depth] with a rounded (multi-segment) bevel", () => {
      const shapes = [curvedShape()];
      const height = boundsOf(shapes).max.y - boundsOf(shapes).min.y;
      const standard = renderHook(() => useSignGeometry(shapes, 0.2, "standard")).result.current;
      const { result } = renderHook(() => useSignGeometry(shapes, 0.2, "tube"));
      result.current.computeBoundingBox();
      const bb = result.current.boundingBox!;
      expect(bb.min.z).toBeCloseTo(0, 6);
      expect(bb.max.z).toBeCloseTo(height * 0.2, 6);
      expect(result.current.attributes.position.count).toBeGreaterThan(standard.attributes.position.count);
      // the front cap is inset relative to the widest part of the tube
      const front = widthAtZ(result.current, height * 0.2);
      const widest = (() => {
        const pos = result.current.attributes.position;
        let min = Infinity;
        let max = -Infinity;
        for (let i = 0; i < pos.count; i++) {
          min = Math.min(min, pos.getX(i));
          max = Math.max(max, pos.getX(i));
        }
        return max - min;
      })();
      expect(front).toBeLessThan(widest);
    });

    it("keeps ExtrudeGeometry's cap (0) and side (1) material groups for every profile", () => {
      for (const profile of ["flat", "standard", "conical", "tube"] as const) {
        const { result } = renderHook(() => useSignGeometry([curvedShape()], 0.1, profile));
        const indices = new Set(result.current.groups.map((g) => g.materialIndex));
        expect([...indices].sort()).toEqual([0, 1]);
      }
    });

    it("rebuilds (and disposes the old geometry) when the profile changes", () => {
      const shapes = [curvedShape()];
      const { result, rerender } = renderHook(({ p }) => useSignGeometry(shapes, 0.1, p), {
        initialProps: { p: "standard" as "standard" | "tube" },
      });
      const old = result.current;
      const spy = vi.spyOn(old, "dispose");
      rerender({ p: "tube" });
      expect(result.current).not.toBe(old);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
