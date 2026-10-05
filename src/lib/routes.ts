import { configurations } from "../data/configurations";
import { caseStudies, caseStudyPath } from "../data/caseStudies";
import type { SiteIndexLink, SitemapEntry } from "./siteFiles";

/** The dedicated product pages under /services (there is no generic service template any more). */
export const PRODUCT_PAGE_PATHS = [
  "/services/ultra-slim-trimless-channel-letters",
  "/services/channel-letters",
  "/services/custom-sign-fabrication",
] as const;

/** Every route that ships as static HTML (the WebGL /configurator stays a client-rendered SPA page). */
export function getPrerenderRoutes(): string[] {
  return [
    "/",
    "/about",
    "/manufacturing",
    "/projects",
    "/contact",
    ...PRODUCT_PAGE_PATHS,
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
    if (route === "/services/custom-sign-fabrication") return { changefreq: "monthly", priority: 0.8 };
    if (route === "/about") return { changefreq: "yearly", priority: 0.6 };
    if (route === "/contact") return { changefreq: "yearly", priority: 0.7 };
    if (route.startsWith("/projects/")) return { changefreq: "yearly", priority: 0.6 };
    if (route === "/configurator") return { changefreq: "monthly", priority: 0.8 };
    return { changefreq: "monthly", priority: 0.7 };
  };
  // /configurator is a client-rendered page with its own prerendered shell, so it is not in getPrerenderRoutes() but is a real page.
  return [...getPrerenderRoutes(), "/configurator"].map((path) => ({ path, ...meta(path) }));
}

/** Case studies as llms.txt bullets (empty while there are none). */
export function getCaseStudyLinks(): SiteIndexLink[] {
  return caseStudies.map((c) => ({ path: caseStudyPath(c.slug), title: c.title, summary: c.summary }));
}

/**
 * Pages that moved or were retired. The client redirects them (App.tsx) and the hosts answer with a real 301
 * (public/_redirects, nginx.conf), so old links and indexed URLs do not 404. A test keeps the three lists identical.
 */
export const LEGACY_PAGE_REDIRECTS: Record<string, string> = {
  "/gallery": "/projects",
  // Cabinet and blade signs are now part of custom fabrication; trimless became the ultra-slim page.
  "/services/cabinet-signs": "/services/custom-sign-fabrication",
  "/services/trimless-letters": "/services/ultra-slim-trimless-channel-letters",
  // Ultra-slim and cast block acrylic are one product line (the EdgeLuxe LP 11 series).
  "/services/cast-block-acrylic": "/services/ultra-slim-trimless-channel-letters",
  // The previous (WordPress) sunlitesigns.com pages that Google already indexes: they keep their ranking by redirecting
  // to the matching new page. Add every other old URL here too (see docs/SEO-AND-AI-VISIBILITY.md), in the three lists.
  "/channel-letters": "/services/channel-letters",
  "/channel-letters/": "/services/channel-letters",
  "/profile-11-slim-letters": "/services/ultra-slim-trimless-channel-letters",
  "/profile-11-slim-letters/": "/services/ultra-slim-trimless-channel-letters",
  "/lightbox-push-through-letters": "/services/custom-sign-fabrication",
  "/lightbox-push-through-letters/": "/services/custom-sign-fabrication",
  "/contact-sunlite-signs-llc": "/contact",
  "/contact-sunlite-signs-llc/": "/contact",
  "/edgeluxe-lp-1": "/light-effects/lp-1-flat-cutout",
  "/edgeluxe-lp-1/": "/light-effects/lp-1-flat-cutout",
  "/privacy-policy": "/",
  "/privacy-policy/": "/",
};
