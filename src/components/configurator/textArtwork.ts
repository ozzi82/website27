import type * as THREE from "three";
import { loadFont } from "./fontLoader";
import { TextRenderError, textToShapesWithInfo } from "./textToShapes";

export interface TextArtwork {
  /** `null` when there is nothing to draw (empty or whitespace-only text). */
  shapes: THREE.Shape[] | null;
  /** Characters the chosen font has no glyph for. */
  skipped: string[];
}

/**
 * Turns typed text into normalized sign shapes in the chosen bundled font. Empty text resolves to no shapes
 * (not an error) and never touches the network. Every failure — a font that will not load, text the font
 * cannot draw — surfaces as a TextRenderError.
 */
export async function generateTextShapes(text: string, fontId: string): Promise<TextArtwork> {
  if (text.trim() === "") return { shapes: null, skipped: [] };

  try {
    const font = await loadFont(fontId);
    const { shapes, skipped } = textToShapesWithInfo(text, font);
    return { shapes: shapes.length > 0 ? shapes : null, skipped };
  } catch (cause) {
    if (cause instanceof TextRenderError) throw cause;
    throw new TextRenderError("Could not render the text", { cause });
  }
}
