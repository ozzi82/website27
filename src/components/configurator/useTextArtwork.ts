import { useEffect, useState } from "react";
import type * as THREE from "three";
import { generateTextShapes } from "./textArtwork";
import { TEXT_RENDER_MESSAGE } from "./errorMessages";

/** How long typing must pause before the sign is rebuilt. */
export const TEXT_DEBOUNCE_MS = 250;

export interface TextArtworkState {
  /** The shapes for the current text and font; `null` for nothing to draw or a failure. */
  shapes: THREE.Shape[] | null;
  /** Characters the font has no glyph for. */
  skipped: string[];
  /** Customer-facing message when the text could not be rendered. */
  error: string | null;
  /** True from the first change until its result lands. */
  busy: boolean;
  /** Text for a polite live region; empty while an update is pending. */
  announcement: string;
}

const EMPTY: TextArtworkState = { shapes: null, skipped: [], error: null, busy: false, announcement: "" };

/**
 * Debounced, cancellable text -> shapes. While `enabled` is false nothing runs and the last result is kept, so
 * switching back to text mode shows the previous sign straight away. Blank text clears the preview immediately
 * (no error); a failure clears it too, with a friendly message, rather than leaving a stale sign on screen.
 * The previous shapes stay on screen while a new result is being built, so typing does not flicker.
 */
export function useTextArtwork(text: string, fontId: string, enabled: boolean): TextArtworkState {
  const [state, setState] = useState<TextArtworkState>(EMPTY);

  useEffect(() => {
    if (!enabled) return;

    if (text.trim() === "") {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, busy: true, announcement: "" }));
    const timer = setTimeout(() => {
      generateTextShapes(text, fontId).then(
        ({ shapes, skipped }) => {
          if (cancelled) return;
          setState({ shapes, skipped, error: null, busy: false, announcement: shapes ? "Preview updated" : "" });
        },
        (err) => {
          if (cancelled) return;
          console.error("Text artwork failed:", err);
          setState({ shapes: null, skipped: [], error: TEXT_RENDER_MESSAGE, busy: false, announcement: "" });
        }
      );
    }, TEXT_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text, fontId, enabled]);

  return state;
}
