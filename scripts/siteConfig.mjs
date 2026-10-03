// Build-time site settings shared by the prerender, verify and export scripts (plain Node).
// The browser/SSR code reads the same variables through import.meta.env (see src/lib/seo.ts); keep the two
// normalisers in step (src/lib/__tests__/siteConfig.test.ts compares them).
//
//   VITE_SITE_URL  origin used in canonicals, og:url, JSON-LD, sitemap.xml, llms.txt, robots.txt
//                  (default https://sunlitesigns.com)
//   VITE_NOINDEX   "1" / "true" for demo builds: noindex meta on every page, Disallow: / robots.txt,
//                  X-Robots-Tag header in nginx, no sitemap / llms.txt
//
// Values come from the process environment first, then .env files (the same sources Vite uses). This module
// deliberately does not import vite: it is also loaded by the test run, where esbuild cannot start.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_SITE_URL = "https://sunlitesigns.com";
export const ROBOTS_NOINDEX_CONTENT = "noindex, nofollow";

/** An http(s) origin without a trailing slash, path, query or fragment; anything unusable falls back to the default. */
export function normalizeSiteUrl(raw) {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return DEFAULT_SITE_URL;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`);
    if (url.protocol !== "https:" && url.protocol !== "http:") return DEFAULT_SITE_URL;
    return url.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

/** "1", "true", "yes" and "on" (any case) switch noindex on; empty, "0", "false" and anything else leave it off. */
export function parseNoindex(raw) {
  return typeof raw === "string" && /^(1|true|yes|on)$/i.test(raw.trim());
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** KEY=value lines of a dotenv file (comments and surrounding quotes handled); a missing file gives {}. */
function readDotenv(file) {
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m) continue;
    const quoted = /^(["'])(.*)\1/.exec(m[2]);
    out[m[1]] = quoted ? quoted[2] : m[2].replace(/\s+#.*$/, "");
  }
  return out;
}

/**
 * The effective settings for a production build: process environment first, then .env.production.local, .env.local,
 * .env.production, .env (Vite's order for `vite build`). `env` overrides everything (tests).
 */
export function loadSiteConfig(env) {
  let source = env;
  if (!source) {
    const files = [".env", ".env.production", ".env.local", ".env.production.local"].map((f) => readDotenv(path.join(root, f)));
    source = Object.assign({}, ...files);
    for (const key of ["VITE_SITE_URL", "VITE_NOINDEX"]) if (process.env[key] !== undefined) source[key] = process.env[key];
  }
  return { siteUrl: normalizeSiteUrl(source.VITE_SITE_URL), noindex: parseNoindex(source.VITE_NOINDEX) };
}
