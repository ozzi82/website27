import { TEXT_FONTS } from "./textFonts";

const STYLE_ID = "sign-text-fonts";
let pending: Promise<void> | null = null;

/**
 * Registers `@font-face` rules for the picker previews, using the same bundled files the 3D letters are built
 * from. Called when text mode is first shown, so visitors who upload a logo never download any of it.
 * `font-display: swap` keeps the picker usable while the files arrive.
 */
export function ensureFontFaces(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  pending ??= (async () => {
    const urls = await Promise.all(TEXT_FONTS.map((f) => f.fileUrl()));
    // The weight is declared "normal" on purpose: each file is already the bold (or regular) cut the sign uses,
    // and the previews must not be synthetically emboldened on top of it.
    const css = TEXT_FONTS.map(
      (f, i) =>
        `@font-face{font-family:"${f.cssFamily}";src:url("${urls[i]}") format("woff");font-weight:normal;font-style:normal;font-display:swap}`
    ).join("\n");
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = css;
  })().catch((err) => {
    pending = null; // allow a retry; the picker simply falls back to the page font meanwhile
    console.error("Could not register the sign text fonts:", err);
  });
  return pending;
}
