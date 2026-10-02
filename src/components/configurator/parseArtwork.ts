import * as THREE from "three";
import { parseSvg } from "./parseSvg";
import { parsePdf } from "./parsePdf";
import { normalizeShapes } from "./normalizeShapes";
import { UnsupportedFormatError, FileTooLargeError } from "./parseErrors";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export async function parseArtwork(file: File): Promise<THREE.Shape[]> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new FileTooLargeError(file.size, MAX_FILE_SIZE_BYTES);
  }

  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "svg") {
    const text = await file.text();
    return normalizeShapes(parseSvg(text));
  }

  if (extension === "pdf") {
    const data = new Uint8Array(await file.arrayBuffer());
    return normalizeShapes(await parsePdf(data));
  }

  throw new UnsupportedFormatError(file.name);
}
