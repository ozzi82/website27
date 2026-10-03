/**
 * Generators for the files that carry the site origin: sitemap.xml, robots.txt, llms.txt and the nginx robots header.
 * They run at build time (scripts/prerender.mjs calls them through the server bundle) and in tests, so the final
 * files always contain the configured origin (VITE_SITE_URL) and never a stale hardcoded domain.
 */
export interface SitemapEntry {
  path: string;
  changefreq: "monthly" | "yearly";
  priority: number;
}

export interface SiteIndexLink {
  path: string;
  title: string;
  summary: string;
}

const join = (siteUrl: string, path: string) => `${siteUrl}${path === "/" ? "/" : path}`;

export function buildSitemap(entries: SitemapEntry[], siteUrl: string): string {
  const urls = entries
    .map(
      (e) =>
        `  <url>\n    <loc>${join(siteUrl, e.path)}</loc>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority.toFixed(1)}</priority>\n  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** Indexable builds allow everything and point at the sitemap; noindex (demo) builds disallow everything. */
export function buildRobotsTxt(siteUrl: string, noindex: boolean): string {
  if (noindex) return "User-agent: *\nDisallow: /\n";
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}

/**
 * Fills the llms.txt template: {{SITE_URL}} everywhere, and {{CASE_STUDIES}} with one bullet per case study
 * (nothing at all while there are none, including the blank line that would precede it).
 */
export function buildLlmsTxt(template: string, siteUrl: string, caseStudies: SiteIndexLink[]): string {
  const bullets = caseStudies.map((c) => `- [${c.title}](${siteUrl}${c.path}): ${c.summary}`);
  return template
    .replace(/\n?\{\{CASE_STUDIES\}\}/, bullets.length ? `\n${bullets.join("\n")}` : "")
    .replace(/\{\{SITE_URL\}\}/g, siteUrl);
}

/** The nginx snippet included by nginx.conf: an X-Robots-Tag header for noindex builds, a comment otherwise. */
export function nginxRobotsHeader(noindex: boolean): string {
  return noindex
    ? '# VITE_NOINDEX is set: this build must not be indexed.\nadd_header X-Robots-Tag "noindex, nofollow" always;\n'
    : "# Indexable build: no X-Robots-Tag header.\n";
}
