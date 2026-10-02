import { useEffect, useId } from "react";
import { TEXT_FONTS } from "./textFonts";
import { ensureFontFaces } from "./fontFaces";
import { MAX_CHARS, MAX_CHARS_PER_LINE, MAX_LINES, clampTextInput } from "./textToShapes";

interface TextArtworkPanelProps {
  text: string;
  onTextChange: (text: string) => void;
  fontId: string;
  onFontChange: (fontId: string) => void;
  /** Customer-facing message when the text could not be rendered. */
  error: string | null;
  /** Characters the chosen font has no glyph for. */
  skipped: string[];
  /** Polite live-region text ("Preview updated"). */
  announcement: string;
}

const FIELD = "w-full rounded-md border border-input bg-background px-3 py-2 text-base";

/** Typed-text artwork: a small multi-line box plus a picker of the bundled fonts, each shown in its own face. */
export default function TextArtworkPanel({
  text,
  onTextChange,
  fontId,
  onFontChange,
  error,
  skipped,
  announcement,
}: TextArtworkPanelProps) {
  const textId = useId();
  const hintId = useId();
  const fontName = useId();

  // Only text mode renders this panel, so the preview fonts are fetched only for visitors who use it.
  useEffect(() => {
    void ensureFontFaces();
  }, []);

  const used = Array.from(text.replace(/\n/g, "")).length;

  return (
    <section aria-label="Text artwork" className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor={textId}>
          Your text
        </label>
        <textarea
          id={textId}
          value={text}
          rows={2}
          placeholder="Your brand"
          spellCheck={false}
          autoComplete="off"
          aria-describedby={hintId}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onTextChange(clampTextInput(e.target.value))}
          className={`${FIELD} resize-none leading-snug`}
        />
        <p id={hintId} className="flex justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Up to {MAX_LINES} lines, {MAX_CHARS_PER_LINE} characters each. Press Enter for a new line.
          </span>
          <span aria-hidden="true">
            {used} / {MAX_CHARS}
          </span>
        </p>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {skipped.length > 0 && !error && (
          <p className="text-xs text-muted-foreground">
            Not available in this font, so left out: {skipped.map((c) => `‘${c}’`).join(" ")}. Try another font.
          </p>
        )}
      </div>

      <fieldset role="radiogroup" className="space-y-2">
        <legend className="text-sm font-medium mb-2">Font</legend>
        <div className="grid grid-cols-2 gap-2">
          {TEXT_FONTS.map((f) => (
            <label
              key={f.id}
              className="flex min-h-12 cursor-pointer items-center rounded-md border border-input bg-background px-3 py-2 has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary"
            >
              <input
                type="radio"
                name={fontName}
                value={f.id}
                checked={fontId === f.id}
                onChange={() => onFontChange(f.id)}
                className="sr-only"
              />
              <span className="text-lg leading-tight" style={{ fontFamily: `"${f.cssFamily}", sans-serif` }}>
                {f.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}
