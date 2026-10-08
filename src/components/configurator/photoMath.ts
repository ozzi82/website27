import { dimensionsIn, mmToWorld, MM_PER_INCH } from "./realSize";

/** The sign's larger side may cover at most this share of the photo's width / height before the visitor adjusts it. */
const START_WIDTH_SHARE = 0.35;
const START_HEIGHT_SHARE = 0.3;

export interface Point {
  x: number;
  y: number;
}

/** Pixels in the photo that stand for one real inch, from two points the visitor placed on something of known length. */
export function pxPerInFromReference(a: Point, b: Point, inches: number): number | null {
  const px = Math.hypot(b.x - a.x, b.y - a.y);
  return px > 0 && inches > 0 ? px / inches : null;
}

/** Photo pixels per inch when nothing was measured: sized so the sign looks natural at the entered size (about a third of the photo). */
export function startPxPerIn(imgW: number, imgH: number, sizeIn: number, aspect: number): number {
  const { width, height } = dimensionsIn(sizeIn, aspect);
  return Math.min((START_WIDTH_SHARE * imgW) / width, (START_HEIGHT_SHARE * imgH) / height);
}

/** The photo's size in the scene's world units, given how many pixels stand for an inch. */
export function photoWorldSize(imgW: number, imgH: number, pxPerIn: number, sizeIn: number): { w: number; h: number } {
  const unitsPerInch = mmToWorld(MM_PER_INCH, sizeIn);
  return { w: (imgW / pxPerIn) * unitsPerInch, h: (imgH / pxPerIn) * unitsPerInch };
}

/** Camera distance at which a plane of this height exactly fills a camera with this vertical field of view. */
export function distanceToFill(planeHeight: number, fovDeg: number): number {
  return planeHeight / 2 / Math.tan((fovDeg * Math.PI) / 360);
}

/** Largest rectangle of the photo's aspect that fits inside the box. */
export function fitInside(boxW: number, boxH: number, imgW: number, imgH: number): { w: number; h: number } {
  const k = Math.min(boxW / imgW, boxH / imgH);
  return { w: Math.max(1, Math.floor(imgW * k)), h: Math.max(1, Math.floor(imgH * k)) };
}

/** Longest side kept after loading: enough for a sharp download, small enough for any phone's GPU. */
export const PHOTO_MAX_SIDE = 2400;

export function scaleToMaxSide(w: number, h: number, max = PHOTO_MAX_SIDE): { w: number; h: number } {
  const k = Math.min(1, max / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) };
}
