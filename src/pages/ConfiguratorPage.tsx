import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import * as THREE from "three";
import { Button } from "@project/components/ui/button";
import Seo from "../components/Seo";
import ConfigChooser from "../components/configurator/ConfigChooser";
import UploadDropzone from "../components/configurator/UploadDropzone";
import ArtworkSourceToggle, { type ArtworkSource } from "../components/configurator/ArtworkSourceToggle";
import TextArtworkPanel from "../components/configurator/TextArtworkPanel";
import { useTextArtwork } from "../components/configurator/useTextArtwork";
import { DEFAULT_FONT_ID } from "../components/configurator/textFonts";
import ConfigControls from "../components/configurator/ConfigControls";
import SignPreview from "../components/configurator/SignPreview";
import PreviewErrorFallback from "../components/configurator/PreviewErrorFallback";
import { useWebglSupported } from "../components/configurator/webglSupport";
import { defaultStateFor } from "../components/configurator/types";
import type { ConfiguratorState } from "../components/configurator/types";
import { DEFAULT_BACKGROUND, type BackgroundId } from "../components/configurator/backgrounds";
import { configurations } from "../data/configurations";

function findConfig(id: string | null) {
  return configurations.find((c) => c.id === id);
}

export default function ConfiguratorPage() {
  const [searchParams] = useSearchParams();
  const preselected = findConfig(searchParams.get("config")); // an unknown id falls back to the chooser

  const [state, setState] = useState<ConfiguratorState | null>(
    preselected ? defaultStateFor(preselected) : null
  );
  // Each artwork source keeps its own result, so the sign shown always belongs to the source selected.
  const [source, setSource] = useState<ArtworkSource>("upload");
  const [uploadShapes, setUploadShapes] = useState<THREE.Shape[] | null>(null);
  const [text, setText] = useState("");
  const [fontId, setFontId] = useState(DEFAULT_FONT_ID);
  const textArtwork = useTextArtwork(text, fontId, source === "text");
  const shapes = source === "text" ? textArtwork.shapes : uploadShapes;

  // The wall is a scene preference, not part of a configuration: it survives picking another one.
  const background = useRef<BackgroundId>(DEFAULT_BACKGROUND);

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

  return (
    <div className="pt-28 pb-24 max-w-7xl mx-auto px-6">
      <Seo
        title="Sign Configurator"
        description="Upload your logo or type your text and see it rendered as a 3D channel-letter sign before you request a quote."
        path="/configurator"
      />
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
              onClick={() => setState(null)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Change configuration
            </button>
            {source === "upload" && uploadShapes && (
              <button
                onClick={() => setUploadShapes(null)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Use a different file
              </button>
            )}
          </div>

          <div className="mb-6">
            <ArtworkSourceToggle value={source} onChange={setSource} />
          </div>

          {source === "upload" && !uploadShapes && <UploadDropzone onParsed={setUploadShapes} />}

          {(source === "text" || uploadShapes) && (
            <div className="grid lg:grid-cols-[2fr_1fr] gap-8 mt-6">
              {source === "text" && (
                <div className="lg:col-start-2 lg:row-start-1">
                  <TextArtworkPanel
                    text={text}
                    onTextChange={setText}
                    fontId={fontId}
                    onFontChange={setFontId}
                    error={textArtwork.error}
                    skipped={textArtwork.skipped}
                    announcement={textArtwork.announcement}
                  />
                </div>
              )}
              <div className="lg:col-start-1 lg:row-start-1 lg:row-span-2">
                {shapes ? (
                  <ErrorBoundary FallbackComponent={PreviewErrorFallback} resetKeys={[shapes]}>
                    <SignPreview shapes={shapes} config={config} state={state} />
                  </ErrorBoundary>
                ) : (
                  <div className="w-full aspect-[4/3] rounded-xl border border-dashed border-border bg-card flex items-center justify-center p-8 text-center text-muted-foreground">
                    Type your text to see your sign here.
                  </div>
                )}
              </div>
              <div className="space-y-6 lg:col-start-2 lg:row-start-2">
                <ConfigControls config={config} state={state} onChange={handleChange} />
                <Button asChild size="lg" className="w-full">
                  <Link to="/contact">Get a Quote</Link>
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
