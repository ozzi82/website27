import * as THREE from "three";
import { parseSvg } from "./parseSvg";
import { normalizeShapes } from "./normalizeShapes";
import { UnsupportedFormatError, FileTooLargeError, NoVectorPathsFoundError } from "./parseErrors";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export async function parseArtwork(file: File): Promise<THREE.Shape[]> {
  const shapes = await parseShapes(file);
  // Normalization drops shapes with no outline; if nothing drawable is left
  // there is no sign to preview.
  if (shapes.length === 0) throw new NoVectorPathsFoundError();
  return shapes;
}

async function parseShapes(file: File): Promise<THREE.Shape[]> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new FileTooLargeError(file.size, MAX_FILE_SIZE_BYTES);
  }

  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "svg") {
    const text = await file.text();
    return normalizeShapes(parseSvg(text));
  }

  // An Illustrator .ai file saved with "Create PDF Compatible File" (the default) is a PDF inside, so it takes the PDF path.
  if (extension === "pdf" || extension === "ai") {
    const data = new Uint8Array(await file.arrayBuffer());
    // Lazy-loaded: pdf.js is large and SVG-only users shouldn't download it.
    const { parsePdf } = await import("./parsePdf");
    return normalizeShapes(await parsePdf(data));
  }

  throw new UnsupportedFormatError(file.name);
}
