import { describe, expect, it } from "vitest";
import { configurations } from "../../../data/configurations";
import { glowParts } from "../glowParts";

const parts = (id: string) => {
  const c = configurations.find((x) => x.id === id)!;
  return glowParts(c.light, c.profile);
};

describe("glowParts: what glows in the 3D scene", () => {
  it("LP 11-FS lights the face AND a partial band on the front side edge, flush (no wall halo)", () => {
    expect(parts("lp-11-fs-front-side-lit")).toEqual({ face: true, side: "partial-front", sideBand: null, wallSpill: "none" });
  });

  it("face, side and wall light are independent: each lighting code adds its own part", () => {
    expect(parts("lp-11-f-face-lit")).toMatchObject({ face: true, side: "none", wallSpill: "none" });
    expect(parts("lp-11-b-back-lit")).toMatchObject({ face: false, side: "none", wallSpill: "standoff" });
    expect(parts("lp-11-fb-face-halo")).toMatchObject({ face: true, side: "none", wallSpill: "standoff" });
    expect(parts("lp-11-bs-back-side-lit")).toMatchObject({ face: false, side: "partial-back", wallSpill: "flush" });
    expect(parts("lp-11-s-side-lit")).toMatchObject({ face: false, side: "full", wallSpill: "none" });
    expect(parts("lp-11-c-conical")).toMatchObject({ face: true, side: "none" });
  });

  it("the faux-neon letter lights its face and the front half of the side wall; the unlit LP 1 glows nowhere", () => {
    expect(parts("lp-11-n-faux-neon")).toMatchObject({ face: true, side: "partial-front", sideBand: 0.5 });
    expect(parts("lp-1-flat-cutout")).toEqual({ face: false, side: "none", sideBand: null, wallSpill: "none" });
  });

  it("a face glow in the data always reaches the scene (no configuration with a lit face loses it to a side band)", () => {
    for (const c of configurations) expect(glowParts(c.light, c.profile).face, c.id).toBe(c.light.face === "glow");
  });
});
