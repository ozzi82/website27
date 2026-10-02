import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { parseSvg } from "../parseSvg";
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
});
