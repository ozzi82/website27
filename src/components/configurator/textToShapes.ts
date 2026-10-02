import type * as THREE from "three";
import type { Font, Glyph, Path } from "opentype.js";
import { parseSvg } from "./parseSvg";
import { normalizeShapes } from "./normalizeShapes";

/** Typed failure for "this text could not be turned into letters"; the UI maps it to friendly copy. */
export class TextRenderError extends Error {
  readonly cause?: unknown;
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "TextRenderError";
    this.cause = options?.cause;
  }
}

export const MAX_LINES = 3;
export const MAX_CHARS_PER_LINE = 40;
export const MAX_CHARS = 100;

/** Em-square size the glyph outlines are laid out in; the preview rescales them anyway. */
const FONT_SIZE = 100;
const LINE_HEIGHT = 1.2;
const DECIMALS = 2;
const MAX_REPORTED_SKIPPED = 8;
/** Look at no more than this much pasted text before the real caps apply. */
const MAX_RAW_LENGTH = 2000;

// Emoji (with their joiners, modifiers and flags), zero-width marks and variation selectors are dropped
// silently: no sign font draws them and listing them as "unavailable" would just be noise.
const IGNORED = /[\p{Extended_Pictographic}\p{Emoji_Modifier}\p{Regional_Indicator}​-‏⁠︎️﻿]/gu;
const CONTROL = /\p{Cc}/gu;

export interface TextLayout {
  /** One SVG path `d` string for the whole text, y-down; empty when nothing is drawable. */
  pathData: string;
  /** Distinct characters the font has no glyph for (left out of the sign). */
  skipped: string[];
}

/**
 * What the text box keeps of what was typed or pasted: at most MAX_LINES lines, MAX_CHARS_PER_LINE characters
 * on each and MAX_CHARS in all (newlines do not count), so the visitor sees the limit as they hit it.
 */
export function clampTextInput(value: string): string {
  let budget = MAX_CHARS;
  return value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .slice(0, MAX_LINES)
    .map((line) => {
      const kept = Array.from(line).slice(0, Math.min(MAX_CHARS_PER_LINE, budget)).join("");
      budget -= Array.from(kept).length;
      return kept;
    })
    .join("\n");
}

/** Applies the line, per-line and total character caps, dropping blank lines at both ends. */
function capLines(lines: string[][]): string[][] {
  const out = lines.map((l) => l.slice(0, MAX_CHARS_PER_LINE));
  while (out.length > 0 && out[0].join("").trim() === "") out.shift();
  while (out.length > 0 && out[out.length - 1].join("").trim() === "") out.pop();
  let budget = MAX_CHARS;
  return out.slice(0, MAX_LINES).map((line) => {
    const kept = line.slice(0, budget);
    budget -= kept.length;
    return kept;
  });
}

/**
 * Glyph outlines for one line, centred on x = 0 with its baseline at `baseline`. Advances and pair kerning are
 * applied per glyph here rather than through `font.getPath(text)`, which also runs the font's substitution
 * features (ligatures, contextual forms) and throws on lookup types opentype.js has not implemented (Oswald's).
 */
function linePaths(line: string, baseline: number, font: Font): string[] {
  const scale = FONT_SIZE / font.unitsPerEm;
  const glyphs = Array.from(line).map((ch) => font.charToGlyph(ch));
  const xs: number[] = [];
  let pen = 0;
  glyphs.forEach((glyph, i) => {
    xs.push(pen);
    pen += (glyph.advanceWidth ?? 0) * scale;
    if (i < glyphs.length - 1) pen += kerning(font, glyph, glyphs[i + 1]) * scale;
  });
  const offset = -pen / 2;
  const out: string[] = [];
  glyphs.forEach((glyph, i) => {
    const d = toPathData(glyph.getPath(offset + xs[i], baseline, FONT_SIZE));
    if (d !== "") out.push(d);
  });
  return out;
}

const num = (n: number) => String(Number(n.toFixed(DECIMALS)));

/**
 * SVG path data from opentype commands. Written out here because opentype.js 2.0.0's own `toPathData` can emit
 * `NaN` coordinates (its decimal-rounding cache is keyed by the fractional part alone).
 */
function toPathData(path: Path): string {
  let d = "";
  let open = false;
  for (const c of path.commands) {
    if (c.type === "M") {
      if (open) d += "Z ";
      d += `M${num(c.x)} ${num(c.y)} `;
      open = true;
    } else if (c.type === "L") {
      d += `L${num(c.x)} ${num(c.y)} `;
    } else if (c.type === "Q") {
      d += `Q${num(c.x1)} ${num(c.y1)} ${num(c.x)} ${num(c.y)} `;
    } else if (c.type === "C") {
      d += `C${num(c.x1)} ${num(c.y1)} ${num(c.x2)} ${num(c.y2)} ${num(c.x)} ${num(c.y)} `;
    } else if (c.type === "Z" && open) {
      d += "Z ";
      open = false;
    }
  }
  if (open) d += "Z";
  return d.trim();
}

function kerning(font: Font, left: Glyph, right: Glyph): number {
  try {
    return font.getKerningValue(left, right) || 0;
  } catch {
    return 0; // an exotic kerning lookup is not worth failing the whole sign for
  }
}

/**
 * Lays text out as outlines, centre-aligned, one line per row at 1.2em line height. opentype's `getPath`
 * already returns SVG-oriented (y-down) coordinates, so the result goes straight through `parseSvg` and
 * `normalizeShapes` like an uploaded file; the first line stays on top.
 */
export function layoutText(text: string, font: Font): TextLayout {
  const normalized = text.slice(0, MAX_RAW_LENGTH).normalize("NFC").replace(/\r\n?/g, "\n").replace(/\t/g, " ");

  const skipped = new Set<string>();
  const lines = normalized.split("\n").map((raw) =>
    Array.from(raw.replace(IGNORED, "").replace(CONTROL, "")).filter((ch) => {
      if (/\s/u.test(ch)) return true;
      if (font.charToGlyphIndex(ch) > 0) return true;
      skipped.add(ch);
      return false;
    })
  );

  try {
    const parts: string[] = [];
    capLines(lines).forEach((chars, row) => {
      const line = chars.join("").trim();
      if (line === "") return;
      parts.push(...linePaths(line, row * FONT_SIZE * LINE_HEIGHT, font));
    });
    return { pathData: parts.join(" "), skipped: [...skipped].slice(0, MAX_REPORTED_SKIPPED) };
  } catch (cause) {
    throw new TextRenderError("Could not lay the text out with this font", { cause });
  }
}

/** `[]` for empty or whitespace-only text; throws TextRenderError when real text cannot be drawn. */
export function textToShapes(text: string, font: Font): THREE.Shape[] {
  return textToShapesWithInfo(text, font).shapes;
}

/** Like `textToShapes`, but also reports the characters the font left out. */
export function textToShapesWithInfo(text: string, font: Font): { shapes: THREE.Shape[]; skipped: string[] } {
  if (text.trim() === "") return { shapes: [], skipped: [] };

  const { pathData, skipped } = layoutText(text, font);
  if (pathData === "") throw new TextRenderError("This font has none of those characters");

  try {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path d="${pathData}"/></svg>`;
    const shapes = normalizeShapes(parseSvg(svg));
    if (shapes.length === 0) throw new TextRenderError("The text produced no outlines");
    return { shapes, skipped };
  } catch (cause) {
    if (cause instanceof TextRenderError) throw cause;
    throw new TextRenderError("Could not build letters from this text", { cause });
  }
}
