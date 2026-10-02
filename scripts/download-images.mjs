// Downloads every image hosted on images.fillout.com that the source code references,
// saves them to public/images/, and rewrites the code to use the local copies.
//
// Usage:  npm run images
// Safe to re-run: already-downloaded files are skipped.

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "src");
const outDir = path.join(root, "public", "images");

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

const HOST = "https://images.fillout.com/";
const fullUrlRe = /https:\/\/images\.fillout\.com\/[^\s"'`)]+\.(?:png|jpe?g|gif|webp|svg)/gi;
const baseConstRe = /const\s+(\w+)\s*=\s*"(https:\/\/images\.fillout\.com\/[^"]*\/)"/;

const files = await walk(srcDir);
const jobs = new Map(); // url -> local filename
const edits = []; // { file, from, to, url }

for (const file of files) {
  const text = await fs.readFile(file, "utf8");

  // Pattern 1: const P = "https://images.fillout.com/.../"; ... P + "id/name.jpg"
  const m = text.match(baseConstRe);
  if (m) {
    const [, name, base] = m;
    const concatRe = new RegExp(`${name}\\s*\\+\\s*"([^"]+\\.(?:png|jpe?g|gif|webp|svg))"`, "gi");
    for (const c of text.matchAll(concatRe)) {
      const url = base + c[1];
      edits.push({ file, from: c[0], url });
    }
  }

  // Pattern 2: full literal URLs (skip the base-constant definition itself)
  for (const u of text.matchAll(fullUrlRe)) {
    edits.push({ file, from: u[0], url: u[0], literal: true });
  }
}

function localName(url) {
  return decodeURIComponent(url.split("/").pop());
}

for (const e of edits) jobs.set(e.url, localName(e.url));

// Detect filename collisions between different URLs.
const seen = new Map();
for (const [url, name] of jobs) {
  if (seen.has(name) && seen.get(name) !== url) {
    const id = url.split("/").slice(-2, -1)[0];
    jobs.set(url, `${id}-${name}`);
  }
  seen.set(jobs.get(url), url);
}

await fs.mkdir(outDir, { recursive: true });
console.log(`Found ${jobs.size} unique images. Downloading to public/images/ ...`);

const ok = new Set();
let failed = 0;
for (const [url, name] of jobs) {
  const dest = path.join(outDir, name);
  try {
    try {
      await fs.access(dest);
      ok.add(url);
      continue;
    } catch {}
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
    ok.add(url);
    console.log("  ✓", name);
  } catch (err) {
    failed++;
    console.log("  ✗", name, "-", err.message);
  }
}

// Rewrite source files, only for images that downloaded successfully.
const byFile = new Map();
for (const e of edits) {
  if (!ok.has(e.url)) continue;
  if (!byFile.has(e.file)) byFile.set(e.file, []);
  byFile.get(e.file).push(e);
}
for (const [file, list] of byFile) {
  let text = await fs.readFile(file, "utf8");
  for (const e of list) {
    const local = `/images/${jobs.get(e.url)}`;
    // Literal URLs already sit inside quotes; P + "..." expressions need their own quotes.
    text = text.split(e.from).join(e.literal ? local : `"${local}"`);
  }
  await fs.writeFile(file, text);
}

console.log(`\nDone. ${ok.size} images saved, ${failed} failed.`);
if (failed) console.log("Failed images were left pointing at Fillout. Re-run later or download them by hand.");
