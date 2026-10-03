// Build-time static prerender. Runs after `vite build` (client, dist/) and
// `vite build --ssr src/entry-server.tsx --outDir dist-ssr` (server bundle):
// renders each content route with the real React app and writes dist/<route>/index.html.
// Plain Node only, no headless browser and no server needed at runtime.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");
const ssrDir = path.join(root, "dist-ssr");

const SITE_URL = "https://sunlitesigns.com";
const SITE_NAME = "Sunlite Signs";
const DEFAULT_OG_IMAGE = `${SITE_URL}/images/pasted-image-1787755330414-fxpkbj9m.png`;

const templatePath = path.join(distDir, "index.html");
if (!fs.existsSync(templatePath)) throw new Error("dist/index.html not found: run `vite build` first.");
const template = fs.readFileSync(templatePath, "utf8");
if (!template.includes('<div id="root"></div>')) {
  throw new Error('dist/index.html has no empty <div id="root"></div> (already prerendered? rebuild with `npm run build`).');
}

const serverEntry = path.join(ssrDir, "entry-server.js");
if (!fs.existsSync(serverEntry)) throw new Error("dist-ssr/entry-server.js not found: run the SSR build first.");
const { render, getPrerenderRoutes } = await import(pathToFileURL(serverEntry).href);

const escapeAttr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** The template minus everything a prerendered page must not carry twice (default SEO tags, title, noscript). */
function stripTemplateDefaults(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(/<script\b[^>]*\bdata-static-seo\b[^>]*>[\s\S]*?<\/script>\s*/gi, "")
    .replace(/<(?:meta|link)\b[^>]*\bdata-static-seo\b[^>]*>\s*/gi, "")
    .replace(/<noscript>[\s\S]*?<\/noscript>\s*/gi, "");
}

const stripped = stripTemplateDefaults(template);
if (/data-static-seo/.test(stripped)) throw new Error("Could not strip every data-static-seo tag from the template.");

function outFile(route) {
  return route === "/" ? path.join(distDir, "index.html") : path.join(distDir, ...route.split("/").filter(Boolean), "index.html");
}

function write(file, html) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

const t0 = Date.now();
const routes = getPrerenderRoutes();
const written = [];
for (const route of routes) {
  const { html, head } = render(route);
  const page = stripped
    .replace("</head>", () => `    ${head}\n  </head>`)
    // data-prerender-path lets main.tsx hydrate only when this HTML belongs to the URL being viewed.
    .replace('<div id="root"></div>', () => `<div id="root" data-prerender-path="${route}">${html}</div>`);
  write(outFile(route), page);
  written.push(route);
}

// /configurator is WebGL and stays a client-rendered page, but its served HTML gets its own tags and a noscript note.
const CONFIGURATOR = {
  title: `Sign Configurator | ${SITE_NAME}`,
  description: "Upload your logo or type your text and see it rendered as a 3D channel-letter sign before you request a quote.",
  path: "/configurator",
};
{
  const url = SITE_URL + CONFIGURATOR.path;
  const t = escapeAttr(CONFIGURATOR.title);
  const d = escapeAttr(CONFIGURATOR.description);
  // data-static-seo: main.tsx removes these at startup so the page's own <Seo> tags are the only ones once React runs.
  const tags = [
    `<title>${CONFIGURATOR.title}</title>`,
    `<meta data-static-seo name="description" content="${d}" />`,
    `<link data-static-seo rel="canonical" href="${url}" />`,
    `<meta data-static-seo property="og:type" content="website" />`,
    `<meta data-static-seo property="og:site_name" content="${SITE_NAME}" />`,
    `<meta data-static-seo property="og:title" content="${t}" />`,
    `<meta data-static-seo property="og:description" content="${d}" />`,
    `<meta data-static-seo property="og:url" content="${url}" />`,
    `<meta data-static-seo property="og:image" content="${DEFAULT_OG_IMAGE}" />`,
    `<meta data-static-seo name="twitter:card" content="summary_large_image" />`,
    `<meta data-static-seo name="twitter:title" content="${t}" />`,
    `<meta data-static-seo name="twitter:description" content="${d}" />`,
    `<meta data-static-seo name="twitter:image" content="${DEFAULT_OG_IMAGE}" />`,
  ].join("\n    ");
  const noscript = `<noscript>
      <main>
        <h1>Sign Configurator</h1>
        <p>${CONFIGURATOR.description} The 3D configurator needs JavaScript. Without it, send your logo and dimensions on the <a href="/contact">contact page</a> and we will quote it by hand.</p>
        <p><a href="/">Sunlite Signs</a> · <a href="/contact">Get a Quote</a></p>
      </main>
    </noscript>`;
  const page = stripped
    .replace("</head>", () => `    ${tags}\n  </head>`)
    .replace('<div id="root"></div>', () => `<div id="root"></div>\n    ${noscript}`);
  write(outFile(CONFIGURATOR.path), page);
  written.push(CONFIGURATOR.path + " (SPA shell)");
}

console.log(`Prerendered ${written.length} pages in ${Date.now() - t0} ms:`);
for (const r of written) console.log("  " + r);
