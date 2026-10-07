import manifest from "../data/image-manifest.json";

export interface ImageInfo {
  /** Pixel size of the original file. */
  w: number;
  h: number;
  /** Widths of the WebP copies made by `scripts/optimize-images.mjs`. */
  widths: number[];
}

const MANIFEST = manifest as Record<string, ImageInfo>;

export function imageInfo(src: string): ImageInfo | undefined {
  return MANIFEST[src];
}

/** `/images/a.jpg` -> `/images/a-960w.webp` */
export function webpVariant(src: string, width: number): string {
  return src.replace(/\.(jpe?g|png)$/i, `-${width}w.webp`);
}

/** The srcset of the WebP copies, or undefined when the file has none (SVG, video poster, unknown). */
export function webpSrcSet(src: string): string | undefined {
  const info = imageInfo(src);
  if (!info || info.widths.length === 0) return undefined;
  return info.widths.map((w) => `${webpVariant(src, w)} ${w}w`).join(", ");
}
