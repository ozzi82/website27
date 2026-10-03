export const DEFAULT_SITE_URL = "https://sunlitesigns.com";

/**
 * An http(s) origin without a trailing slash, path, query or fragment; anything unusable falls back to the default.
 * Mirrors normalizeSiteUrl in scripts/siteConfig.mjs (a test keeps the two identical).
 */
export function normalizeSiteUrl(raw: unknown): string {
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

/** "1", "true", "yes" and "on" (any case) switch noindex on. Mirrors parseNoindex in scripts/siteConfig.mjs. */
export function parseNoindex(raw: unknown): boolean {
  return typeof raw === "string" && /^(1|true|yes|on)$/i.test(raw.trim());
}

/** The site origin, set at build time with VITE_SITE_URL (default https://sunlitesigns.com). */
export const SITE_URL = normalizeSiteUrl(import.meta.env.VITE_SITE_URL);
/** Demo builds (VITE_NOINDEX=1): every page carries <meta name="robots" content="noindex, nofollow">. */
export const NOINDEX = parseNoindex(import.meta.env.VITE_NOINDEX);
export const SITE_NAME = "Sunlite Signs";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/pasted-image-1787755330414-fxpkbj9m.png`;

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export interface Crumb {
  label: string;
  /** Site path of the crumb ("/", "/#products", "/services/channel-letters"). The last crumb is the current page. */
  to: string;
}

/** BreadcrumbList JSON-LD built from the same crumbs the page renders visibly. */
export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: c.to === "/" ? SITE_URL : absoluteUrl(c.to),
    })),
  };
}
