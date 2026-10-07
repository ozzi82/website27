import * as THREE from "three";
import { TARGET_SIZE } from "./normalizeShapes";

/**
 * True-scale sizing. The artwork is always normalised to TARGET_SIZE (2.4) world units along its larger side, so the camera,
 * lights and wall never have to change; what changes with the size the visitor enters is how many millimetres one world
 * unit stands for. Depth, standoff, the lit band, spacers, the glow reach and the wall's texture all start from real
 * millimetres and are converted here, so a 12" sign looks like a 12" sign and a 20 ft one like a 20 ft one.
 */
export const MM_PER_INCH = 25.4;
export const DEFAULT_SIZE_IN = 100;
export const MIN_SIZE_IN = 6;
export const MAX_SIZE_IN = 600;

/** Millimetres one world unit stands for, when the larger side of the artwork is `sizeIn` inches. */
export const mmPerUnit = (sizeIn: number): number => (sizeIn * MM_PER_INCH) / TARGET_SIZE;

/** A length in millimetres as world units, at this size. */
export const mmToWorld = (mm: number, sizeIn: number): number => mm / mmPerUnit(sizeIn);

/** World units back to millimetres, at this size. */
export const worldToMm = (units: number, sizeIn: number): number => units * mmPerUnit(sizeIn);

/** Whole-number-friendly clamp of a typed size: NaN or empty falls back to the default. */
export function clampSizeIn(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_SIZE_IN;
  return Math.min(MAX_SIZE_IN, Math.max(MIN_SIZE_IN, value));
}

export interface ArtworkAspect {
  /** Width over height of the artwork's bounding box. */
  ratio: number;
}

/** Width / height of the normalised artwork (1 when there is nothing to measure). */
export function aspectOf(shapes: THREE.Shape[]): number {
  if (shapes.length === 0) return 1;
  const box = new THREE.Box2();
  for (const shape of shapes) {
    const { shape: outline, holes } = shape.extractPoints(12);
    for (const p of outline) box.expandByPoint(p);
    for (const hole of holes) for (const p of hole) box.expandByPoint(p);
  }
  const w = box.max.x - box.min.x;
  const h = box.max.y - box.min.y;
  return w > 0 && h > 0 ? w / h : 1;
}

/** Width and height in inches when the larger side is `sizeIn`. */
export function dimensionsIn(sizeIn: number, aspect: number): { width: number; height: number } {
  return aspect >= 1 ? { width: sizeIn, height: sizeIn / aspect } : { width: sizeIn * aspect, height: sizeIn };
}

/** The larger-side size that gives this width in inches (the visitor typed the width). */
export function sizeFromWidthIn(widthIn: number, aspect: number): number {
  return clampSizeIn(aspect >= 1 ? widthIn : widthIn / aspect);
}

/** The larger-side size that gives this height in inches (the visitor typed the height). */
export function sizeFromHeightIn(heightIn: number, aspect: number): number {
  return clampSizeIn(aspect >= 1 ? heightIn * aspect : heightIn);
}

/** `100″` or `18.4″`: whole inches from 10 up, one decimal below. */
export function formatInches(inches: number): string {
  const rounded = inches >= 10 ? Math.round(inches) : Math.round(inches * 10) / 10;
  return `${rounded}″`;
}

/** `100″ × 18″ (2540 × 457 mm)` */
export function formatSize(sizeIn: number, aspect: number): string {
  const { width, height } = dimensionsIn(sizeIn, aspect);
  return `${formatInches(width)} × ${formatInches(height)} (${Math.round(width * MM_PER_INCH)} × ${Math.round(height * MM_PER_INCH)} mm)`;
}
