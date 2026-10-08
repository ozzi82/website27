import { useState, type KeyboardEvent, type ReactNode } from "react";
import { Download, RotateCcw, Sparkles, ZoomIn, ZoomOut } from "lucide-react";

/** Radians the camera turns per arrow-key press. */
export const KEY_ROTATE_STEP = (6 * Math.PI) / 180;

interface PreviewFrameProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  /** Orbit by (azimuth, polar) radians. */
  onRotate: (dTheta: number, dPhi: number) => void;
  /** When given, adds a "Download image" button (a high-resolution still of the current view). */
  onDownload?: () => Promise<void>;
  /** Hide the "Drag to rotate" hint (desktop shows the scene bar there instead). */
  hideHint?: boolean;
  /** Drop the zoom / reset buttons at the top right (desktop puts them in the floating bar). */
  hideControls?: boolean;
  /** Adds a "Photo render" button next to Download. */
  onRender?: () => void;
  /** A floating bar along the bottom edge. */
  bar?: ReactNode;
  children: ReactNode;
}

const BUTTON =
  "flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background/75 text-foreground backdrop-blur transition-colors hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:h-9 sm:w-9";

/**
 * Frames the 3D canvas with what a mouse-less or touch visitor needs: zoom and reset buttons,
 * and arrow / plus / minus / 0 keys while it has focus. Dragging and pinching are handled by
 * the camera controls inside the canvas.
 */
export default function PreviewFrame({ onZoomIn, onZoomOut, onReset, onRotate, onDownload, onRender, hideHint, hideControls, bar, children }: PreviewFrameProps) {
  const [downloading, setDownloading] = useState(false);
  async function handleDownload() {
    if (!onDownload || downloading) return;
    setDownloading(true);
    try {
      await onDownload();
    } finally {
      setDownloading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.ctrlKey || e.metaKey || e.altKey) return; // leave browser shortcuts (page zoom, back) alone
    switch (e.key) {
      case "ArrowLeft":
        onRotate(-KEY_ROTATE_STEP, 0);
        break;
      case "ArrowRight":
        onRotate(KEY_ROTATE_STEP, 0);
        break;
      case "ArrowUp":
        onRotate(0, -KEY_ROTATE_STEP);
        break;
      case "ArrowDown":
        onRotate(0, KEY_ROTATE_STEP);
        break;
      case "+":
      case "=":
        onZoomIn();
        break;
      case "-":
        onZoomOut();
        break;
      case "0":
        onReset();
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  return (
    <div
      role="group"
      tabIndex={0}
      aria-label="3D preview. Arrow keys rotate, plus and minus zoom, zero resets the view."
      onKeyDown={handleKeyDown}
      className="relative h-full min-h-[220px] w-full cursor-grab overflow-hidden rounded-xl border border-border bg-card active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
    >
      {children}
      {!hideControls && <div className="absolute right-3 top-3 flex flex-col gap-1.5">
        <button type="button" aria-label="Zoom in" title="Zoom in" onClick={onZoomIn} className={BUTTON}>
          <ZoomIn aria-hidden="true" className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Zoom out" title="Zoom out" onClick={onZoomOut} className={BUTTON}>
          <ZoomOut aria-hidden="true" className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Reset view" title="Reset view" onClick={onReset} className={BUTTON}>
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
        </button>

      </div>}
      {bar && <div className="absolute bottom-3 left-3 right-[17rem] z-10 flex justify-center">{bar}</div>}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
        {onRender && (
          <button
            type="button"
            aria-label="Photo render"
            title="Render a photorealistic picture of this view (about 30 seconds)"
            onClick={onRender}
            className="flex h-9 items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 text-xs font-semibold text-foreground backdrop-blur transition-colors hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">Photo render</span>
          </button>
        )}
      {onDownload && (
        <button
          type="button"
          aria-label="Download image"
          title="Download a high-resolution image of this view"
          onClick={handleDownload}
          disabled={downloading}
          className="flex h-9 items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 text-xs font-semibold text-foreground backdrop-blur transition-colors hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
        >
          <Download aria-hidden="true" className="h-4 w-4" />
          <span>{downloading ? "Rendering…" : "Download image"}</span>
        </button>
      )}
      </div>
      {!hideHint && <p className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/45 px-2.5 py-1 text-xs text-white/90">
        Drag to rotate · scroll or pinch to zoom
      </p>}
    </div>
  );
}
