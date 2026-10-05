import fs from "node:fs";
import path from "node:path";
import { waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FORBIDDEN, internalHrefs, renderAt, validRoutes } from "./helpers/renderPage";
import { CTA_PRIMARY, RETIRED_CTA_LABELS } from "../../lib/cta";
import { LEGACY_PAGE_REDIRECTS, getCaseStudyLinks, getPrerenderRoutes, getSitemapEntries } from "../../lib/routes";
import { projects } from "../../data/projects";
import { productionStages } from "../../data/production";
import { COMPANY_LINE, COMPANY_POSITIONING } from "../../lib/contact";
import { SITE_URL } from "../../lib/seo";
import { buildLlmsTxt, buildSitemap } from "../../lib/siteFiles";

const root = path.resolve(__dirname, "../../..");
const read = (f: string) => fs.readFileSync(path.join(root, f), "utf8");

function expectLinksResolve(container: HTMLElement, pagePath: string) {
  for (const href of internalHrefs(container)) {
    const [route, hash] = href.split("#");
    expect(validRoutes.has(route === "" ? "/" : route.split("?")[0]), href).toBe(true);
    if (hash && route === pagePath) expect(container.querySelector(`#${hash}`), `#${hash}`).not.toBeNull();
  }
}

describe("/projects (canonical; /gallery redirects)", () => {
  it("renders the brief's headline, one H1 and every project as a card", () => {
    const { main } = renderAt("/projects");
    const h1 = within(main).getByRole("heading", { level: 1 });
    expect(h1.textContent).toBe("See what we've built.");
    expect(main.textContent).toMatch(/recent production/i);
    expect(main.querySelectorAll("article[data-project]")).toHaveLength(projects.length);
    expect(within(main).getAllByRole("link", { name: new RegExp(CTA_PRIMARY.label, "i") })[0]).toHaveAttribute("href", "/contact");
  });

  it("cards that are mapped to a product link back to its page; unmapped cards carry no metadata", () => {
    const { main } = renderAt("/projects");
    const mapped = projects.filter((p) => p.productSlug);
    expect(mapped.length).toBeGreaterThan(0);
    for (const p of mapped) {
      const card = main.querySelector(`[data-project="${p.id}"]`)!;
      expect(within(card as HTMLElement).getByRole("link")).toHaveAttribute("href", `/services/${p.productSlug}`);
    }
    for (const p of projects.filter((x) => !x.productSlug && !x.productType)) {
      expect(main.querySelector(`[data-project="${p.id}"] dl`)).toBeNull();
    }
  });

  it("sets title, canonical and breadcrumb JSON-LD", async () => {
    const { container, main } = renderAt("/projects");
    await waitFor(() => expect(document.title).toMatch(/^Projects: .* \| Sunlite Signs$/));
    expect(document.head.querySelector('link[rel="canonical"]')!.getAttribute("href")).toBe(`${SITE_URL}/projects`);
    expect(JSON.parse(document.head.querySelector('script[type="application/ld+json"]')!.textContent!)["@type"]).toBe("BreadcrumbList");
    expectLinksResolve(container, "/projects");
    for (const f of FORBIDDEN) expect(main.textContent).not.toMatch(f);
  });

  it("/gallery redirects to /projects on the client", () => {
    const { main } = renderAt("/gallery");
    expect(within(main).getByRole("heading", { level: 1 }).textContent).toBe("See what we've built.");
  });

  it("the hosts send a real 301 for /gallery, ahead of the SPA fallback", () => {
    expect(LEGACY_PAGE_REDIRECTS["/gallery"]).toBe("/projects");
    const redirects = read("public/_redirects");
    expect(redirects).toMatch(/^\/gallery\s+\/projects\s+301$/m);
    expect(redirects.indexOf("/gallery")).toBeLessThan(redirects.indexOf("/* "));
    expect(read("nginx.conf")).toContain("location = /gallery { return 301 /projects; }");
    expect(getPrerenderRoutes()).not.toContain("/gallery");
    expect(getPrerenderRoutes()).toContain("/projects");
  });
});

describe("/manufacturing", () => {
  it("shows the six stages with the brief's headline, process and the factual location line", () => {
    const { main } = renderAt("/manufacturing");
    expect(within(main).getByRole("heading", { level: 1 }).textContent).toBe("Your Drawings In.Finished Signs Out.");
    expect(within(main).getAllByRole("heading", { level: 3 }).map((h) => h.textContent).slice(0, 6)).toEqual(productionStages.map((s) => s.title));
    expect(main.querySelector("#process")).not.toBeNull();
    expect(main.textContent).toContain(COMPANY_LINE);
    expect(main.textContent).toContain(COMPANY_POSITIONING);
    expect(main.textContent).toMatch(/trade customers only/i);
  });

  it("claims no factory, staff or capacity figures and not where processes happen", () => {
    const { main } = renderAt("/manufacturing");
    const text = main.textContent!;
    for (const f of FORBIDDEN) expect(text).not.toMatch(f);
    expect(text).not.toMatch(/square f|sq\.? ?ft|employees|machines|per month|capacity of|\d+ (staff|people|workers)/i);
    expect(text).not.toMatch(/our (tampa )?(factory|plant|facility) in/i);
  });

  it("uses real media where a stage has it and a placeholder (no img) otherwise", () => {
    const { main } = renderAt("/manufacturing");
    for (const s of productionStages) {
      const card = main.querySelector(`[data-stage="${s.id}"]`)!;
      expect(card.querySelector("img") !== null, s.id).toBe(Boolean(s.image || s.video));
    }
  });

  it("links on to channel letters and every link resolves; CTA matches the shared module", () => {
    const { main, container } = renderAt("/manufacturing");
    expect(within(main).getAllByRole("link", { name: new RegExp(CTA_PRIMARY.label, "i") })[0]).toHaveAttribute("href", CTA_PRIMARY.to);
    expect(within(main).getAllByRole("link").some((a) => a.getAttribute("href") === "/services/channel-letters")).toBe(true);
    expectLinksResolve(container, "/manufacturing");
  });
});

