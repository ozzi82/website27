/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Site origin for canonicals, JSON-LD, sitemap and llms.txt (see DEFAULT_SITE_URL in lib/seo.ts). */
  readonly VITE_SITE_URL?: string;
  /** "1" for demo builds: noindex meta on every page, Disallow: / robots.txt, X-Robots-Tag in nginx. */
  readonly VITE_NOINDEX?: string;
  /** Google Tag Manager container ID, "GTM-XXXXXXX" (see lib/tracking.ts and docs/ANALYTICS-PLAN.md). */
  readonly VITE_GTM_ID?: string;
  readonly VITE_GA4_ID?: string;
  readonly VITE_GOOGLE_ADS_ID?: string;
  readonly VITE_GOOGLE_ADS_LEAD_LABEL?: string;
}
