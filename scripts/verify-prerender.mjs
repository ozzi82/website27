// Checks the prerendered pages in dist/ (run after `npm run build`): `npm run verify:prerender`.
// Every content route must ship real HTML (one <h1>, real body text) with exactly one set of head tags.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse } from "node-html-parser";
import { loadSiteConfig, DEFAULT_SITE_URL, ROBOTS_NOINDEX_CONTENT } from "./siteConfig.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const site = loadSiteConfig();
export const SITE_URL = site.siteUrl;
export const NOINDEX = site.noindex;
const MIN_TEXT_CHARS = 500;
// Pages whose <title> the owner specified verbatim (brief sections 11-12), without the " | Sunlite Signs" suffix.
const EXACT_TITLES = {
  "/services/channel-letters": "Wholesale Channel Letter Manufacturer | Sunlite Signs",
  "/services/ultra-slim-trimless-channel-letters": "Ultra-Slim Trimless Channel Letters | 10–30 mm Depth",
};

export function htmlPathFor(distDir, route) {
  return route === "/" ? path.join(distDir, "index.html") : path.join(distDir, ...route.split("/").filter(Boolean), "index.html");
}

/** Routes that are prerendered, straight from the server bundle (same list the prerender step used). */
export async function loadRoutes(ssrDir = path.join(root, "dist-ssr")) {
  const entry = path.join(ssrDir, "entry-server.js");
  if (!fs.existsSync(entry)) throw new Error("dist-ssr/entry-server.js not found: run `npm run build` first.");
  const { getPrerenderRoutes } = await import(pathToFileURL(entry).href);
  return getPrerenderRoutes();
}

/** Visible text of the page body: scripts, styles and noscript fallbacks excluded, whitespace collapsed. */
export function visibleText(doc) {
  const body = doc.querySelector("body");
  if (!body) return "";
  body.querySelectorAll("script, style, noscript, template").forEach((n) => n.remove());
  return body.text.replace(/\s+/g, " ").trim();
}

function metaAll(doc, attr, name) {
  return doc.querySelectorAll("meta").filter((m) => m.getAttribute(attr) === name);
}

