// Writes docs/site-content.md: a readable Markdown dump of every prerendered page (URL, title, meta description,
// then the visible text with headings kept), so the site's copy can be handed to an AI or a copywriter for review.
// Derived from the build output, so run `npm run build` first, then `npm run export:content`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node-html-parser";
import { htmlPathFor, loadRoutes, SITE_URL } from "./verify-prerender.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");
const outFile = path.join(root, "docs", "site-content.md");

const HEADING = /^h([1-6])$/;
const SKIP = new Set(["script", "style", "noscript", "svg", "iframe", "template", "head", "video", "canvas"]);
const BLOCK = new Set(["address", "article", "aside", "blockquote", "div", "dl", "fieldset", "figure", "figcaption", "footer", "form", "header", "hr", "main", "nav", "ol", "p", "pre", "section", "table", "ul", "li", "dt", "dd"]);
const HEADING_OFFSET = 2; // page headings sit under the "## /route" heading of each page

const tagOf = (n) => (n.rawTagName ?? "").toLowerCase();
const squash = (s) => s.replace(/\s+/g, " ").trim();
const textOf = (n) => squash(n.text ?? "");

function hasBlockDescendant(node) {
  return node.querySelectorAll("*").some((e) => BLOCK.has(tagOf(e)) || HEADING.test(tagOf(e)) || tagOf(e) === "img");
}

/** Converts an element's children to Markdown lines. */
function toMarkdown(rootNode, faq = new Map()) {
  const out = [];
  let buf = "";
  const flush = () => {
    const t = squash(buf);
    buf = "";
    if (t) out.push(t);
  };
  const push = (line) => {
    flush();
    out.push(line);
  };

  function walk(node) {
    for (const child of node.childNodes) {
      if (child.nodeType === 3) {
        buf += child.text;
        continue;
      }
      if (child.nodeType !== 1) continue;
      const tag = tagOf(child);
      if (SKIP.has(tag)) continue;
      if (child.hasAttribute("hidden") && !squash(child.text)) continue;

      const h = HEADING.exec(tag);
      if (h) {
        const text = textOf(child);
        if (text) {
          push(`${"#".repeat(Math.min(6, Number(h[1]) + HEADING_OFFSET))} ${text}`);
          const answer = faq.get(text);
          if (answer) push(answer); // accordion answers are not in the static HTML; they come from the FAQ JSON-LD
        }
        continue;
      }
      if (tag === "dl") {
        flush();
        const items = child.querySelectorAll("dt, dd");
        for (let i = 0; i < items.length; i++) {
          if (tagOf(items[i]) !== "dt") continue;
          const dd = items[i + 1] && tagOf(items[i + 1]) === "dd" ? textOf(items[i + 1]) : "";
          out.push(`- **${textOf(items[i])}:** ${dd}`);
        }
        out.push("");
        continue;
      }
      if (tag === "ul" || tag === "ol") {
        flush();
        for (const li of child.childNodes.filter((n) => tagOf(n) === "li")) {
          const inner = toMarkdown(li, faq).map((l) => l.replace(/^#+\s+/, "")).filter(Boolean);
          if (inner.length) out.push(`- ${inner.join(" — ")}`);
        }
        out.push("");
        continue;
      }
      if (tag === "img") {
        const alt = squash(child.getAttribute("alt") ?? "");
        if (alt) push(`*[Image: ${alt}]*`);
        continue;
      }
      if (tag === "button") {
        const t = textOf(child);
        if (t) push(`[Button: ${t}]`);
        continue;
      }
      if (tag === "a") {
        const href = child.getAttribute("href") ?? "";
        if (hasBlockDescendant(child)) {
          flush();
          walk(child);
          push(`(Links to: ${href})`);
        } else {
          const t = textOf(child);
          if (t) buf += (/\)$/.test(buf) ? " · " : "") + (href ? `[${t}](${href})` : t);
        }
        continue;
      }
      if (tag === "br") {
        buf += " ";
        continue;
      }
      if (tag === "strong" || tag === "b") {
        buf += "**";
        walk(child);
        buf += "**";
        continue;
      }
      if (tag === "em" || tag === "i") {
        buf += "*";
        walk(child);
        buf += "*";
        continue;
      }
      if (BLOCK.has(tag)) {
        flush();
        walk(child);
        flush();
        out.push("");
        continue;
      }
      walk(child); // span and other inline wrappers
    }
  }
  walk(rootNode);
  flush();

  // Tidy: drop doubled blank lines and exact repeats of the previous line.
  const tidy = [];
  for (const line of out) {
    if (line === "" && (tidy.length === 0 || tidy[tidy.length - 1] === "")) continue;
    if (line !== "" && line === tidy[tidy.length - 1]) continue;
    tidy.push(line);
  }
  while (tidy[tidy.length - 1] === "") tidy.pop();
  return tidy;
}

/** Joins lines into paragraphs separated by blank lines (list items and "- " lines stay tight). */
function render(lines) {
  const res = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    res.push(line);
    const next = lines[i + 1];
    const tight = line.startsWith("- ") && next?.startsWith("- ");
    if (next !== undefined && line !== "" && next !== "" && !tight) res.push("");
  }
  return res.join("\n");
}

