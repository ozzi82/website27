import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { clampTextInput, layoutText, textToShapes, TextRenderError, MAX_LINES, MAX_CHARS_PER_LINE, MAX_CHARS } from "../textToShapes";
import { loadMontserrat, loadTestFont } from "./helpers/loadTestFont";
import { fillMismatch } from "./helpers/fillCoverage";

const font = loadMontserrat();

/** Number of subpaths (M commands) in an SVG path string. */
const subpaths = (d: string) => (d.match(/M/g) ?? []).length;

function bounds(shapes: THREE.Shape[]) {
  const box = new THREE.Box2();
  for (const s of shapes) for (const p of s.getPoints(8)) box.expandByPoint(p);
  return box;
}

describe("layoutText", () => {
  it("produces a non-empty path for 'Hi'", () => {
    const { pathData } = layoutText("Hi", font);
    expect(pathData.length).toBeGreaterThan(0);
    expect(pathData).toMatch(/^M/);
  });

  it("never writes NaN or Infinity coordinates, however often a glyph repeats", () => {
    const { pathData } = layoutText("AAAAAA\nAAAAAA\nVVVVVV", font);
    expect(pathData).not.toMatch(/NaN|Infinity/);
  });

  it("produces more subpaths for more letters", () => {
    expect(subpaths(layoutText("Hello", font).pathData)).toBeGreaterThan(subpaths(layoutText("Hi", font).pathData));
  });

  it("returns an empty path for empty and whitespace-only text", () => {
    expect(layoutText("", font).pathData).toBe("");
    expect(layoutText("   \n \t ", font).pathData).toBe("");
  });

  it("draws the same glyphs with or without a space between words", () => {
    expect(subpaths(layoutText("A B", font).pathData)).toBe(subpaths(layoutText("AB", font).pathData));
  });

  it("does not crash on characters the font lacks, and reports them", () => {
    const { pathData, skipped } = layoutText("AłB", font); // l with stroke: latin-ext, not in the Latin subset
    expect(subpaths(pathData)).toBe(subpaths(layoutText("AB", font).pathData));
    expect(skipped).toEqual(["ł"]);
  });

  it("ignores emoji silently and does not split surrogate pairs", () => {
    const { pathData, skipped } = layoutText("Hi \u{1F600}\u{1F44D}", font);
    expect(subpaths(pathData)).toBe(subpaths(layoutText("Hi", font).pathData));
    expect(skipped).toEqual([]);
  });

  it("draws nothing for emoji-only text", () => {
    expect(layoutText("\u{1F600}", font).pathData).toBe("");
  });

  it("composes decomposed accents (NFC) so a combining acute draws like the precomposed letter", () => {
    expect(layoutText("Café", font).pathData).toBe(layoutText("Café", font).pathData);
  });

  it("caps very long text", () => {
    const capped = layoutText("W".repeat(5000), font).pathData;
    expect(capped).toBe(layoutText("W".repeat(MAX_CHARS_PER_LINE), font).pathData);
  });

  it("caps the number of lines and the total characters", () => {
    expect(MAX_LINES).toBe(3);
    expect(layoutText("A\nB\nC\nD\nE", font).pathData).toBe(layoutText("A\nB\nC", font).pathData);
    const full = "W".repeat(MAX_CHARS_PER_LINE);
    const rest = "W".repeat(MAX_CHARS - 2 * MAX_CHARS_PER_LINE);
    expect(layoutText([full, full, full].join("\n"), font).pathData).toBe(
      layoutText([full, full, rest].join("\n"), font).pathData
    );
  });

  it("drops control characters", () => {
    expect(layoutText("H\u0000i\u0007", font).pathData).toBe(layoutText("Hi", font).pathData);
  });
});

describe("clampTextInput", () => {
  it("leaves ordinary text alone", () => {
    expect(clampTextInput("Open 24/7\nCome in")).toBe("Open 24/7\nCome in");
  });

  it("limits the number of lines, characters per line and total characters", () => {
    expect(clampTextInput("a\nb\nc\nd")).toBe("a\nb\nc");
    expect(clampTextInput("x".repeat(60))).toBe("x".repeat(MAX_CHARS_PER_LINE));
    const full = "x".repeat(MAX_CHARS_PER_LINE);
    const clamped = clampTextInput([full, full, full].join("\n"));
    expect(clamped.replace(/\n/g, "")).toHaveLength(MAX_CHARS);
  });

  it("normalises Windows line endings", () => {
    expect(clampTextInput("a\r\nb")).toBe("a\nb");
  });
});

