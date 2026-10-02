import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { parseSvg, MAX_SVG_ELEMENTS, MAX_SVG_USE_ELEMENTS, MAX_SVG_SHAPES } from "../parseSvg";
import { ParseError, TextNotOutlinedError, NoVectorPathsFoundError } from "../parseErrors";

const SIMPLE_SQUARE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M10 10 H90 V90 H10 Z" />
</svg>`;

const SQUARE_WITH_HOLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M10 10 H90 V90 H10 Z M30 30 H70 V70 H30 Z" fill-rule="evenodd" />
</svg>`;

const MULTI_SHAPE_MULTI_COLOR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M10 10 H40 V40 H10 Z" fill="red" />
  <path d="M60 60 H90 V90 H60 Z" fill="blue" />
</svg>`;

const LIVE_TEXT_ONLY = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30">
  <text x="10" y="20">Logo</text>
</svg>`;

const MIXED_SHAPE_AND_TEXT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M10 10 H40 V40 H10 Z" />
  <text x="50" y="50">Logo</text>
</svg>`;

const RASTER_ONLY = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <image href="data:image/png;base64,iVBORw0KGgo=" width="100" height="100" />
</svg>`;

// Both sub-paths wound the same direction (clockwise) — a correctly-authored
// hole needs opposite winding between the outer and inner path. This fixture
// represents a real-world malformed export, not a crafted edge case.
const SAME_WINDING_NO_HOLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M10 10 H90 V90 H10 Z M30 30 V70 H70 V30 Z" />
</svg>`;

const CORRUPT = `<svg xmlns="http://www.w3.org/2000/svg"><path d="M10 10 L`; // truncated, unclosed tags

describe("parseSvg", () => {
  it("parses a single clean path into one shape", () => {
    const shapes = parseSvg(SIMPLE_SQUARE);
    expect(shapes.length).toBe(1);
    expect(shapes[0]).toBeInstanceOf(THREE.Shape);
  });

  it("parses a path with a hole (correct winding) with the hole intact", () => {
    const shapes = parseSvg(SQUARE_WITH_HOLE);
    expect(shapes.length).toBe(1);
    expect(shapes[0].holes.length).toBe(1);
  });

  it("parses multiple separate shapes regardless of color", () => {
    const shapes = parseSvg(MULTI_SHAPE_MULTI_COLOR);
    expect(shapes.length).toBe(2);
  });

  it("throws TextNotOutlinedError for an SVG with only live text", () => {
    expect(() => parseSvg(LIVE_TEXT_ONLY)).toThrow(TextNotOutlinedError);
  });

  it("throws TextNotOutlinedError even when outlined shapes are also present", () => {
    expect(() => parseSvg(MIXED_SHAPE_AND_TEXT)).toThrow(TextNotOutlinedError);
  });

  it("throws NoVectorPathsFoundError for an SVG with only a raster image", () => {
    expect(() => parseSvg(RASTER_ONLY)).toThrow(NoVectorPathsFoundError);
  });

  it("throws ParseError for malformed/truncated SVG markup", () => {
    expect(() => parseSvg(CORRUPT)).toThrow(ParseError);
  });

  it("accepted v1 limitation: malformed winding produces a shape without the intended hole, not a crash or error", () => {
    const shapes = parseSvg(SAME_WINDING_NO_HOLE);
    expect(shapes.length).toBeGreaterThan(0);
    // Intentionally not asserting holes.length === 0 or === 1 here — the point
    // of this test is that parsing completes without throwing, documenting
    // the known limitation rather than pinning its exact (unreliable) output.
  });

  describe("complexity caps (hostile or huge files)", () => {
    const wrap = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${inner}</svg>`;

    it("rejects a document with more than MAX_SVG_ELEMENTS elements with a ParseError", () => {
      const svg = wrap('<path d="M0 0H1V1Z"/>'.repeat(MAX_SVG_ELEMENTS + 1));
      expect(() => parseSvg(svg)).toThrow(ParseError);
      expect(() => parseSvg(svg)).toThrow(/too many elements/i);
    });

    it("rejects more than MAX_SVG_USE_ELEMENTS <use> elements (billion-laughs style fan-out)", () => {
      const svg = wrap(
        '<defs><path id="a" d="M0 0H1V1Z"/></defs>' + '<use href="#a"/>'.repeat(MAX_SVG_USE_ELEMENTS + 1)
      );
      expect(() => parseSvg(svg)).toThrow(ParseError);
      expect(() => parseSvg(svg)).toThrow(/<use>/);
    });

    it("rejects a file that produces more than MAX_SVG_SHAPES shapes", () => {
      // Well under the element cap, so this exercises the post-SVGLoader check.
      const svg = wrap('<path d="M0 0H1V1Z"/>'.repeat(MAX_SVG_SHAPES + 1));
      expect(() => parseSvg(svg)).toThrow(ParseError);
      expect(() => parseSvg(svg)).toThrow(/too many shapes/i);
    });

    it("accepts a file with exactly MAX_SVG_SHAPES shapes", () => {
      const svg = wrap('<path d="M0 0H1V1Z"/>'.repeat(MAX_SVG_SHAPES));
      expect(parseSvg(svg)).toHaveLength(MAX_SVG_SHAPES);
    });
  });
});
