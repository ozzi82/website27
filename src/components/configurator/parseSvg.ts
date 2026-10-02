import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { ParseError, TextNotOutlinedError, NoVectorPathsFoundError } from "./parseErrors";

// Guards against hostile or accidentally enormous files (traced bitmaps,
// <use> fan-out) locking up the browser tab during parse, triangulation or
// extrusion. Generous for real logos, which are typically tens of elements.
export const MAX_SVG_ELEMENTS = 20_000;
export const MAX_SVG_USE_ELEMENTS = 50;
export const MAX_SVG_SHAPES = 500;

export function parseSvg(svgText: string): THREE.Shape[] {
  const xmlDoc = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const parserError = xmlDoc.getElementsByTagName("parsererror")[0];
  if (parserError) {
    throw new ParseError("artwork.svg", new Error(parserError.textContent ?? "invalid SVG markup"));
  }

  if (xmlDoc.getElementsByTagName("*").length > MAX_SVG_ELEMENTS) {
    throw new ParseError(
      "artwork.svg",
      new Error(`too many elements (more than ${MAX_SVG_ELEMENTS.toLocaleString("en-US")})`)
    );
  }
  if (xmlDoc.getElementsByTagName("use").length > MAX_SVG_USE_ELEMENTS) {
    throw new ParseError(
      "artwork.svg",
      new Error(`too many <use> elements (more than ${MAX_SVG_USE_ELEMENTS})`)
    );
  }

  if (xmlDoc.getElementsByTagName("text").length > 0) {
    throw new TextNotOutlinedError();
  }

  let paths: ReturnType<SVGLoader["parse"]>["paths"];
  try {
    paths = new SVGLoader().parse(svgText).paths;
  } catch (cause) {
    throw new ParseError("artwork.svg", cause);
  }

  const shapes: THREE.Shape[] = [];
  for (const path of paths) {
    shapes.push(...path.toShapes());
  }

  if (shapes.length > MAX_SVG_SHAPES) {
    throw new ParseError("artwork.svg", new Error(`too many shapes (more than ${MAX_SVG_SHAPES})`));
  }

  if (shapes.length === 0) {
    throw new NoVectorPathsFoundError();
  }

  return shapes;
}
