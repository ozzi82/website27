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
