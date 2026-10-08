import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
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
import { generateTextArtworkFile } from "../components/configurator/textArtwork";
import { DEFAULT_FONT_ID, TEXT_FONTS, fontsFor, usableFontId } from "../components/configurator/textFonts";
import ConfigControls from "../components/configurator/ConfigControls";
import ConfigSwitcher from "../components/configurator/ConfigSwitcher";
import ConfiguratorHeader from "../components/configurator/ConfiguratorHeader";
import SceneBar from "../components/configurator/SceneBar";
import ConfigSummaryCard from "../components/configurator/ConfigSummaryCard";
import { useDesktop } from "../components/configurator/useDesktop";
import ConfiguratorPanel from "../components/configurator/ConfiguratorPanel";
import { ArrowRight, Building2, Lightbulb, Mountain, Palette, Ruler, Type } from "lucide-react";
import SignPreview, { type CaptureSnapshot } from "../components/configurator/SignPreview";
import PreviewErrorFallback from "../components/configurator/PreviewErrorFallback";
import { useWebglSupported } from "../components/configurator/webglSupport";
import { defaultStateFor, effectiveConfig, emitsLight, formatDepth, switchConfig, withBuild, withFinish } from "../components/configurator/types";
import type { ConfiguratorState } from "../components/configurator/types";
import { DEFAULT_BACKGROUND, type BackgroundId } from "../components/configurator/backgrounds";
import { formatConfigSummary, configSummaryRows, type ArtworkInfo } from "../components/configurator/configSummary";
import { saveQuote, quoteFileId, type ArtworkFileMeta, type QuoteSnapshot } from "../components/configurator/quoteStorage";
import { clearArtworkFile, saveArtworkFile } from "../components/configurator/artworkFileStorage";
import { strokeHeightRatio, thinStrokeAdvice } from "../components/configurator/strokeGuard";
import { BRUSHED_SWATCH, GLOW_SWATCHES, PAINT_SWATCHES, describeColor } from "../components/configurator/swatches";
import { MM_PER_INCH, aspectOf, clampSizeIn, dimensionsIn, formatSize } from "../components/configurator/realSize";
import ThinStrokeNotice from "../components/configurator/ThinStrokeNotice";
import ConfiguratorDisclaimer from "../components/configurator/ConfiguratorDisclaimer";
import { isLp1, isLp1FinishId } from "../components/configurator/lp1Materials";
import { configurations } from "../data/configurations";
import { CTA_PRIMARY } from "../lib/cta";
import { trackEvent } from "../lib/tracking";
import { SITE_URL } from "../lib/seo";
import { CONFIGURATOR_META, CONFIGURATOR_NAME, configuratorJsonLd } from "../lib/configuratorMeta";

/** While a product is being configured the page is a full-screen app: the site's header and footer step aside and the configurator's own slim header takes over. */
function AppChrome({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    document.documentElement.classList.add("cfg-app");
    return () => document.documentElement.classList.remove("cfg-app");
  }, []);
  return (
    <>
      <ConfiguratorHeader />
      {children}
    </>
  );
}

const BuildingView = lazy(() => import("../components/configurator/BuildingView"));

/** Building a sign starts with text, and this word, so there is something lit to look at straight away. */
const PRESET_TEXT = "SUNLITE";
const NO_SHAPES: THREE.Shape[] = [];
const JSON_LD = configuratorJsonLd(SITE_URL);

function findConfig(id: string | null) {
  return configurations.find((c) => c.id === id);
}

