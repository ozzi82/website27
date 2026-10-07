#!/usr/bin/env node
/**
 * Makes responsive WebP copies of every JPEG/PNG under public/images and writes src/data/image-manifest.json
 * (original size and the widths available), which <Picture> uses to build srcset/sizes and width/height.
 *
 *   node scripts/optimize-images.mjs
 *
 * Needs ImageMagick (`convert`, `identify`) with WebP support. Run it after adding or replacing a photo and
 * commit the generated files: the Docker build does not run it. Originals stay as the fallback for old browsers.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, extname, basename, dirname } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const IMAGES = join(ROOT, "public/images");
const MANIFEST = join(ROOT, "src/data/image-manifest.json");
const WIDTHS = [480, 960, 1600];
const MAX_WIDTH = WIDTHS[WIDTHS.length - 1];
const SOURCE = /\.(jpe?g|png)$/i;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const manifest = {};
let before = 0;
let after = 0;

for (const file of walk(IMAGES).filter((f) => SOURCE.test(f)).sort()) {
  const [w, h, alpha] = execFileSync("identify", ["-format", "%w %h %A", `${file}[0]`]).toString().trim().split(" ");
  const width = Number(w);
  const height = Number(h);
  const hasAlpha = alpha === "True" || /png$/i.test(file) && alpha === "Blend";
  const widths = WIDTHS.filter((x) => x < width);
  widths.push(Math.min(width, MAX_WIDTH));
  const unique = [...new Set(widths)].filter((x) => x >= 240);
  const src = "/" + relative(join(ROOT, "public"), file).split("\\").join("/");
  const stem = join(dirname(file), basename(file, extname(file)));

  for (const target of unique) {
    const out = `${stem}-${target}w.webp`;
    execFileSync("convert", [
      `${file}[0]`,
      "-auto-orient",
      "-strip",
      "-resize",
      `${target}x>`,
      "-define",
      "webp:method=6",
      ...(hasAlpha ? ["-define", "webp:alpha-quality=100"] : []),
      "-quality",
      "80",
      out,
    ]);
    after += statSync(out).size;
  }
  before += statSync(file).size;
  manifest[src] = { w: width, h: height, widths: unique };
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + "\n");
console.log(`${Object.keys(manifest).length} images; originals ${(before / 1024).toFixed(0)} KB, all WebP variants ${(after / 1024).toFixed(0)} KB`);
