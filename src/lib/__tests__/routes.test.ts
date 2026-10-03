import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getCaseStudyLinks, getPrerenderRoutes, getSitemapEntries } from "../routes";
import { SITE_URL } from "../seo";
import { buildLlmsTxt, buildSitemap } from "../siteFiles";

const root = path.resolve(__dirname, "../../..");
const read = (f: string) => fs.readFileSync(path.join(root, f), "utf8");

describe("static route lists", () => {
  const routes = getPrerenderRoutes();

  it("prerenders the two product pages and not cabinet signs", () => {
    expect(routes).toContain("/services/channel-letters");
    expect(routes).toContain("/services/ultra-slim-trimless-channel-letters");
    expect(routes.some((r) => r.includes("cabinet"))).toBe(false);
  });

  it("ships no case-study routes while the case-study list is empty", () => {
    expect(routes.filter((r) => r.startsWith("/projects/"))).toEqual([]);
    expect(getCaseStudyLinks()).toEqual([]);
  });

  it("the generated sitemap lists exactly the prerendered routes, on the configured origin", () => {
    const xml = buildSitemap(getSitemapEntries(), SITE_URL);
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const expected = routes.map((r) => (r === "/" ? `${SITE_URL}/` : SITE_URL + r));
    expect([...locs].sort()).toEqual([...expected].sort());
  });

  it("the llms.txt template links only to real routes, through the origin placeholder, and does not mention cabinet signs", () => {
    const template = read("scripts/templates/llms.txt");
    expect(template).not.toMatch(/https?:\/\/(www\.)?sunlitesigns\.com/);
    const links = [...template.matchAll(/\]\(\{\{SITE_URL\}\}([^)]*)\)/g)].map((m) => m[1] || "/");
    expect(links.length).toBeGreaterThan(10);
    for (const l of links) expect(routes, l).toContain(l);
    expect(template.toLowerCase()).not.toContain("cabinet");
    const filled = buildLlmsTxt(template, SITE_URL, []);
    expect(filled).not.toContain("{{");
    expect(filled).toContain(`](${SITE_URL}/services/channel-letters)`);
  });

  it("no hand-written robots.txt, sitemap.xml or llms.txt is left in public/ (they are generated with the origin)", () => {
    for (const f of ["robots.txt", "sitemap.xml", "llms.txt"]) expect(fs.existsSync(path.join(root, "public", f)), f).toBe(false);
  });

  it("serves 301s for retired URLs before the SPA fallback", () => {
    const redirects = read("public/_redirects");
    expect(redirects).toMatch(/\/services\/cabinet-signs\s+\/services\/channel-letters\s+301/);
    expect(redirects).toMatch(/\/services\/trimless-letters\s+\/services\/ultra-slim-trimless-channel-letters\s+301/);
    expect(redirects.indexOf("cabinet-signs")).toBeLessThan(redirects.indexOf("/* "));
  });
});
