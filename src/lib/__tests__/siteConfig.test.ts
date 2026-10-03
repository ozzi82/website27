import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_URL, NOINDEX, SITE_URL, absoluteUrl, breadcrumbJsonLd, normalizeSiteUrl, parseNoindex } from "../seo";
import { buildLlmsTxt, buildRobotsTxt, buildSitemap, nginxRobotsHeader } from "../siteFiles";
// @ts-expect-error plain .mjs script without type declarations
import * as scriptConfig from "../../../scripts/siteConfig.mjs";
// @ts-expect-error plain .mjs script without type declarations
import { checkPage, checkShell, checkSiteFiles } from "../../../scripts/verify-prerender.mjs";

const root = path.resolve(__dirname, "../../..");
const read = (f: string) => fs.readFileSync(path.join(root, f), "utf8");

describe("normalizeSiteUrl (client/SSR helper)", () => {
  it("defaults to the production origin", () => {
    expect(DEFAULT_SITE_URL).toBe("https://sunlitesigns.com");
    expect(normalizeSiteUrl(undefined)).toBe(DEFAULT_SITE_URL);
    expect(normalizeSiteUrl("")).toBe(DEFAULT_SITE_URL);
    expect(normalizeSiteUrl("   ")).toBe(DEFAULT_SITE_URL);
  });

  it("keeps a clean https origin and trims slashes, paths and whitespace", () => {
    expect(normalizeSiteUrl("https://t2wraps.com")).toBe("https://t2wraps.com");
    expect(normalizeSiteUrl(" https://t2wraps.com/ ")).toBe("https://t2wraps.com");
    expect(normalizeSiteUrl("https://t2wraps.com/some/path?x=1#y")).toBe("https://t2wraps.com");
    expect(normalizeSiteUrl("HTTPS://T2Wraps.com")).toBe("https://t2wraps.com");
  });

  it("assumes https when the scheme is missing and rejects other schemes", () => {
    expect(normalizeSiteUrl("t2wraps.com")).toBe("https://t2wraps.com");
    expect(normalizeSiteUrl("ftp://t2wraps.com")).toBe(DEFAULT_SITE_URL);
    expect(normalizeSiteUrl("javascript:alert(1)")).toBe(DEFAULT_SITE_URL);
    expect(normalizeSiteUrl(42)).toBe(DEFAULT_SITE_URL);
  });

  it("parses the noindex switch", () => {
    for (const on of ["1", "true", "TRUE", "yes", "on", " 1 "]) expect(parseNoindex(on), on).toBe(true);
    for (const off of [undefined, "", "0", "false", "no", "off", "2"]) expect(parseNoindex(off), String(off)).toBe(false);
  });

  it("the build scripts normalise exactly like the client code", () => {
    for (const v of [undefined, "", "https://t2wraps.com/", "t2wraps.com", "ftp://x", "http://localhost:5199/", "https://www.sunlitesigns.com"]) {
      expect(scriptConfig.normalizeSiteUrl(v), String(v)).toBe(normalizeSiteUrl(v));
    }
    for (const v of [undefined, "", "1", "true", "0", "no"]) expect(scriptConfig.parseNoindex(v)).toBe(parseNoindex(v));
  });

  it("loadSiteConfig reads the two variables (explicit env overrides everything)", () => {
    expect(scriptConfig.loadSiteConfig({})).toEqual({ siteUrl: DEFAULT_SITE_URL, noindex: false });
    expect(scriptConfig.loadSiteConfig({ VITE_SITE_URL: "https://t2wraps.com/", VITE_NOINDEX: "1" })).toEqual({ siteUrl: "https://t2wraps.com", noindex: true });
  });
});

