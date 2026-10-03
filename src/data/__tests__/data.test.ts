import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { productCategories, LEGACY_SERVICE_REDIRECTS } from "../products";
import { services } from "../services";
import { projects, featuredProjects, projectMeta, projectsForProduct, type Project } from "../projects";
import { productionStages } from "../production";
import { processSteps } from "../process";
import { primaryNav, productNav, productNavExtras } from "../nav";
import { getPrerenderRoutes } from "../../lib/routes";

const publicDir = path.resolve(__dirname, "../../../public");
const exists = (p: string) => fs.existsSync(path.join(publicDir, p.replace(/^\//, "")));

describe("product categories", () => {
  it("lists the four brief categories in order, numbered 01-04", () => {
    expect(productCategories.map((p) => p.id)).toEqual(["channel-letters", "ultra-slim", "cast-acrylic", "custom-fabrication"]);
    expect(productCategories.map((p) => p.number)).toEqual(["01", "02", "03", "04"]);
  });

  it("uses the brief's copy for the first two categories", () => {
    const [channel, slim] = productCategories;
    expect(channel.description).toBe("Front lit, halo lit and dual illuminated channel letters built to project specifications.");
    expect(channel.cta.label.toUpperCase()).toBe("VIEW CHANNEL LETTERS");
    expect(slim.description).toBe("Premium illuminated letters available at just 25–30 mm total depth.");
    expect(slim.cta.label.toUpperCase()).toBe("EXPLORE ULTRA-SLIM");
  });

  it("points at routes that exist (prerendered pages, /contact for custom work)", () => {
    const routes = new Set(getPrerenderRoutes());
    for (const p of productCategories) expect(routes.has(p.cta.to), `${p.id} -> ${p.cta.to}`).toBe(true);
  });

  it("uses images that exist", () => {
    for (const p of productCategories) expect(exists(p.image.src), p.image.src).toBe(true);
  });

  it("never offers cabinet signs or light boxes", () => {
    const blob = JSON.stringify([productCategories, services, productNav, primaryNav, productNavExtras]).toLowerCase();
    expect(blob).not.toMatch(/cabinet|light ?box/);
  });
});

describe("services and redirects", () => {
  it("has channel letters, ultra-slim and cast acrylic; no cabinet signs", () => {
    expect(services.map((s) => s.id)).toEqual(["channel-letters", "ultra-slim-trimless-channel-letters", "cast-block-acrylic"]);
  });

  it("redirects retired service URLs to pages that exist", () => {
    expect(LEGACY_SERVICE_REDIRECTS["cabinet-signs"]).toBe("/services/channel-letters");
    for (const target of Object.values(LEGACY_SERVICE_REDIRECTS)) expect(getPrerenderRoutes()).toContain(target);
    for (const id of Object.keys(LEGACY_SERVICE_REDIRECTS)) expect(services.find((s) => s.id === id)).toBeUndefined();
  });

  it("describes ultra-slim as 25-30 mm and a specialized option, never the 'under 1 1/4' only story", () => {
    const slim = services.find((s) => s.id === "ultra-slim-trimless-channel-letters")!;
    const text = JSON.stringify(slim.details.specs.map((s) => s.value)) + slim.details.description + slim.desc;
    expect(text).toContain("25–30 mm");
    expect(text).toMatch(/specialized/i);
    expect(text).not.toContain("1 1/4");
  });

  it("has no placeholder values left in specs", () => {
    for (const s of services) for (const spec of s.details.specs) expect(spec.value).not.toMatch(/placeholder/i);
  });

  it("service images exist", () => {
    for (const s of services) {
      for (const img of [s.img, s.details.dayImg, s.details.nightImg, ...s.details.gallery]) expect(exists(img), img).toBe(true);
    }
  });
});

describe("projects data", () => {
  it("has unique ids and existing images with dimensions and alt text", () => {
    expect(new Set(projects.map((p) => p.id)).size).toBe(projects.length);
    for (const p of projects) {
      expect(exists(p.image), p.image).toBe(true);
      expect(p.width).toBeGreaterThan(0);
      expect(p.height).toBeGreaterThan(0);
      expect(p.alt.length).toBeGreaterThan(10);
    }
  });

  it("selects six featured projects for the homepage", () => {
    expect(featuredProjects()).toHaveLength(6);
  });

  it("projectMeta returns only present, non-blank fields in display order", () => {
    const base: Project = { id: "x", title: "X", image: "/x.jpg", width: 1, height: 1, alt: "alt text here" };
    expect(projectMeta(base)).toEqual([]);
    expect(
      projectMeta({ ...base, productType: "Trimless face-lit letters", depth: "28 mm", finish: "  ", mounting: "Remote" }),
    ).toEqual([
      { label: "Product", value: "Trimless face-lit letters" },
      { label: "Depth", value: "28 mm" },
      { label: "Mounting", value: "Remote" },
    ]);
  });

  it("projectsForProduct matches on slug", () => {
    expect(projectsForProduct("channel-letters").every((p) => p.productSlug === "channel-letters")).toBe(true);
  });
});

describe("production + process data", () => {
  it("has the six stages from the brief in order", () => {
    expect(productionStages.map((s) => s.title)).toEqual([
      "CNC Fabrication",
      "LED & Electrical",
      "Hand Assembly",
      "Quality Control",
      "Packaging",
      "Ready for Freight",
    ]);
  });

  it("only uses images that exist and gives each a size and alt", () => {
    for (const s of productionStages) {
      const media = [s.image, s.video?.poster].filter(Boolean) as { src: string; alt: string; width: number; height: number }[];
      for (const m of media) {
        expect(exists(m.src), m.src).toBe(true);
        expect(m.width).toBeGreaterThan(0);
        expect(m.alt).not.toBe("");
      }
    }
  });

  it("process has six steps", () => {
    expect(processSteps).toHaveLength(6);
    expect(processSteps[0]).toBe("Send your files");
    expect(processSteps[5]).toBe("Crated & shipped");
  });
});

describe("navigation", () => {
  it("has Projects, Manufacturing, About and the four products", () => {
    expect(primaryNav.map((n) => n.label)).toEqual(["Projects", "Manufacturing", "About"]);
    expect(productNav.map((n) => n.label)).toEqual(["Channel Letters", "Ultra-Slim Trimless", "Cast Acrylic", "Custom Fabrication"]);
  });
  it("keeps the configurator reachable", () => {
    expect(productNavExtras.some((n) => n.to === "/configurator")).toBe(true);
  });
});
