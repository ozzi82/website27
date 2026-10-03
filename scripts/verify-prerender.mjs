// Checks the prerendered pages in dist/ (run after `npm run build`): `npm run verify:prerender`.
// Every content route must ship real HTML (one <h1>, real body text) with exactly one set of head tags.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse } from "node-html-parser";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const SITE_URL = "https://sunlitesigns.com";
const MIN_TEXT_CHARS = 500;
const NO_JSON_LD_ROUTES = new Set(["/about", "/gallery"]);

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

/** Returns a list of problems for one page's HTML (empty list = fine). */
export function checkPage(route, html) {
  const errors = [];
  const fail = (msg) => errors.push(msg);
  const doc = parse(html);
  const expectedUrl = SITE_URL + (route === "/" ? "/" : route);

  if (/data-static-seo/.test(html)) fail("still contains data-static-seo template tags");

  // Head tags: exactly one of each.
  const titles = doc.querySelectorAll("title");
  if (titles.length !== 1) fail(`expected 1 <title>, found ${titles.length}`);
  const title = titles[0]?.text.trim() ?? "";
  if (!title || !title.includes("Sunlite Signs")) fail(`title missing or lacks the site name: "${title}"`);

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
  if (description && description.length < 50) fail(`meta description is very short (${description.length} chars)`);
  if (ogTitle && ogTitle !== title) fail(`og:title "${ogTitle}" differs from <title> "${title}"`);
  if (twTitle && twTitle !== title) fail(`twitter:title differs from <title>`);
  if (ogUrl && ogUrl !== expectedUrl) fail(`og:url is ${ogUrl}, expected ${expectedUrl}`);

  // JSON-LD: every block must parse; the homepage carries exactly one LocalBusiness.
  const ldBlocks = doc.querySelectorAll("script").filter((s) => s.getAttribute("type") === "application/ld+json");
  // /about and /gallery have no structured data in their source today; every other page must.
  if (ldBlocks.length === 0 && !NO_JSON_LD_ROUTES.has(route)) fail("no JSON-LD block");
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
export function checkShell(html) {
  const errors = [];
  const doc = parse(html);
  const canon = doc.querySelectorAll("link").filter((l) => l.getAttribute("rel") === "canonical");
  if (canon.length !== 1 || canon[0].getAttribute("href") !== `${SITE_URL}/configurator`) fail("configurator shell canonical wrong");
  function fail(m) { errors.push(m); }
  if (doc.querySelectorAll("title").length !== 1) fail("configurator shell needs exactly one <title>");
  if (metaAll(doc, "name", "description").length !== 1) fail("configurator shell needs exactly one meta description");
  if (doc.querySelector("#root")?.childNodes.length) fail("configurator shell root should be empty (client-rendered)");
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
  return { results, failed };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { results, failed } = await verifyPrerender();
  for (const r of results) {
    const status = r.errors.length ? "FAIL" : "ok  ";
    console.log(`${status} ${r.route.padEnd(48)} ${r.textLength ? `${String(r.textLength).padStart(5)} chars  ` : "             "}${r.title ?? ""}`);
    for (const e of r.errors) console.log(`       - ${e}`);
  }
  console.log(failed ? `\n${failed} of ${results.length} pages have problems.` : `\nAll ${results.length} pages verified.`);
  process.exit(failed ? 1 : 0);
}
