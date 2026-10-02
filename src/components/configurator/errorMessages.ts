import {
  FileTooLargeError,
  NoVectorPathsFoundError,
  ParseError,
  TextNotOutlinedError,
  UnsupportedFormatError,
} from "./parseErrors";

/** The phrase the UI turns into a link to /contact. */
export const CONTACT_PHRASE = "send it to us directly";

/**
 * Maps a parse failure to customer-facing copy. The error classes' own
 * `message`s are developer-oriented (they include file names, byte counts and
 * pdf.js internals), so the UI never shows them — except TextNotOutlinedError,
 * whose message is already written for the customer.
 *
 * Every returned message contains CONTACT_PHRASE so the UI can link it.
 */
export function userMessageFor(error: unknown): string {
  if (error instanceof UnsupportedFormatError) {
    return `We support SVG and PDF right now. Export your logo as SVG, or ${CONTACT_PHRASE} and we'll quote it by hand.`;
  }
  if (error instanceof FileTooLargeError) {
    return `That file is over our 10MB limit. Try exporting a smaller SVG or PDF, or ${CONTACT_PHRASE} and we'll quote it by hand.`;
  }
  if (error instanceof ParseError) {
    return `That file couldn't be read — it may be corrupted. Try re-exporting it, or ${CONTACT_PHRASE}.`;
  }
  if (error instanceof TextNotOutlinedError) {
    return `${error.message} Or ${CONTACT_PHRASE}.`;
  }
  if (error instanceof NoVectorPathsFoundError) {
    return `We couldn't find a clean outline in this file. Please send us a vector file instead, or ${CONTACT_PHRASE}.`;
  }
  return `Something went wrong reading that file. Please try again, or ${CONTACT_PHRASE} and we'll quote it by hand.`;
}

/** Shown when typed text cannot be turned into letters (see TextRenderError). */
export const TEXT_RENDER_MESSAGE =
  "Couldn't render that text with this font. Try different characters or another font.";