describe("/about (company and trade-only positioning, distinct from manufacturing)", () => {
  it("is not a duplicate of the manufacturing page", () => {
    const about = renderAt("/about").main;
    expect(within(about).getByRole("heading", { level: 1 }).textContent).toBe("A production partnerfor sign companies.");
    expect(about.querySelector("#trade")).not.toBeNull();
    expect(about.querySelector("#who-we-serve")).not.toBeNull();
    expect(about.querySelector("#trade-only")).not.toBeNull();
    expect(about.querySelector("[data-stage]")).toBeNull();
    expect(about.querySelector("#faq")).not.toBeNull();
    expect(about.textContent).toContain("We don't compete with our partners.");
    expect(about.textContent).toContain(COMPANY_LINE);
  });

  it("uses the shared primary CTA, no retired wording, and valid links", () => {
    const { main, container } = renderAt("/about");
    for (const a of within(main).getAllByRole("link", { name: new RegExp(CTA_PRIMARY.label, "i") })) expect(a).toHaveAttribute("href", "/contact");
    for (const r of RETIRED_CTA_LABELS) expect(main.textContent).not.toContain(r);
    for (const f of FORBIDDEN) expect(main.textContent).not.toMatch(f);
    expectLinksResolve(container, "/about");
  });
});

describe("site navigation and the custom-fabrication target", () => {
  it("the header links Projects, Manufacturing, About and the four products to final targets", () => {
    const { container } = renderAt("/");
    const nav = container.querySelector('nav[aria-label="Main"]') as HTMLElement;
    const href = (name: string) => within(nav).getByRole("link", { name }).getAttribute("href");
    expect(href("Projects")).toBe("/projects");
    expect(href("Manufacturing")).toBe("/manufacturing");
    expect(href("About")).toBe("/about");
    expect(href("Custom Fabrication")).toBe("/services/custom-sign-fabrication");
    expect(href("Ultra-Slim Letters (LP 11)")).toBe("/services/ultra-slim-trimless-channel-letters");
    expect(href("Classic Trimless Letters")).toBe("/services/channel-letters");
    expect(href("Flat Cutout Letters (LP 1)")).toBe("/light-effects/lp-1-flat-cutout");
  });

  it("the footer links the four product categories under their new names", () => {
    const { container } = renderAt("/about");
    const footer = within(container.querySelector("footer") as HTMLElement);
    expect(footer.getByRole("link", { name: "Ultra-Slim Letters" })).toHaveAttribute("href", "/services/ultra-slim-trimless-channel-letters");
    expect(footer.getByRole("link", { name: "Classic Trimless Letters" })).toHaveAttribute("href", "/services/channel-letters");
    expect(footer.getByRole("link", { name: "Flat Cutout Letters" })).toHaveAttribute("href", "/light-effects/lp-1-flat-cutout");
    expect(footer.getByRole("link", { name: "Custom Fabrication" })).toHaveAttribute("href", "/services/custom-sign-fabrication");
  });

  it("custom fabrication is its own page, and the classic page only points at it", () => {
    const { main } = renderAt("/services/channel-letters");
    const section = main.querySelector("#custom-fabrication")!;
    expect(within(section as HTMLElement).getByRole("link", { name: /see custom fabrication/i })).toHaveAttribute("href", "/services/custom-sign-fabrication");
    expect(section.textContent).toMatch(/blade signs and push-through cabinet signs/i);
  });

  it("the footer and homepage manufacturing section link to /manufacturing and /projects", () => {
    const { container } = renderAt("/");
    const hrefs = internalHrefs(container);
    expect(hrefs).toContain("/manufacturing");
    expect(hrefs).toContain("/projects");
    expect(hrefs).not.toContain("/gallery");
    expect(hrefs.some((h) => h.includes("cabinet") || h.includes("cast-block-acrylic"))).toBe(false);
    expect(hrefs).toContain("/services/custom-sign-fabrication");
    expect(hrefs).toContain("/light-effects/lp-1-flat-cutout");
  });

  it("sitemap and llms.txt list the new pages and neither lists /gallery", () => {
    const generated: Record<string, string> = {
      "sitemap.xml": buildSitemap(getSitemapEntries(), SITE_URL),
      "llms.txt": buildLlmsTxt(read("scripts/templates/llms.txt"), SITE_URL, getCaseStudyLinks()),
      "index.html": read("index.html"),
    };
    for (const [f, text] of Object.entries(generated)) {
      expect(text, f).toContain("/projects");
      expect(text, f).toContain("/manufacturing");
      expect(text, f).not.toContain("/gallery");
    }
  });
});

describe("retired /services URLs redirect on the client", () => {
  const h1 = (path: string) => within(renderAt(path).main).getByRole("heading", { level: 1 }).textContent;

  it("/services/cast-block-acrylic and /services/trimless-letters land on the ultra-slim page", () => {
    expect(h1("/services/cast-block-acrylic")).toBe("Ultra-Slim Channel Letters.Just 10–30 mm Deep.");
    expect(h1("/services/trimless-letters")).toBe("Ultra-Slim Channel Letters.Just 10–30 mm Deep.");
  });

  it("/services/cabinet-signs lands on the custom fabrication page", () => {
    expect(h1("/services/cabinet-signs")).toBe("Custom Sign Fabrication.Made to Your Drawings.");
  });

  it("an unknown /services path shows the 404 page", () => {
    expect(h1("/services/nope")).toBe("Page not found.");
  });
});
