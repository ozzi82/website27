import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { productCategories } from "../products";
import { projects, featuredProjects, projectMeta, projectsForProduct, type Project } from "../projects";
import { productionStages } from "../production";
import { processSteps } from "../process";
import { primaryNav, productNav, productNavExtras } from "../nav";
import { LEGACY_PAGE_REDIRECTS, getPrerenderRoutes } from "../../lib/routes";
import { trimClaimViolations } from "../../pages/__tests__/helpers/renderPage";

const publicDir = path.resolve(__dirname, "../../../public");
const exists = (p: string) => fs.existsSync(path.join(publicDir, p.replace(/^\//, "")));

describe("product categories", () => {
  it("lists the four owner categories in order, numbered 01-04, ultra-slim first", () => {
    expect(productCategories.map((p) => p.id)).toEqual(["ultra-slim", "classic-trimless", "flat-cutout", "custom-fabrication"]);
    expect(productCategories.map((p) => p.number)).toEqual(["01", "02", "03", "04"]);
    expect(productCategories.map((p) => p.title)).toEqual([
      "Ultra-Slim Letters",
      "Classic Trimless Letters",
      "Non-Illuminated Flat Cutout Letters",
      "Custom Sign Fabrication",
    ]);
  });

  it("describes each category with brochure facts: LP 11 cast block acrylic, LP 5 / 3.1 / 3.2 stainless, LP 1 unlit", () => {
    const [slim, classic, flat, custom] = productCategories;
    expect(slim.systems).toMatch(/LP 11/);
    expect(slim.description).toMatch(/cast block acrylic/i);
    expect(slim.description).toMatch(/25–30 mm/);
    expect(slim.description).toMatch(/IP67/);
    expect(classic.systems).toMatch(/LP 5, LP 3\.1, LP 3\.2/);
    expect(classic.description).toMatch(/stainless steel/i);
    expect(classic.description).toMatch(/no trim cap/i);
    expect(flat.systems).toMatch(/LP 1/);
    expect(flat.description).toMatch(/non-illuminated/i);
    expect(custom.description).toMatch(/blade signs/i);
    expect(custom.description).toMatch(/cabinet signs/i);
  });

  it("points ultra-slim, classic, flat cutout and custom at the right pages, all of which exist", () => {
    const routes = new Set([...getPrerenderRoutes()]);
    expect(productCategories.map((p) => p.cta.to)).toEqual([
      "/services/ultra-slim-trimless-channel-letters",
      "/services/channel-letters",
      "/light-effects/lp-1-flat-cutout",
      "/services/custom-sign-fabrication",
    ]);
    for (const p of productCategories) expect(routes.has(p.cta.to.split("#")[0]), `${p.id} -> ${p.cta.to}`).toBe(true);
    expect(productCategories[0].cta.label.toUpperCase()).toBe("EXPLORE ULTRA-SLIM");
  });

  it("uses images that exist", () => {
    for (const p of productCategories) expect(exists(p.image.src), p.image.src).toBe(true);
  });

  it("offers no trimmed letters, and only custom fabrication names cabinet or blade signs", () => {
    const blob = JSON.stringify(productCategories.filter((p) => p.id !== "custom-fabrication"));
    expect(blob).not.toMatch(/cabinet|blade|light ?box/i);
    expect(JSON.stringify([productCategories, productNav, primaryNav, productNavExtras])).not.toMatch(/light ?box|trimmed/i);
    // "no trim cap" is the only trim-cap wording a category may use
    expect(trimClaimViolations(productCategories.map((p) => `${p.title}. ${p.description}`).join(" "))).toEqual([]);
  });
});

describe("retired URLs", () => {
  it("redirect to pages that exist, and none of them is still prerendered", () => {
    expect(LEGACY_PAGE_REDIRECTS["/services/cast-block-acrylic"]).toBe("/services/ultra-slim-trimless-channel-letters");
    expect(LEGACY_PAGE_REDIRECTS["/services/cabinet-signs"]).toBe("/services/custom-sign-fabrication");
    expect(LEGACY_PAGE_REDIRECTS["/services/trimless-letters"]).toBe("/services/ultra-slim-trimless-channel-letters");
    const routes = getPrerenderRoutes();
    for (const [from, to] of Object.entries(LEGACY_PAGE_REDIRECTS)) {
      expect(routes, to).toContain(to);
      expect(routes, from).not.toContain(from);
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
    expect(productNav.map((n) => n.label)).toEqual(["Ultra-Slim Letters (LP 11)", "Classic Trimless Letters", "Flat Cutout Letters (LP 1)", "Custom Fabrication"]);
    expect(productNavExtras.map((n) => n.label)).toEqual(["All 12 letter systems", "Build Your Sign"]);
  });
  it("keeps the configurator reachable", () => {
    expect(productNavExtras.some((n) => n.to === "/configurator")).toBe(true);
  });
});

describe("EdgeLuxe render files", () => {
  it("every system's night image exists, and every day image exists; only the unlit LP 1 lacks a day render", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { configurations } = await import("../configurations");
    for (const c of configurations) {
      expect(fs.existsSync(path.resolve(__dirname, "../../../public" + c.img)), c.img).toBe(true);
      if (c.imgDay) expect(fs.existsSync(path.resolve(__dirname, "../../../public" + c.imgDay)), c.imgDay).toBe(true);
      else expect(c.id).toBe("lp-1-flat-cutout");
    }
  });
});

describe("mounting (owner list, 2026-10-03)", () => {
  it("only LP 3.1, LP 11-B and LP 11-FB are stand-off only; every other system can be flush or stand-off", async () => {
    const { configurations, defaultMount } = await import("../configurations");
    const standoffOnly = configurations.filter((c) => c.mounts.length === 1).map((c) => c.id);
    expect(standoffOnly).toEqual(["lp-3-1-standoff-halo", "lp-11-b-back-lit", "lp-11-fb-face-halo"]);
    for (const c of configurations) {
      expect(c.specs.find((r) => r.label === "Mounting"), c.id).toBeTruthy();
      expect(c.mounts).toContain(defaultMount(c));
    }
  });
});