function faqFromJsonLd(doc) {
  const map = new Map();
  for (const s of doc.querySelectorAll("script").filter((x) => x.getAttribute("type") === "application/ld+json")) {
    try {
      const data = JSON.parse(s.text);
      for (const item of Array.isArray(data) ? data : [data]) {
        if (item["@type"] === "FAQPage") for (const q of item.mainEntity ?? []) map.set(squash(q.name), q.acceptedAnswer?.text ?? "");
      }
    } catch {
      /* verify:prerender reports invalid JSON-LD */
    }
  }
  return map;
}

const meta = (doc, attr, name) => doc.querySelectorAll("meta").find((m) => m.getAttribute(attr) === name)?.getAttribute("content") ?? "";

const routes = await loadRoutes();
const sections = [];
let siteWide = "";

for (const route of routes) {
  const file = htmlPathFor(distDir, route);
  if (!fs.existsSync(file)) throw new Error(`${file} is missing: run \`npm run build\` first.`);
  const doc = parse(fs.readFileSync(file, "utf8"));
  const mainEl = doc.querySelector("main");
  if (!mainEl) throw new Error(`${route}: no <main> found`);
  const faq = faqFromJsonLd(doc);
  const title = squash(doc.querySelector("title")?.text ?? "");
  const description = meta(doc, "name", "description");
  const body = render(toMarkdown(mainEl, faq));

  if (route === "/") {
    const footer = doc.querySelector("footer");
    const topBar = textOf(doc.querySelector("header")?.previousElementSibling ?? doc);
    const contactLinks = doc.querySelectorAll("header a").map((a) => a.getAttribute("href") ?? "").filter((h) => /^(tel:|mailto:|https:\/\/wa\.me)/.test(h));
    siteWide = [
      "## Site-wide elements (header and footer, identical on every page)",
      "",
      `Top bar: ${topBar}`,
      "",
      `Header navigation: Services (3 product pages), Light Effects (12 letter-system pages), Configurator, About, Gallery, Contact, plus a "Get a Quote" button.`,
      "",
      `Header contact links: ${[...new Set(contactLinks)].join(", ")}`,
      "",
      "Footer:",
      "",
      render(toMarkdown(footer, faq)),
    ].join("\n");
  }

  sections.push(
    [`## ${route}`, "", `- URL: ${SITE_URL}${route}`, `- Title: ${title}`, `- Meta description: ${description}`, "", body].join("\n"),
  );
}

const header = [
  "# Sunlite Signs: website content export",
  "",
  `Every content page of ${SITE_URL}, as plain Markdown, for content review (by people or other AI assistants).`,
  "",
  "- Generated by `npm run export:content` from the prerendered build output (`dist/`). Do not edit by hand: change the site source and regenerate.",
  "- Per page: URL, title tag, meta description, then the visible page text. Headings are kept, shifted down two levels (a page's H1 appears as `###`).",
  "- Images appear as `*[Image: alt text]*`; links as `[text](path)`; \"(Links to: path)\" marks a whole card that is a link.",
  "- The FAQ answers on /contact are collapsed accordions on the live page; they are included here from the page's FAQ structured data.",
  `- Not included: the 3D sign configurator (${SITE_URL}/configurator), which is an interactive tool with no static copy, and the embedded HubSpot quote form.`,
  `- ${routes.length} pages.`,
  "",
  "## Pages",
  "",
  ...routes.map((r) => `- ${r}`),
].join("\n");

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, [header, siteWide, ...sections].join("\n\n") + "\n");
console.log(`Wrote ${path.relative(root, outFile)} (${routes.length} pages, ${fs.statSync(outFile).size} bytes)`);
