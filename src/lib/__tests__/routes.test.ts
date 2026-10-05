import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LEGACY_PAGE_REDIRECTS, getCaseStudyLinks, getPrerenderRoutes, getSitemapEntries } from "../routes";
import { SITE_URL } from "../seo";
import { buildLlmsTxt, buildSitemap } from "../siteFiles";

const root = path.resolve(__dirname, "../../..");
const read = (f: string) => fs.readFileSync(path.join(root, f), "utf8");

describe("static route lists", () => {
  const routes = getPrerenderRoutes();

  it("prerenders the three product pages, the 12 letter systems, and neither cast-block-acrylic nor cabinet-signs", () => {
    expect(routes).toContain("/services/channel-letters");
    expect(routes).toContain("/services/ultra-slim-trimless-channel-letters");
    expect(routes).toContain("/services/custom-sign-fabrication");
    expect(routes.filter((r) => r.startsWith("/services/"))).toHaveLength(3);
    expect(routes.filter((r) => r.startsWith("/light-effects/"))).toHaveLength(12);
    expect(routes).not.toContain("/services/cast-block-acrylic");
    expect(routes.some((r) => r.includes("cabinet"))).toBe(false);
  });

  it("lists the custom page in the sitemap at a lower priority than the two letter pages", () => {
    const entries = getSitemapEntries();
    const priority = (p: string) => entries.find((e) => e.path === p)!.priority;
    expect(priority("/services/custom-sign-fabrication")).toBeLessThan(priority("/services/channel-letters"));
    expect(entries.some((e) => e.path === "/services/cast-block-acrylic")).toBe(false);
  });

  it("ships no case-study routes while the case-study list is empty", () => {
    expect(routes.filter((r) => r.startsWith("/projects/"))).toEqual([]);
    expect(getCaseStudyLinks()).toEqual([]);
  });

  it("the generated sitemap lists exactly the prerendered routes, on the configured origin", () => {
    const xml = buildSitemap(getSitemapEntries(), SITE_URL);
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const expected = [...routes, "/configurator"].map((r) => (r === "/" ? `${SITE_URL}/` : SITE_URL + r));
    expect([...locs].sort()).toEqual([...expected].sort());
  });

  it("the llms.txt template links only to real routes, through the origin placeholder, never to the merged cast-block-acrylic page, and offers no trimmed letters", () => {
    const template = read("scripts/templates/llms.txt");
    expect(template).not.toMatch(/https?:\/\/(www\.)?sunlitesigns\.com/);
    const links = [...template.matchAll(/\]\(\{\{SITE_URL\}\}([^)]*)\)/g)].map((m) => m[1] || "/");
    expect(links.length).toBeGreaterThan(10);
    // /configurator is a client-rendered page (WebGL), served by its own SPA shell, so it is not in the static route list.
    for (const l of links) expect([...routes, "/configurator"], l).toContain(l);
    expect(links).toContain("/configurator");
    expect(template).not.toContain("cast-block-acrylic");
    expect(template.toLowerCase()).not.toMatch(/light ?box|trimmed/);
    expect(template).toContain("/services/custom-sign-fabrication");
    expect(template).toContain("F = face, B = back (halo), S = side, N = neon, C = conical");
    const filled = buildLlmsTxt(template, SITE_URL, []);
    expect(filled).not.toContain("{{");
    expect(filled).toContain(`](${SITE_URL}/services/channel-letters)`);
  });

  it("no hand-written robots.txt, sitemap.xml or llms.txt is left in public/ (they are generated with the origin)", () => {
    for (const f of ["robots.txt", "sitemap.xml", "llms.txt"]) expect(fs.existsSync(path.join(root, "public", f)), f).toBe(false);
  });

  it("serves 301s for retired URLs before the SPA fallback, in _redirects and nginx.conf, matching the client redirects", () => {
    const redirects = read("public/_redirects");
    const nginx = read("nginx.conf");
    for (const [from, to] of Object.entries(LEGACY_PAGE_REDIRECTS)) {
      expect(redirects, from).toMatch(new RegExp(`^${from}\\s+${to}\\s+301$`, "m"));
      expect(redirects.indexOf(from), from).toBeLessThan(redirects.indexOf("/* "));
      expect(nginx, from).toContain(`location = ${from} { return 301 ${to}; }`);
    }
    expect(redirects).toMatch(/\/services\/cast-block-acrylic\s+\/services\/ultra-slim-trimless-channel-letters\s+301/);
    expect(redirects).toMatch(/\/services\/cabinet-signs\s+\/services\/custom-sign-fabrication\s+301/);
  });
});
