import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { backingShapes, describeParts, letterShapes, type PartRole } from "../partRoles";

const square = (x: number) => new THREE.Shape([new THREE.Vector2(x, 0), new THREE.Vector2(x + 1, 0), new THREE.Vector2(x + 1, 1), new THREE.Vector2(x, 1)]);

describe("parts of an uploaded drawing", () => {
  const shapes = [square(0), square(2), square(4), square(6)];

  it("treats everything as letters until parts are marked", () => {
    expect(letterShapes(shapes, [])).toBe(shapes);
    expect(backingShapes(shapes, [])).toEqual([]);
    expect(describeParts([], 4)).toBe("");
  });

  it("keeps only letters for lighting and counting, and gives raceways and cabinets as backing", () => {
    const roles: PartRole[] = ["raceway", "letter", "vinyl", "ignore"];
    expect(letterShapes(shapes, roles)).toEqual([shapes[1]]);
    expect(backingShapes(shapes, roles)).toEqual([shapes[0]]);
    expect(describeParts(roles, 4)).toBe("1 raceway, 1 area of vinyl on the face, 1 part left out (not part of the sign)");
    expect(describeParts(["cabinet", "cabinet"], 4)).toBe("2 cabinets");
  });

});