/** The starting state of a deep link: `?config=<id>`, optionally `&mount=flush|standoff`, plus `&finish=<LP 1 finish>&build=solid|fabricated` for LP 1. */
function initialState(params: URLSearchParams): ConfiguratorState | null {
  const config = findConfig(params.get("config")); // an unknown id falls back to the chooser
  if (!config) return null;
  let state = defaultStateFor(config);
  const size = Number(params.get("size"));
  if (params.get("size") && Number.isFinite(size) && size > 0) state = { ...state, sizeIn: clampSizeIn(size) };
  const mount = params.get("mount");
  if ((mount === "flush" || mount === "standoff") && config.mounts.includes(mount)) state = { ...state, mounting: mount };
  if (isLp1(config)) {
    const finish = params.get("finish");
    if (isLp1FinishId(finish)) state = withFinish(state, finish);
    const build = params.get("build");
    if (build === "solid" || build === "fabricated") state = withBuild(state, build);
  }
  return state;
}

export default function ConfiguratorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<ConfiguratorState | null>(() => initialState(searchParams));
  // Text first, with the preset word; `?source=upload` opens on the logo upload instead.
  const startSource: ArtworkSource = searchParams.get("source") === "upload" ? "upload" : "text";
  // Each artwork source keeps its own result, so the sign shown always belongs to the source selected.
  const [source, setSource] = useState<ArtworkSource>(startSource);
  const [uploadShapes, setUploadShapes] = useState<THREE.Shape[] | null>(null);
  // The original file is kept as well as the parsed shapes: it travels to the contact form with the quote.
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [text, setText] = useState(startSource === "text" ? PRESET_TEXT : "");
  const [pickedFontId, setFontId] = useState(DEFAULT_FONT_ID);
  // As chosen (LP 5 or LP 5+3.1), and the font actually used: the single-line neon fonts only go with LP 11-N.
  const baseConfig = findConfig(state?.configId ?? null);
  const config = baseConfig && state ? effectiveConfig(baseConfig, state) : baseConfig;
  const fontId = config ? usableFontId(config, pickedFontId) : pickedFontId;
  const textArtwork = useTextArtwork(text, fontId, source === "text");
  const shapes = source === "text" ? textArtwork.shapes : uploadShapes;
  const artworkTracked = useRef<string | null>(null);
  useEffect(() => {
    if (shapes && artworkTracked.current !== source) {
      artworkTracked.current = source;
      trackEvent("configurator_artwork", { source }); // "text" or "upload": someone actually saw a sign built from their input
    }
  }, [shapes, source]);
  const desktop = useDesktop();
  const [thumb, setThumb] = useState<string | null>(null);
  // A small picture of the current sign for the summary card, refreshed once things settle.
  useEffect(() => {
    if (!desktop || !shapes) return;
    const t = setTimeout(() => {
      void capture.current?.().then((url) => url && setThumb(url));
    }, 1600);
    return () => clearTimeout(t);
  }, [desktop, shapes, state]);
  const lineCount = text.split("\n").filter((l) => l.trim()).length;
  // Average stroke over the artwork's height; the thin-stroke note compares it with the real size (see strokeGuard.ts).
  const strokeRatio = useMemo(() => (shapes ? strokeHeightRatio(shapes) : null), [shapes]);
  const aspect = useMemo(() => aspectOf(shapes ?? []), [shapes]);
  const letterLines = source === "text" ? Math.max(1, lineCount) : 1;
  const artworkHeightMm = state ? dimensionsIn(state.sizeIn, aspect).height * MM_PER_INCH : null;

  // The wall is a scene preference, not part of a configuration: it survives picking another one.
  const background = useRef<BackgroundId>(DEFAULT_BACKGROUND);
  const capture = useRef<CaptureSnapshot | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [building, setBuilding] = useState(false);
  const openBuilding = useCallback(() => setBuilding(true), []);
  const closeBuilding = useCallback(() => setBuilding(false), []);

  const webglSupported = useWebglSupported();

  function handleChange(next: ConfiguratorState) {
    background.current = next.background;
    // What visitors adjust, for the analytics (one event per changed option, no personal data).
    if (state) {
      for (const key of ["dayNight", "mounting", "depthMm", "sizeIn", "glowColor", "color", "background", "finish", "build", "variant"] as const) {
        if (next[key] !== state[key]) trackEvent("configurator_option", { option: key, value: String(next[key]), configuration: state.configId });
      }
    }
    setState(next);
  }

  // Picking a configuration from the chooser starts from its defaults; switching while configuring keeps the visitor's
  // colours, brightness, day/night, background and (when still offered) depth. Artwork is untouched either way:
  // parsing is configuration-agnostic.
  function handleSelectConfig(id: string) {
    const selected = findConfig(id);
    if (!selected) return;
    trackEvent("configurator_system", { configuration: id });
    setState((prev) => (prev ? switchConfig(prev, selected) : { ...defaultStateFor(selected), background: background.current }));
  }

  function handleParsed(parsed: THREE.Shape[], file: File) {
    setUploadFile(file);
    setUploadShapes(parsed);
  }

  function clearUpload() {
    setUploadShapes(null);
    setUploadFile(null);
  }

  /** The artwork as a file for the quote: the visitor's own upload, or an SVG of the typed text. */
  async function artworkFileForQuote(): Promise<{ file: File; generated: boolean } | null> {
    if (source === "text") {
      if (!shapes || !text.trim()) return null;
      const file = await generateTextArtworkFile(text, fontId);
      return file ? { file, generated: true } : null;
    }
    return uploadShapes && uploadFile ? { file: uploadFile, generated: false } : null;
  }

  /** The configuration as it will be quoted, with an optional snapshot of the 3D preview and artwork file. */
  function buildQuote(image: string | null, savedAt = Date.now(), artworkFile: ArtworkFileMeta | null = null): QuoteSnapshot | null {
    if (!config || !state) return null;
    const artwork: ArtworkInfo | null =
      source === "text"
        ? shapes && text.trim()
          ? { kind: "text", text, fontLabel: TEXT_FONTS.find((f) => f.id === fontId)?.label ?? fontId }
          : null
        : uploadShapes
          ? { kind: "upload", fileName: uploadFile?.name || "uploaded artwork" }
          : null;
    const extras = { note: thinStrokeAdvice(config, strokeRatio, artworkHeightMm, letterLines)?.message, aspect };
    return {
      v: 1,
      summary: formatConfigSummary(state, config, artwork, extras),
      rows: configSummaryRows(state, config, artwork, extras),
      image,
      savedAt,
      ...(artworkFile ? { artworkFile } : {}),
    };
  }

  // The quote button (the site's primary CTA) carries the configuration to /contact: router state for this visit,
  // sessionStorage for a refresh.
  async function handleQuote(e: MouseEvent<HTMLAnchorElement>) {
    trackEvent("configurator_quote_click", { configuration: config?.id });
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      const quote = buildQuote(null); // a new tab / window: no snapshot, but the summary still travels via sessionStorage
      if (quote) saveQuote(quote);
      return;
    }
    e.preventDefault();
    if (quoting) return;
    setQuoting(true);
    const savedAt = Date.now();
    const snapshot = async () => {
      try {
        return (await capture.current?.()) ?? null;
      } catch {
        return null; // a failed snapshot must never block the quote
      }
    };
    const [image, artwork] = await Promise.all([snapshot(), artworkFileForQuote().catch(() => null)]);
    // The file is stored (IndexedDB) before leaving, so /contact can attach it to the form. If that fails the quote
    // simply goes without a file.
    let artworkFile: ArtworkFileMeta | null = null;
    if (artwork && (await saveArtworkFile(artwork.file, quoteFileId({ savedAt })))) {
      artworkFile = { name: artwork.file.name, size: artwork.file.size, generated: artwork.generated };
    } else {
      void clearArtworkFile(); // do not leave an earlier quote's file behind
    }
    const quote = buildQuote(image, savedAt, artworkFile);
    if (quote) saveQuote(quote);
    navigate("/contact", { state: quote ? { quote } : null });
  }

  if (!webglSupported) {
    return (
      <div className="pt-28 pb-24 max-w-2xl mx-auto px-6 text-center">
        <Seo title={CONFIGURATOR_META.title} description={CONFIGURATOR_META.description} path={CONFIGURATOR_META.path} jsonLd={JSON_LD} />
        <h1 className="text-3xl font-bold mb-4">3D preview isn't supported in this browser</h1>
        <p className="text-muted-foreground mb-6">
          You can still send us your logo directly and we'll quote it by hand.
        </p>
        <Button asChild size="lg" className="uppercase tracking-wider font-semibold">
          <Link to={CTA_PRIMARY.to}>{CTA_PRIMARY.label}</Link>
        </Button>
      </div>
    );
  }

  const seo = <Seo title={CONFIGURATOR_META.title} description={CONFIGURATOR_META.description} path={CONFIGURATOR_META.path} jsonLd={JSON_LD} />;

  // Preview stage: the 3D preview and every option side by side, sized to the viewport so nothing needs scrolling.
  if (config && state && (source === "text" || uploadShapes)) {
    const paintName = describeColor(state.color, [BRUSHED_SWATCH, ...PAINT_SWATCHES]).replace(/ \(#[0-9a-f]{6}\)$/i, "");
    const glowName = describeColor(state.glowColor, GLOW_SWATCHES).replace(/ \(#[0-9a-f]{6}\)$/i, "");
    const summaryItems = [
      { label: "Text", value: source === "text" ? text.split("\n").filter((l) => l.trim()).join(" / ") || "—" : uploadFile?.name ?? "Uploaded logo" },
      ...(source === "text" ? [{ label: "Font", value: fontsFor(config).find((f) => f.id === fontId)?.label ?? "" }] : []),
      { label: "Width × Height", value: formatSize(state.sizeIn, aspect).replace(/ \(.*\)$/, "") },
      { label: "Depth", value: formatDepth(state.depthMm) },
      { label: "Colour", value: paintName },
      ...(emitsLight(config) ? [{ label: "Lighting", value: glowName }] : []),
    ].filter((i) => i.value);
    return (
      <AppChrome>
        <div className="mx-auto max-w-[1700px] px-3 pb-2 pt-2 sm:px-5 lg:pb-3 lg:pt-3">
          {seo}
          <h1 className="sr-only">{CONFIGURATOR_NAME}</h1>
          <div className="flex h-[calc(100svh-128px)] min-h-[420px] flex-col gap-2 lg:h-[calc(100svh-88px)] lg:min-h-[500px] lg:flex-row lg:gap-5">
            {/* Phones: the preview stays pinned under the header while the options scroll beneath it. */}
            <div className="flex min-h-[200px] min-w-0 flex-1 flex-col gap-3">
              {/* The 3D canvas stays mounted while the text is empty or being rebuilt: tearing it down and starting a new WebGL context is what made the preview vanish for a second. */}
              <div className="relative min-h-0 w-full flex-1">
                <ErrorBoundary FallbackComponent={PreviewErrorFallback} resetKeys={[shapes]}>
                  <SignPreview shapes={shapes ?? NO_SHAPES} config={config} state={state} captureRef={capture} hideHint={desktop} renderBar={desktop ? (camera) => <SceneBar state={state} onChange={handleChange} camera={camera} /> : undefined} />
                </ErrorBoundary>
                {desktop && (
                  <>
                    <div className="absolute left-3 top-3 z-10 w-[min(24rem,70%)] rounded-xl border border-border bg-background/85 p-1.5 backdrop-blur">
                      <ConfigSwitcher value={config.id} onChange={handleSelectConfig} />
                    </div>
                  </>
                )}
                <ThinStrokeNotice config={config} strokeRatio={strokeRatio} heightMm={artworkHeightMm} lines={letterLines} />
                {!shapes && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center text-muted-foreground">
                    <span className="rounded-full bg-black/55 px-4 py-2 text-sm text-white/90">Type your text to see your sign here.</span>
                  </div>
                )}
              </div>
              {desktop && state && <ConfigSummaryCard items={summaryItems} thumb={thumb} />}
            </div>

            <aside className="flex min-w-0 flex-col lg:min-h-0 lg:w-[460px] lg:shrink-0 lg:rounded-2xl lg:border lg:border-border lg:bg-muted lg:p-5 xl:w-[500px]">
              {desktop && (
                <div className="mb-4 shrink-0">
                  <h2 className="text-3xl font-semibold">Make it yours</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Configure your sign in real time.</p>
                </div>
              )}
              <ConfiguratorPanel
                tabs={[
                  {
                    id: "text",
                    label: "Text",
                    heading: "Your artwork",
                    icon: <Type />,
                    content: (
                      <>
              {!desktop && <ConfigSwitcher value={config.id} onChange={handleSelectConfig} />}

              <ArtworkSourceToggle value={source} onChange={setSource} />

              {source === "upload" && uploadShapes && (
                <p className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span className="min-w-0 truncate">{uploadFile?.name}</span>
                  <button
                    type="button"
                    onClick={clearUpload}
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
                  fonts={fontsFor(config)}
                  compact={desktop}
                  onFontChange={setFontId}
                  error={textArtwork.error}
                  skipped={textArtwork.skipped}
                  announcement={textArtwork.announcement}
                />
              )}

                      </>
                    ),
                  },
                  { id: "size", label: "Size", heading: "Size and build", icon: <Ruler />, content: <ConfigControls config={baseConfig ?? config} state={state} onChange={handleChange} strokeRatio={strokeRatio} aspect={aspect} lines={letterLines} adviceInPreview group="size" /> },
                  { id: "colour", label: "Colour", heading: "Colour and finish", icon: <Palette />, content: <ConfigControls config={baseConfig ?? config} state={state} onChange={handleChange} strokeRatio={strokeRatio} aspect={aspect} lines={letterLines} adviceInPreview group="colour" /> },
                  { id: "light", label: "Light", heading: "Lighting", icon: <Lightbulb />, content: <ConfigControls config={baseConfig ?? config} state={state} onChange={handleChange} strokeRatio={strokeRatio} aspect={aspect} lines={letterLines} adviceInPreview group="light" /> },
                  ...(desktop ? [] : [
                  {
                      id: "look",
                      label: "Look",
                      icon: <Mountain />,
                      content: (
                        <>
                          <ConfigControls config={baseConfig ?? config} state={state} onChange={handleChange} strokeRatio={strokeRatio} aspect={aspect} lines={letterLines} adviceInPreview group="look" />
                <ConfiguratorDisclaimer />
  
  
                        </>
                      ),
                    },
                    ]),
                ]}
                action={
                  <>
                    <Button type="button" variant="outline" disabled={!shapes} onClick={openBuilding} className="h-12 min-w-0 flex-1 gap-2 whitespace-normal rounded-xl border-input bg-card px-3 text-sm font-semibold leading-tight hover:bg-card">
                      <Building2 aria-hidden="true" className="h-5 w-5 shrink-0" />
                      Preview on a building
                    </Button>
                    <Button asChild className="h-12 min-w-0 flex-[1.3] whitespace-normal rounded-xl bg-brand px-3 text-sm font-bold text-brand-foreground hover:bg-brand/90">
                      <Link to={CTA_PRIMARY.to} onClick={handleQuote} aria-busy={quoting || undefined} className="gap-2 text-center leading-tight">
                        {CTA_PRIMARY.label}
                        <ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0" />
                      </Link>
                    </Button>
                  </>
                }
              />
            </aside>
          </div>
          {building && shapes && (
            <Suspense fallback={null}>
              <BuildingView shapes={shapes} config={config} state={state} onClose={closeBuilding} />
            </Suspense>
          )}
        </div>
      </AppChrome>
    );
  }

  return (
    <div className="pt-12 pb-24 max-w-7xl mx-auto px-6">
      {seo}
      <h1 className="text-5xl md:text-7xl mb-4">{CONFIGURATOR_NAME}</h1>

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