describe("textToShapes", () => {
  it("returns [] for empty and whitespace-only text", () => {
    expect(textToShapes("", font)).toEqual([]);
    expect(textToShapes("  \n  ", font)).toEqual([]);
  });

  it("returns normalized shapes: centred and the larger dimension is TARGET_SIZE", () => {
    const shapes = textToShapes("Sunlite", font);
    expect(shapes.length).toBeGreaterThanOrEqual(7);
    const box = bounds(shapes);
    expect(box.max.x - box.min.x).toBeCloseTo(2.4, 1);
    expect((box.min.x + box.max.x) / 2).toBeCloseTo(0, 1);
    expect((box.min.y + box.max.y) / 2).toBeCloseTo(0, 1);
  });

  it("makes the counter of O a real hole", () => {
    const shapes = textToShapes("O", font);
    expect(shapes).toHaveLength(1);
    expect(shapes[0].holes).toHaveLength(1);
  });

  it("makes holes for A, B (two) and e", () => {
    expect(textToShapes("A", font).flatMap((s) => s.holes)).toHaveLength(1);
    expect(textToShapes("B", font).flatMap((s) => s.holes)).toHaveLength(2);
    expect(textToShapes("e", font).flatMap((s) => s.holes)).toHaveLength(1);
  });

  it("renders upright and not mirrored: 'L' has a wide foot at the bottom and its stem on the left", () => {
    const shapes = textToShapes("L", font);
    const pts = shapes.flatMap((s) => s.getPoints(8));
    const box = bounds(shapes);
    const band = (box.max.y - box.min.y) * 0.15; // three.js is Y-up
    const bottom = pts.filter((p) => p.y < box.min.y + band);
    const top = pts.filter((p) => p.y > box.max.y - band);
    const spanX = (ps: THREE.Vector2[]) => Math.max(...ps.map((p) => p.x)) - Math.min(...ps.map((p) => p.x));
    expect(spanX(bottom)).toBeGreaterThan(spanX(top) * 1.5);
    expect(pts.filter((p) => p.x < 0).length).toBeGreaterThan(pts.length / 2);
  });

  it("lays two lines in two distinct vertical bands, first line on top", () => {
    const shapes = textToShapes("AAA\nBBB", font);
    const upper = shapes.filter((s) => bounds([s]).min.y > 0);
    const lower = shapes.filter((s) => bounds([s]).max.y < 0);
    expect(upper.length).toBeGreaterThan(0);
    expect(lower.length).toBeGreaterThan(0);
    expect(upper.length + lower.length).toBe(shapes.length); // nothing straddles the middle
    // Upper band holds A's (one counter each), lower holds B's (two each).
    expect(upper.every((s) => s.holes.length === 1)).toBe(true);
    expect(lower.every((s) => s.holes.length === 2)).toBe(true);
  });

  it("centre-aligns lines of different widths", () => {
    const shapes = textToShapes("WWWWWW\nI", font);
    const b = bounds(shapes.filter((s) => bounds([s]).max.y < 0));
    expect((b.min.x + b.max.x) / 2).toBeCloseTo(0, 1);
  });

  it("throws TextRenderError when non-blank text has nothing the font can draw", () => {
    expect(() => textToShapes("\u{1F600}", font)).toThrow(TextRenderError);
    expect(() => textToShapes("łł", font)).toThrow(TextRenderError);
  });

  it("wraps a font failure in TextRenderError", () => {
    const broken = Object.create(font, {
      charToGlyph: {
        value: () => ({
          advanceWidth: 500,
          getPath: () => {
            throw new Error("boom");
          },
        }),
      },
    }) as typeof font;
    expect(() => textToShapes("Hi", broken)).toThrow(TextRenderError);
  });
});

describe("every bundled font", () => {
  const fonts: [string, string, boolean][] = [
    // [package, file, has a closed O counter] — Lobster's and Pacifico's script Os are drawn as one looping
    // stroke, so their counters are part of the single outline instead of separate hole contours.
    ["montserrat", "montserrat-latin-700-normal.woff", true],
    ["poppins", "poppins-latin-700-normal.woff", true],
    ["bebas-neue", "bebas-neue-latin-400-normal.woff", true],
    ["oswald", "oswald-latin-600-normal.woff", true],
    ["playfair-display", "playfair-display-latin-700-normal.woff", true],
    ["arvo", "arvo-latin-700-normal.woff", true],
    ["pacifico", "pacifico-latin-400-normal.woff", true],
    ["lobster", "lobster-latin-400-normal.woff", false],
    ["yellowtail", "yellowtail-latin-400-normal.woff", false],
  ];
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");

  it.each(fonts)("%s: 'Sunlite' has at least 7 shapes", (pkg, file) => {
    expect(textToShapes("Sunlite", loadTestFont(pkg, file)).length).toBeGreaterThanOrEqual(7);
  });

  it.each(fonts.filter(([, , closedHole]) => closedHole))("%s: the counter of O is a real hole", (pkg, file) => {
    expect(textToShapes("O", loadTestFont(pkg, file)).flatMap((s) => s.holes).length).toBeGreaterThanOrEqual(1);
  });

  // What gets extruded (outline minus holes, as ExtrudeGeometry triangulates it) must cover the same area as the
  // font's own non-zero fill, so no counter is filled in and no overlapping stroke is lost.
  it.each(fonts)("%s: every letter and digit extrudes the shape the font draws", (pkg, file) => {
    const font = loadTestFont(pkg, file);
    const worst = chars.map((c) => [c, fillMismatch(font, c)] as const).sort((a, b) => b[1] - a[1])[0];
    expect(worst[1], `worst glyph: ${worst[0]}`).toBeLessThan(0.04);
  }, 60_000);
});
