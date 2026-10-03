import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// @ts-expect-error plain .mjs module shared with the build scripts (no type declarations)
import { normalizeSiteUrl, parseNoindex, ROBOTS_NOINDEX_CONTENT } from "./scripts/siteConfig.mjs";

/**
 * Fills the site-origin placeholders in index.html from VITE_SITE_URL / VITE_NOINDEX (defaults: https://sunlitesigns.com,
 * indexable), so the static fallback tags never carry a hardcoded domain. Prerendered pages strip these tags and get
 * their own from <Seo>; the robots tag is `data-static-seo` for the same reason.
 */
function siteUrlPlugin(env: Record<string, string>): Plugin {
  const siteUrl: string = normalizeSiteUrl(process.env.VITE_SITE_URL ?? env.VITE_SITE_URL);
  const noindex: boolean = parseNoindex(process.env.VITE_NOINDEX ?? env.VITE_NOINDEX);
  return {
    name: "sunlite-site-url",
    transformIndexHtml: {
      order: "pre",
      handler: (html) =>
        html
          .replaceAll("%SITE_URL%", siteUrl)
          .replace("%ROBOTS_META%", noindex ? `<meta name="robots" content="${ROBOTS_NOINDEX_CONTENT}" data-static-seo />` : ""),
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), siteUrlPlugin(loadEnv(mode, process.cwd(), "VITE_"))],
  resolve: {
    alias: {
      "@project": path.resolve(__dirname, "src"),
    },
  },
}));