/** Returns a list of problems for one page's HTML (empty list = fine). `siteUrl` / `noindex` default to the build settings. */
export function checkPage(route, html, { siteUrl = SITE_URL, noindex = NOINDEX } = {}) {
  const errors = [];
  const fail = (msg) => errors.push(msg);
  const doc = parse(html);
  const expectedUrl = siteUrl + (route === "/" ? "/" : route);

  if (/data-static-seo/.test(html)) fail("still contains data-static-seo template tags");

  // Head tags: exactly one of each.
  const titles = doc.querySelectorAll("title");
  if (titles.length !== 1) fail(`expected 1 <title>, found ${titles.length}`);
  const title = titles[0]?.text.trim() ?? "";
  if (EXACT_TITLES[route]) {
    if (title !== EXACT_TITLES[route]) fail(`title is "${title}", expected exactly "${EXACT_TITLES[route]}"`);
  } else if (!title || !title.includes("Sunlite Signs")) fail(`title missing or lacks the site name: "${title}"`);

  const canonicals = doc.querySelectorAll("link").filter((l) => l.getAttribute("rel") === "canonical");
  if (canonicals.length !== 1) fail(`expected 1 canonical link, found ${canonicals.length}`);
  else if (canonicals[0].getAttribute("href") !== expectedUrl) fail(`canonical is ${canonicals[0].getAttribute("href")}, expected ${expectedUrl}`);

  const one = (attr, name, label = name) => {
    const found = metaAll(doc, attr, name);
    if (found.length !== 1) fail(`expected 1 ${label}, found ${found.length}`);
    const content = found[0]?.getAttribute("content")?.trim();
    if (found.length === 1 && !content) fail(`${label} is empty`);
    return content;
  };
  const description = one("name", "description", "meta description");
  const ogTitle = one("property", "og:title");
  one("property", "og:description");
  const ogUrl = one("property", "og:url");
  one("property", "og:image");
  one("property", "og:type");
  one("name", "twitter:card");
  const twTitle = one("name", "twitter:title");
  // Robots: demo (noindex) builds carry exactly one noindex, nofollow tag; indexable builds carry no noindex at all.
  const robots = metaAll(doc, "name", "robots");
  if (noindex) {
    if (robots.length !== 1 || robots[0].getAttribute("content") !== ROBOTS_NOINDEX_CONTENT) fail(`noindex build: expected exactly one robots meta "${ROBOTS_NOINDEX_CONTENT}", found ${robots.length}`);
  } else if (robots.some((m) => /noindex/i.test(m.getAttribute("content") ?? ""))) fail("indexable build carries a noindex robots meta");

  if (description && description.length < 50) fail(`meta description is very short (${description.length} chars)`);
  if (ogTitle && ogTitle !== title) fail(`og:title "${ogTitle}" differs from <title> "${title}"`);
  if (twTitle && twTitle !== title) fail(`twitter:title differs from <title>`);
  if (ogUrl && ogUrl !== expectedUrl) fail(`og:url is ${ogUrl}, expected ${expectedUrl}`);

  // JSON-LD: every block must parse; the homepage carries exactly one LocalBusiness.
  const ldBlocks = doc.querySelectorAll("script").filter((s) => s.getAttribute("type") === "application/ld+json");
  if (ldBlocks.length === 0) fail("no JSON-LD block");
  const ldTypes = [];
  ldBlocks.forEach((s, i) => {
    try {
      const data = JSON.parse(s.text);
      for (const item of Array.isArray(data) ? data : [data]) {
        if (item["@context"] !== "https://schema.org") fail(`JSON-LD block ${i + 1} lacks the schema.org @context`);
        ldTypes.push(item["@type"]);
      }
    } catch (e) {
      fail(`JSON-LD block ${i + 1} is not valid JSON (${e.message})`);
    }
  });
  const dupTypes = ldTypes.filter((t, i) => ldTypes.indexOf(t) !== i);
  if (dupTypes.length) fail(`duplicate JSON-LD types: ${[...new Set(dupTypes)].join(", ")}`);
  if (route === "/" && !ldTypes.includes("LocalBusiness")) fail("homepage lacks LocalBusiness JSON-LD");

  // Body.
  const rootEl = doc.querySelector("#root");
  if (!rootEl) fail("no #root element");
  else if (rootEl.getAttribute("data-prerender-path") !== route) fail(`#root data-prerender-path is "${rootEl.getAttribute("data-prerender-path")}", expected "${route}"`);
  const h1 = doc.querySelectorAll("h1");
  if (h1.length !== 1) fail(`expected 1 <h1>, found ${h1.length}`);
  if (doc.querySelectorAll("body noscript").length) fail("prerendered page still has the template <noscript> body block");
  const text = visibleText(doc);
  if (text.length < MIN_TEXT_CHARS) fail(`only ${text.length} chars of visible text (need ${MIN_TEXT_CHARS}+)`);
  return { errors, title, textLength: text.length, h1: h1[0]?.text.replace(/\s+/g, " ").trim() ?? "" };
}

/** The /configurator SPA shell: its own head tags, an empty root (client-rendered), a noscript note. */
export function checkShell(html, { siteUrl = SITE_URL, noindex = NOINDEX } = {}) {
  const errors = [];
  const doc = parse(html);
  const canon = doc.querySelectorAll("link").filter((l) => l.getAttribute("rel") === "canonical");
  if (canon.length !== 1 || canon[0].getAttribute("href") !== `${siteUrl}/configurator`) fail("configurator shell canonical wrong");
  const robots = metaAll(doc, "name", "robots");
  if (noindex && robots.length !== 1) fail("noindex build: configurator shell needs one robots meta");
  if (!noindex && robots.length) fail("indexable build: configurator shell carries a robots meta");
  function fail(m) { errors.push(m); }
  if (doc.querySelectorAll("title").length !== 1) fail("configurator shell needs exactly one <title>");
  if (metaAll(doc, "name", "description").length !== 1) fail("configurator shell needs exactly one meta description");
  if (doc.querySelector("#root")?.childNodes.length) fail("configurator shell root should be empty (client-rendered)");
  return errors;
}

