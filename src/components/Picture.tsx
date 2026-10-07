import type { ImgHTMLAttributes } from "react";
import { imageInfo, webpSrcSet } from "../lib/images";

type PictureProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "srcSet" | "src"> & {
  src: string;
  /** How wide the image is drawn, for the browser to pick the right copy (e.g. "(min-width: 1024px) 33vw, 100vw"). Default: full width. */
  sizes?: string;
  /** Above-the-fold image: loaded eagerly with high priority. */
  priority?: boolean;
};

/**
 * An <img> that offers responsive WebP copies (made by scripts/optimize-images.mjs) and falls back to the original file.
 * Width and height come from the manifest when not given, so the page never jumps while images load.
 */
export default function Picture({ src, sizes = "100vw", priority = false, width, height, loading, decoding = "async", ...rest }: PictureProps) {
  const info = imageInfo(src);
  const srcSet = webpSrcSet(src);
  const img = (
    <img
      src={src}
      width={width ?? info?.w}
      height={height ?? info?.h}
      loading={loading ?? (priority ? "eager" : "lazy")}
      decoding={decoding}
      {...(priority ? { fetchpriority: "high" } : {})}
      {...rest}
    />
  );
  if (!srcSet) return img;
  return (
    <picture className="contents">
      <source type="image/webp" srcSet={srcSet} sizes={sizes} />
      {img}
    </picture>
  );
}
