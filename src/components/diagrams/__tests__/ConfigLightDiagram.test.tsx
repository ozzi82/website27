import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { configurations } from "../../../data/configurations";
import { emitsLight } from "../../configurator/types";
import ConfigLightDiagram, { MountCompareDiagram, StandoffVsFlush, describeLight } from "../ConfigLightDiagram";

const byId = (id: string) => configurations.find((c) => c.id === id)!;

describe("ConfigLightDiagram", () => {
  it("describes each system's own light paths from its data", () => {
    expect(describeLight(byId("lp-11-f-face-lit"))).toBe("light passes through the face toward the viewer");
    expect(describeLight(byId("lp-11-b-back-lit"))).toMatch(/washes the wall behind the letter, which stands off on spacers/);
    expect(describeLight(byId("lp-11-fs-front-side-lit"))).toBe("light passes through the face toward the viewer; a band along the front edge of the side wall glows");
    expect(describeLight(byId("lp-11-n-faux-neon"))).toBe("light passes through the face toward the viewer; the front half of the side wall glows");
    expect(describeLight(byId("lp-11-s-side-lit"))).toBe("the whole side wall glows");
    expect(describeLight(byId("lp-11-bs-back-side-lit"))).toBe("a band along the back edge of the side wall glows");
  });

  it("draws every lit system, with a text alternative, and animates rays and glows", () => {
    for (const c of configurations.filter(emitsLight)) {
      const { container, unmount } = render(<ConfigLightDiagram config={c} />);
      const svg = container.querySelector("svg")!;
      expect(svg.getAttribute("role")).toBe("img");
      expect(svg.getAttribute("aria-label"), c.id).toContain(c.code);
      expect(container.querySelectorAll(".ld-ray").length, c.id).toBeGreaterThan(0);
      expect(container.querySelectorAll(".ld-glow").length, c.id).toBeGreaterThan(0);
      unmount();
    }
  });

  it("shows the lit side band only where the data has one", () => {
    const rays = (id: string) => render(<ConfigLightDiagram config={byId(id)} />).container.querySelectorAll(".ld-ray").length;
    expect(rays("lp-11-s-side-lit")).toBe(2); // up and down from the lit side wall, nothing through the face
    expect(rays("lp-11-f-face-lit")).toBe(3); // three rays through the face
  });

  it("explains standoff versus flush mount with one drawing and one caption each", () => {
    const { container } = render(<StandoffVsFlush />);
    expect([...container.querySelectorAll("[data-diagram]")].map((d) => d.getAttribute("data-diagram"))).toEqual(["mount-standoff", "mount-flush"]);
    expect(container.textContent).toMatch(/floats off the wall on spacers/);
    expect(container.textContent).toMatch(/sits against the wall/);
    expect(render(<MountCompareDiagram kind="flush" />).container.textContent).toContain("NO GAP");
  });

  it("stops every animation for visitors who prefer reduced motion", () => {
    const css = fs.readFileSync(path.resolve(__dirname, "../../../index.css"), "utf8");
    const block = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce) {\n  .ld-ray"));
    expect(block).toMatch(/\.ld-ray,\s*\.ld-glow\s*\{\s*animation: none;/);
  });
});
