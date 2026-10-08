import { useEffect, useId } from "react";
import { TEXT_FONTS, type TextFont } from "./textFonts";
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
  /** The fonts this configuration offers (the single-line neon fonts only go with LP 11-N). */
  fonts?: readonly TextFont[];
}

const FIELD = "w-full rounded-lg border-2 border-primary bg-card px-4 py-3 text-2xl font-semibold shadow-[0_0_0_4px_hsl(var(--primary)/0.15)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";

/** Typed-text artwork: a small multi-line box plus a picker of the bundled fonts, each shown in its own face. */
export default function TextArtworkPanel({
  text,
  onTextChange,
  fontId,
  onFontChange,
  error,
  skipped,
  announcement,
  fonts = TEXT_FONTS,
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
    <section aria-label="Text artwork" className="space-y-2">
      <div className="space-y-1">
        <label className="mono-label block text-primary" htmlFor={textId}>
          Type your text
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
        <p id={hintId} className="flex justify-between gap-2 text-[11px] leading-tight text-muted-foreground">
          <span>
            Up to {MAX_LINES} lines, {MAX_CHARS_PER_LINE} characters each. Enter starts a new line.
          </span>
          <span aria-hidden="true">
            {used} / {MAX_CHARS}
          </span>
        </p>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
        {skipped.length > 0 && !error && (
          <p className="text-[11px] leading-tight text-muted-foreground">
            Not available in this font, so left out: {skipped.map((c) => `‘${c}’`).join(" ")}. Try another font.
          </p>
        )}
      </div>

      <div role="radiogroup" aria-label="Font" className="grid grid-cols-4 gap-1">
        {fonts.map((f) => (
          <label
            key={f.id}
            title={f.label}
            className="flex h-8 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-1 has-[:checked]:border-primary has-[:checked]:ring-1 has-[:checked]:ring-primary has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary"
          >
            <input
              type="radio"
              name={fontName}
              value={f.id}
              checked={fontId === f.id}
              onChange={() => onFontChange(f.id)}
              className="sr-only"
            />
            <span className="truncate text-xs leading-tight" style={{ fontFamily: `"${f.cssFamily}", sans-serif` }}>
              {f.label}
            </span>
          </label>
        ))}
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}
