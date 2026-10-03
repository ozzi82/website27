import { services } from "../data/services";
import { configurations } from "../data/configurations";
import { caseStudies, caseStudyPath } from "../data/caseStudies";
import type { SiteIndexLink, SitemapEntry } from "./siteFiles";

/** Every route that ships as static HTML (the WebGL /configurator stays a client-rendered SPA page). */
export function getPrerenderRoutes(): string[] {
  return [
    "/",
    "/about",
    "/manufacturing",
    "/projects",
    "/contact",
    ...services.map((s) => `/services/${s.id}`),
    ...configurations.map((c) => `/light-effects/${c.id}`),
    // Case studies are data-driven: no entries, no routes (nothing fake ships).
    ...caseStudies.map((c) => caseStudyPath(c.slug)),
  ];
}

/** Sitemap rows for every prerendered route (the sitemap lists exactly what is prerendered, nothing else). */
export function getSitemapEntries(): SitemapEntry[] {
  const meta = (route: string): Omit<SitemapEntry, "path"> => {
    if (route === "/") return { changefreq: "monthly", priority: 1.0 };
    if (route === "/services/channel-letters" || route === "/services/ultra-slim-trimless-channel-letters") return { changefreq: "monthly", priority: 0.9 };
    if (route === "/services/cast-block-acrylic") return { changefreq: "monthly", priority: 0.8 };
    if (route === "/about") return { changefreq: "yearly", priority: 0.6 };
    if (route === "/contact") return { changefreq: "yearly", priority: 0.7 };
    if (route.startsWith("/projects/")) return { changefreq: "yearly", priority: 0.6 };
    return { changefreq: "monthly", priority: 0.7 };
  };
  return getPrerenderRoutes().map((path) => ({ path, ...meta(path) }));
}

/** Case studies as llms.txt bullets (empty while there are none). */
export function getCaseStudyLinks(): SiteIndexLink[] {
  return caseStudies.map((c) => ({ path: caseStudyPath(c.slug), title: c.title, summary: c.summary }));
}

/**
 * Top-level pages that moved. The client redirects them (App.tsx) and the hosts answer with a real 301
 * (public/_redirects, nginx.conf), so old links and indexed URLs do not 404.
 * Retired /services/* URLs live next to the product data (LEGACY_SERVICE_REDIRECTS in data/products.ts).
 */
export const LEGACY_PAGE_REDIRECTS: Record<string, string> = {
  "/gallery": "/projects",
};
