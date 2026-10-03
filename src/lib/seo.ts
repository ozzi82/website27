export const SITE_URL = "https://sunlitesigns.com";
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