describe("the configured origin in the app (default test environment)", () => {
  it("is the production origin and indexable unless the variables are set", () => {
    expect(SITE_URL).toBe(normalizeSiteUrl(import.meta.env.VITE_SITE_URL));
    expect(NOINDEX).toBe(parseNoindex(import.meta.env.VITE_NOINDEX));
  });

  it("absoluteUrl and the JSON-LD builders use it", () => {
    expect(absoluteUrl("/contact")).toBe(`${SITE_URL}/contact`);
    expect(absoluteUrl("contact")).toBe(`${SITE_URL}/contact`);
    const items = breadcrumbJsonLd([{ label: "Home", to: "/" }, { label: "Projects", to: "/projects" }]).itemListElement;
    expect(items.map((i) => i.item)).toEqual([SITE_URL, `${SITE_URL}/projects`]);
  });

  it("no source file other than seo.ts and the build scripts hardcodes the production origin", () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
          if (e.name !== "__tests__") walk(full);
        } else if (/\.(ts|tsx)$/.test(e.name) && e.name !== "seo.ts" && /https?:\/\/(www\.)?sunlitesigns\.com/.test(fs.readFileSync(full, "utf8"))) {
          offenders.push(path.relative(root, full));
        }
      }
    };
    walk(path.join(root, "src"));
    expect(offenders).toEqual([]);
    // index.html uses placeholders that vite.config.ts fills from the same variable
    const html = read("index.html");
    expect(html).not.toMatch(/https?:\/\/(www\.)?sunlitesigns\.com/);
    expect(html).toContain("%SITE_URL%");
    expect(html).toContain("%ROBOTS_META%");
  });
});

