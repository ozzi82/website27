import { useMemo, useRef, useState, type MouseEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import * as THREE from "three";
import { Button } from "@project/components/ui/button";
import Seo from "../components/Seo";
import ConfigChooser from "../components/configurator/ConfigChooser";
import UploadDropzone from "../components/configurator/UploadDropzone";
import ArtworkSourceToggle, { type ArtworkSource } from "../components/configurator/ArtworkSourceToggle";
import TextArtworkPanel from "../components/configurator/TextArtworkPanel";
import { useTextArtwork } from "../components/configurator/useTextArtwork";
import { DEFAULT_FONT_ID, TEXT_FONTS } from "../components/configurator/textFonts";
import ConfigControls from "../components/configurator/ConfigControls";
import SignPreview, { type CaptureSnapshot } from "../components/configurator/SignPreview";
import PreviewErrorFallback from "../components/configurator/PreviewErrorFallback";
import { useWebglSupported } from "../components/configurator/webglSupport";
import { defaultStateFor } from "../components/configurator/types";
import type { ConfiguratorState } from "../components/configurator/types";
import { DEFAULT_BACKGROUND, type BackgroundId } from "../components/configurator/backgrounds";
import { formatConfigSummary, configSummaryRows, type ArtworkInfo } from "../components/configurator/configSummary";
import { saveQuote, type QuoteSnapshot } from "../components/configurator/quoteStorage";
import { lineStackFactor, strokeHeightRatio, thinStrokeAdvice } from "../components/configurator/strokeGuard";
import { configurations } from "../data/configurations";

function findConfig(id: string | null) {
  return configurations.find((c) => c.id === id);
}

export default function ConfiguratorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselected = findConfig(searchParams.get("config")); // an unknown id falls back to the chooser

  const [state, setState] = useState<ConfiguratorState | null>(
    preselected ? defaultStateFor(preselected) : null
  );
  // Each artwork source keeps its own result, so the sign shown always belongs to the source selected.
  const [source, setSource] = useState<ArtworkSource>("upload");
  const [uploadShapes, setUploadShapes] = useState<THREE.Shape[] | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [text, setText] = useState("");
  const [fontId, setFontId] = useState(DEFAULT_FONT_ID);
  const textArtwork = useTextArtwork(text, fontId, source === "text");
  const shapes = source === "text" ? textArtwork.shapes : uploadShapes;
  const lineCount = text.split("\n").filter((l) => l.trim()).length;
  // Typed text is measured against one line's letters, not the whole stack of lines.
  const strokeRatio = useMemo(() => {
    const ratio = shapes ? strokeHeightRatio(shapes) : null;
    return ratio !== null && source === "text" ? ratio * lineStackFactor(lineCount) : ratio;
  }, [shapes, source, lineCount]);

  // The wall is a scene preference, not part of a configuration: it survives picking another one.
  const background = useRef<BackgroundId>(DEFAULT_BACKGROUND);
  const capture = useRef<CaptureSnapshot | null>(null);
  const [quoting, setQuoting] = useState(false);

  const webglSupported = useWebglSupported();
  const config = findConfig(state?.configId ?? null);

  function handleChange(next: ConfiguratorState) {
    background.current = next.background;
    setState(next);
  }

  function handleSelectConfig(id: string) {
    const selected = findConfig(id);
    if (selected) setState({ ...defaultStateFor(selected), background: background.current }); // shapes, if any, are intentionally left as-is — parsing is configuration-agnostic.
  }

  function handleParsed(parsed: THREE.Shape[], fileName: string) {
    setUploadName(fileName);
    setUploadShapes(parsed);
  }

  /** The configuration as it will be quoted, with an optional snapshot of the 3D preview. */
  function buildQuote(image: string | null): QuoteSnapshot | null {
    if (!config || !state) return null;
    const artwork: ArtworkInfo | null =
      source === "text"
        ? shapes && text.trim()
          ? { kind: "text", text, fontLabel: TEXT_FONTS.find((f) => f.id === fontId)?.label ?? fontId }
          : null
        : uploadShapes
          ? { kind: "upload", fileName: uploadName || "uploaded artwork" }
          : null;
    const extras = { note: thinStrokeAdvice(config, strokeRatio)?.message };
    return {
      v: 1,
      summary: formatConfigSummary(state, config, artwork, extras),
      rows: configSummaryRows(state, config, artwork, extras),
      image,
      savedAt: Date.now(),
    };
  }

  // "Get a Quote" carries the configuration to /contact: router state for this visit, sessionStorage for a refresh.
  async function handleQuote(e: MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      const quote = buildQuote(null); // a new tab / window: no snapshot, but the summary still travels via sessionStorage
      if (quote) saveQuote(quote);
      return;
    }
    e.preventDefault();
    if (quoting) return;
    setQuoting(true);
    let image: string | null = null;
    try {
      image = (await capture.current?.()) ?? null;
    } catch {
      image = null; // a failed snapshot must never block the quote
    }
    const quote = buildQuote(image);
    if (quote) saveQuote(quote);
    navigate("/contact", { state: quote ? { quote } : null });
  }

  if (!webglSupported) {
    return (
      <div className="pt-28 pb-24 max-w-2xl mx-auto px-6 text-center">
        <Seo
          title="Sign Configurator"
          description="Upload your logo or type your text and see it rendered as a 3D channel-letter sign before you request a quote."
          path="/configurator"
        />
        <h1 className="text-3xl font-bold mb-4">3D preview isn't supported in this browser</h1>
        <p className="text-muted-foreground mb-6">
          You can still send us your logo directly and we'll quote it by hand.
        </p>
        <Button asChild size="lg">
          <Link to="/contact">Get a Quote</Link>
        </Button>
      </div>
    );
  }

  const seo = (
    <Seo
      title="Sign Configurator"
      description="Upload your logo or type your text and see it rendered as a 3D channel-letter sign before you request a quote."
      path="/configurator"
    />
  );

  // Preview stage: the 3D preview and every option side by side, sized to the viewport so nothing needs scrolling.
  if (config && state && (source === "text" || uploadShapes)) {
    return (
      <div className="mx-auto max-w-[1700px] px-3 pb-10 pt-3 sm:px-5 lg:pb-3">
        {seo}
        <h1 className="sr-only">Sign Configurator</h1>
        <div className="flex flex-col gap-3 lg:h-[calc(100svh-117px)] lg:min-h-[560px] lg:flex-row lg:gap-5">
          {/* Phones: the preview stays pinned under the header while the options scroll beneath it. */}
          <div className="sticky top-[65px] z-10 -mx-3 h-[36svh] min-h-[230px] bg-background px-3 pb-2 sm:-mx-5 sm:px-5 lg:static lg:z-auto lg:m-0 lg:h-auto lg:min-w-0 lg:flex-1 lg:bg-transparent lg:p-0">
            {shapes ? (
              <ErrorBoundary FallbackComponent={PreviewErrorFallback} resetKeys={[shapes]}>
                <SignPreview shapes={shapes} config={config} state={state} captureRef={capture} />
              </ErrorBoundary>
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center text-muted-foreground">
                Type your text to see your sign here.
              </div>
            )}
          </div>

          <aside aria-label="Sign options" className="flex min-w-0 flex-col gap-2.5 [@media(min-height:830px)]:gap-4 lg:w-[440px] lg:shrink-0 lg:overflow-y-auto lg:pr-1">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 leading-tight">
                <span className="mono-label text-primary">{config.code}</span>{" "}
                <span className="text-sm font-semibold">{config.subtitle}</span>
              </p>
              <button
                type="button"
                aria-label="Change configuration"
                onClick={() => setState(null)}
                className="shrink-0 text-xs text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                ← Change
              </button>
            </div>

            <ArtworkSourceToggle value={source} onChange={setSource} />

            {source === "upload" && uploadShapes && (
              <p className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                <span className="min-w-0 truncate">{uploadName}</span>
                <button
                  type="button"
                  onClick={() => setUploadShapes(null)}
                  className="shrink-0 underline hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  Use a different file
                </button>
              </p>
            )}

            {source === "text" && (
              <TextArtworkPanel
                text={text}
                onTextChange={setText}
                fontId={fontId}
                onFontChange={setFontId}
                error={textArtwork.error}
                skipped={textArtwork.skipped}
                announcement={textArtwork.announcement}
              />
            )}

            <ConfigControls config={config} state={state} onChange={handleChange} strokeRatio={strokeRatio} />

            <Button asChild size="lg" className="mt-auto w-full">
              <Link to="/contact" onClick={handleQuote} aria-busy={quoting || undefined}>
                Get a Quote
              </Link>
            </Button>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-12 pb-24 max-w-7xl mx-auto px-6">
      {seo}
      <h1 className="text-5xl md:text-7xl mb-4">Sign Configurator</h1>

      {!config && <ConfigChooser onSelect={handleSelectConfig} />}

      {config && state && (
        <>
          <p className="mb-4">
            <span className="mono-label text-primary">{config.code}</span>{" "}
            <span className="text-lg font-semibold">{config.subtitle}</span>
          </p>
          <div className="flex gap-6 mb-6">
            <button
              type="button"
              aria-label="Change configuration"
              onClick={() => setState(null)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Change configuration
            </button>
          </div>

          <div className="mb-6 max-w-xs">
            <ArtworkSourceToggle value={source} onChange={setSource} />
          </div>

          <UploadDropzone onParsed={handleParsed} />
        </>
      )}
    </div>
  );
}