/** Every URL in the generated sitemap / llms.txt / robots.txt must use the configured origin and nothing else. */
export function checkSiteFiles(distDir, routes, { siteUrl = SITE_URL, noindex = NOINDEX } = {}) {
  const errors = [];
  const read = (f) => (fs.existsSync(path.join(distDir, f)) ? fs.readFileSync(path.join(distDir, f), "utf8") : null);
  const otherOrigins = (text) =>
    [...new Set([...text.matchAll(/https?:\/\/[a-z0-9.-]+/gi)].map((m) => m[0]))].filter(
      (o) => o !== siteUrl && !/^https?:\/\/(www\.)?(w3\.org|schema\.org|sitemaps\.org)/.test(o),
    );

  const robots = read("robots.txt");
  if (robots === null) errors.push("robots.txt missing");
  else if (noindex) {
    if (!/^Disallow:\s*\/\s*$/m.test(robots) || /^Allow:/m.test(robots)) errors.push("noindex build: robots.txt must be a blanket Disallow: /");
  } else {
    if (/^Disallow:\s*\/\s*$/m.test(robots)) errors.push("indexable build: robots.txt disallows everything");
    if (!robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`)) errors.push(`robots.txt lacks "Sitemap: ${siteUrl}/sitemap.xml"`);
  }
  for (const f of ["sitemap.xml", "llms.txt"]) {
    const text = read(f);
    if (noindex) {
      if (text !== null) errors.push(`noindex build should not ship ${f}`);
      continue;
    }
    if (text === null) {
      errors.push(`${f} missing`);
      continue;
    }
    if (text.includes("{{") || text.includes("%SITE_URL%")) errors.push(`${f} has an unfilled placeholder`);
    const foreign = otherOrigins(text);
    if (foreign.length) errors.push(`${f} mentions other origins: ${foreign.join(", ")}`);
  }
  const sitemap = read("sitemap.xml");
  if (sitemap) {
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort();
    const expected = routes.map((r) => (r === "/" ? `${siteUrl}/` : siteUrl + r)).sort();
    if (JSON.stringify(locs) !== JSON.stringify(expected)) errors.push("sitemap.xml does not list exactly the prerendered routes");
  }
  const html = read("index.html");
  if (html && siteUrl !== DEFAULT_SITE_URL && html.includes(DEFAULT_SITE_URL)) errors.push(`index.html still mentions ${DEFAULT_SITE_URL}`);
  return errors;
}

export async function verifyPrerender({ distDir = path.join(root, "dist"), routes } = {}) {
  routes ??= await loadRoutes();
  const results = [];
  let failed = 0;
  for (const route of routes) {
    const file = htmlPathFor(distDir, route);
    if (!fs.existsSync(file)) {
      results.push({ route, file, errors: ["file missing"] });
      failed++;
      continue;
    }
    const r = checkPage(route, fs.readFileSync(file, "utf8"));
    results.push({ route, file, ...r });
    if (r.errors.length) failed++;
  }
  const shellFile = htmlPathFor(distDir, "/configurator");
  const shellErrors = fs.existsSync(shellFile) ? checkShell(fs.readFileSync(shellFile, "utf8")) : ["file missing"];
  results.push({ route: "/configurator (SPA shell)", file: shellFile, errors: shellErrors, title: "", textLength: 0 });
  if (shellErrors.length) failed++;
  const fileErrors = checkSiteFiles(distDir, routes);
  results.push({ route: "robots.txt, sitemap.xml, llms.txt", file: distDir, errors: fileErrors, title: "", textLength: 0 });
  if (fileErrors.length) failed++;
  return { results, failed };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { results, failed } = await verifyPrerender();
  for (const r of results) {
    const status = r.errors.length ? "FAIL" : "ok  ";
    console.log(`${status} ${r.route.padEnd(48)} ${r.textLength ? `${String(r.textLength).padStart(5)} chars  ` : "             "}${r.title ?? ""}`);
    for (const e of r.errors) console.log(`       - ${e}`);
  }
  console.log(`\nOrigin: ${SITE_URL}${NOINDEX ? " (noindex build)" : ""}`);
  console.log(failed ? `${failed} of ${results.length} checks have problems.` : `All ${results.length} checks passed.`);
  process.exit(failed ? 1 : 0);
}