describe("generated site files", () => {
  const ORIGIN = "https://t2wraps.com";

  it("sitemap.xml carries the configured origin and nothing else", () => {
    const xml = buildSitemap(
      [
        { path: "/", changefreq: "monthly", priority: 1 },
        { path: "/contact", changefreq: "yearly", priority: 0.7 },
      ],
      ORIGIN,
    );
    expect(xml).toContain(`<loc>${ORIGIN}/</loc>`);
    expect(xml).toContain(`<loc>${ORIGIN}/contact</loc>`);
    expect(xml).toContain("<priority>1.0</priority>");
    expect(xml).not.toContain("sunlitesigns.com");
  });

  it("robots.txt: allow + sitemap for indexable builds, blanket disallow for noindex builds", () => {
    expect(buildRobotsTxt(ORIGIN, false)).toBe(`User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
    const demo = buildRobotsTxt(ORIGIN, true);
    expect(demo).toContain("Disallow: /");
    expect(demo).not.toMatch(/Allow:|Sitemap:/);
  });

  it("llms.txt: origin placeholder everywhere, case-study block only when there are entries", () => {
    const template = "# Site\n\n- [A]({{SITE_URL}}/a): x\n{{CASE_STUDIES}}\n- [B]({{SITE_URL}}/b): y\n";
    expect(buildLlmsTxt(template, ORIGIN, [])).toBe(`# Site\n\n- [A](${ORIGIN}/a): x\n- [B](${ORIGIN}/b): y\n`);
    const withStudy = buildLlmsTxt(template, ORIGIN, [{ path: "/projects/x", title: "Study X", summary: "What it was." }]);
    expect(withStudy).toBe(`# Site\n\n- [A](${ORIGIN}/a): x\n- [Study X](${ORIGIN}/projects/x): What it was.\n- [B](${ORIGIN}/b): y\n`);
  });

  it("the nginx snippet sends X-Robots-Tag only for noindex builds, and nginx.conf / Dockerfile are wired to it", () => {
    expect(nginxRobotsHeader(true)).toMatch(/add_header X-Robots-Tag "noindex, nofollow" always;/);
    expect(nginxRobotsHeader(false)).not.toContain("add_header");
    const nginx = read("nginx.conf");
    expect(nginx).toContain("include /etc/nginx/snippets/robots-header.conf;");
    expect(nginx).toMatch(/location \/assets\/ \{ include \/etc\/nginx\/snippets\/robots-header\.conf;/);
    const docker = read("Dockerfile");
    expect(docker).toMatch(/ARG VITE_SITE_URL/);
    expect(docker).toMatch(/ARG VITE_NOINDEX/);
    expect(docker).toMatch(/ENV VITE_SITE_URL=\$VITE_SITE_URL/);
    expect(docker).toMatch(/ENV VITE_NOINDEX=\$VITE_NOINDEX/);
    expect(docker).toContain("/app/dist-ssr/robots-header.conf /etc/nginx/snippets/robots-header.conf");
  });
});

describe("verify-prerender: origin and noindex checks", () => {
  const page = (origin: string, extraHead = "") => `<!doctype html><html><head>
    <title>About | Sunlite Signs</title>
    <meta name="description" content="A description that is comfortably longer than fifty characters in total." />
    <link rel="canonical" href="${origin}/about" />
    <meta property="og:title" content="About | Sunlite Signs" />
    <meta property="og:description" content="d" />
    <meta property="og:url" content="${origin}/about" />
    <meta property="og:image" content="${origin}/i.png" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="About | Sunlite Signs" />
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList"}</script>
    ${extraHead}
  </head><body><div id="root" data-prerender-path="/about"><h1>About</h1><p>${"Real body text. ".repeat(60)}</p></div></body></html>`;

  it("passes when canonical and og:url use the configured origin", () => {
    expect(checkPage("/about", page("https://t2wraps.com"), { siteUrl: "https://t2wraps.com", noindex: false }).errors).toEqual([]);
  });

  it("fails when the canonical or og:url belong to another origin", () => {
    const errors: string[] = checkPage("/about", page("https://sunlitesigns.com"), { siteUrl: "https://t2wraps.com", noindex: false }).errors;
    expect(errors.some((e) => e.includes("canonical is https://sunlitesigns.com/about, expected https://t2wraps.com/about"))).toBe(true);
    expect(errors.some((e) => e.includes("og:url is https://sunlitesigns.com/about"))).toBe(true);
  });

  it("is apex-vs-www strict: a www canonical does not match an apex origin", () => {
    const errors: string[] = checkPage("/about", page("https://www.t2wraps.com"), { siteUrl: "https://t2wraps.com", noindex: false }).errors;
    expect(errors.some((e) => e.includes("canonical"))).toBe(true);
  });

  it("noindex builds need exactly one noindex, nofollow robots tag; indexable builds must not carry noindex", () => {
    const tag = `<meta name="robots" content="noindex, nofollow" />`;
    expect(checkPage("/about", page("https://t2wraps.com", tag), { siteUrl: "https://t2wraps.com", noindex: true }).errors).toEqual([]);
    expect(checkPage("/about", page("https://t2wraps.com"), { siteUrl: "https://t2wraps.com", noindex: true }).errors.some((e: string) => e.includes("noindex build"))).toBe(true);
    expect(checkPage("/about", page("https://t2wraps.com", tag + tag), { siteUrl: "https://t2wraps.com", noindex: true }).errors.some((e: string) => e.includes("found 2"))).toBe(true);
    expect(checkPage("/about", page("https://t2wraps.com", tag), { siteUrl: "https://t2wraps.com", noindex: false }).errors.some((e: string) => e.includes("indexable build carries a noindex"))).toBe(true);
  });

  it("the configurator shell is checked against the origin and robots setting too", () => {
    const shell = (origin: string, robots = "") =>
      `<html><head><title>x</title><meta name="description" content="d"/><link rel="canonical" href="${origin}/configurator"/>${robots}</head><body><div id="root"></div></body></html>`;
    expect(checkShell(shell("https://t2wraps.com"), { siteUrl: "https://t2wraps.com", noindex: false })).toEqual([]);
    expect(checkShell(shell("https://sunlitesigns.com"), { siteUrl: "https://t2wraps.com", noindex: false }).length).toBeGreaterThan(0);
    expect(checkShell(shell("https://t2wraps.com"), { siteUrl: "https://t2wraps.com", noindex: true }).length).toBeGreaterThan(0);
  });

  it("checkSiteFiles flags stale domains and placeholders in the generated files, and demo builds that ship a sitemap", () => {
    const dir = fs.mkdtempSync(path.join(root, "node_modules", ".tmp-site-files-"));
    try {
      const routes = ["/", "/contact"];
      fs.writeFileSync(path.join(dir, "robots.txt"), buildRobotsTxt("https://t2wraps.com", false));
      fs.writeFileSync(path.join(dir, "sitemap.xml"), buildSitemap(routes.map((p) => ({ path: p, changefreq: "monthly" as const, priority: 0.5 })), "https://t2wraps.com"));
      fs.writeFileSync(path.join(dir, "llms.txt"), "# x\n- [a](https://t2wraps.com/)\n");
      expect(checkSiteFiles(dir, routes, { siteUrl: "https://t2wraps.com", noindex: false })).toEqual([]);

      fs.writeFileSync(path.join(dir, "llms.txt"), "# x\n- [a](https://sunlitesigns.com/)\n{{SITE_URL}}\n");
      const stale: string[] = checkSiteFiles(dir, routes, { siteUrl: "https://t2wraps.com", noindex: false });
      expect(stale.some((e) => e.includes("other origins"))).toBe(true);
      expect(stale.some((e) => e.includes("placeholder"))).toBe(true);

      const demo: string[] = checkSiteFiles(dir, routes, { siteUrl: "https://t2wraps.com", noindex: true });
      expect(demo.some((e) => e.includes("robots.txt must be a blanket Disallow"))).toBe(true);
      expect(demo.some((e) => e.includes("should not ship sitemap.xml"))).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
