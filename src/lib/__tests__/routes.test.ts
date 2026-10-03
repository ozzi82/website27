import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getPrerenderRoutes } from "../routes";
import { SITE_URL } from "../seo";

const publicDir = path.resolve(__dirname, "../../../public");
const read = (f: string) => fs.readFileSync(path.join(publicDir, f), "utf8");

describe("static route lists", () => {
  const routes = getPrerenderRoutes();

  it("prerenders the two product pages and not cabinet signs", () => {
    expect(routes).toContain("/services/channel-letters");
    expect(routes).toContain("/services/ultra-slim-trimless-channel-letters");
    expect(routes.some((r) => r.includes("cabinet"))).toBe(false);
  });

  it("sitemap.xml lists exactly the prerendered routes", () => {
    const locs = [...read("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const expected = routes.map((r) => (r === "/" ? `${SITE_URL}/` : SITE_URL + r));
    expect([...locs].sort()).toEqual([...expected].sort());
  });

  it("llms.txt links only to real routes and does not mention cabinet signs", () => {
    const text = read("llms.txt");
    const links = [...text.matchAll(/\]\((https:\/\/sunlitesigns\.com[^)]*)\)/g)].map((m) => m[1].replace(SITE_URL, "") || "/");
    for (const l of links) expect(routes, l).toContain(l);
    expect(text.toLowerCase()).not.toContain("cabinet");
  });

  it("serves 301s for retired URLs before the SPA fallback", () => {
    const redirects = read("_redirects");
    expect(redirects).toMatch(/\/services\/cabinet-signs\s+\/services\/channel-letters\s+301/);
    expect(redirects).toMatch(/\/services\/trimless-letters\s+\/services\/ultra-slim-trimless-channel-letters\s+301/);
    expect(redirects.indexOf("cabinet-signs")).toBeLessThan(redirects.indexOf("/* "));
  });
});
