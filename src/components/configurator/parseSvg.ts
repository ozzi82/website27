import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { ParseError, TextNotOutlinedError, NoVectorPathsFoundError } from "./parseErrors";

export function parseSvg(svgText: string): THREE.Shape[] {
  const xmlDoc = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const parserError = xmlDoc.getElementsByTagName("parsererror")[0];
  if (parserError) {
    throw new ParseError("artwork.svg", new Error(parserError.textContent ?? "invalid SVG markup"));
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

  if (shapes.length === 0) {
    throw new NoVectorPathsFoundError();
  }

  return shapes;
}
