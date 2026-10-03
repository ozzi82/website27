/**
 * The 3D configurator is a sales and conversion tool, not a product (second-opinion review): it is called
 * "Build Your Sign" everywhere it is linked, and the page is /configurator. Used by the page, the prerendered shell
 * (scripts/prerender.mjs reads it from the server bundle) and the nav.
 */
export const CONFIGURATOR_NAME = "Build Your Sign";
export const CONFIGURATOR_PATH = "/configurator";
export const CONFIGURATOR_META = {
  /** Without the site name: <Seo> / the shell add " | Sunlite Signs". */
  title: `${CONFIGURATOR_NAME}: 3D Channel Letter Preview`,
  description: "Upload your logo or type your text and see it rendered as a 3D channel-letter sign before you request wholesale pricing.",
  path: CONFIGURATOR_PATH,
} as const;

/** Short pitch used by the showcase, the promo modules and the quote hand-over. Modest by design: no comparative claims. */
export const CONFIGURATOR_TAGLINE = "A 3D sign configurator built for sign companies";

/** schema.org WebApplication for /configurator (rendered by the page's <Seo> and written into the prerendered shell). */
export function configuratorJsonLd(siteUrl: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: CONFIGURATOR_NAME,
    alternateName: "Sunlite 3D sign configurator",
    url: `${siteUrl}${CONFIGURATOR_PATH}`,
    description:
      "Upload your artwork or type your text, choose one of the EdgeLuxe letter systems, switch between day and night, dim the LEDs, try different walls, and send the configuration with your wholesale pricing request.",
    applicationCategory: "DesignApplication",
    operatingSystem: "Any (runs in a web browser with WebGL)",
    browserRequirements: "Requires JavaScript and WebGL",
    isAccessibleForFree: true,
    provider: { "@type": "Organization", "@id": `${siteUrl}/#organization`, name: "Sunlite Signs" },
  };
}
