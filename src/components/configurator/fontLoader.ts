import type { Font } from "opentype.js";
import { findTextFont } from "./textFonts";

const cache = new Map<string, Promise<Font>>();

/**
 * Fetches and parses one bundled font. opentype.js and the font file are both loaded on first use, so none of
 * it is downloaded unless a visitor actually types text. Parsed fonts are cached for the session; a failed load
 * is not, so a flaky connection can recover on the next keystroke.
 */
export function loadFont(id: string): Promise<Font> {
  const cached = cache.get(id);
  if (cached) return cached;

  const promise = (async () => {
    const meta = findTextFont(id);
    if (!meta) throw new Error(`Unknown font: ${id}`);
    const [{ parse }, fileUrl] = await Promise.all([import("opentype.js"), meta.fileUrl()]);
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error(`Font request failed: ${response.status}`);
    return parse(await response.arrayBuffer());
  })();

  cache.set(id, promise);
  promise.catch(() => cache.delete(id));
  return promise;
}
