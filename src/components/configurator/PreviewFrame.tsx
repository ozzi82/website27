import type { KeyboardEvent, ReactNode } from "react";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

/** Radians the camera turns per arrow-key press. */
export const KEY_ROTATE_STEP = (6 * Math.PI) / 180;

interface PreviewFrameProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  /** Orbit by (azimuth, polar) radians. */
  onRotate: (dTheta: number, dPhi: number) => void;
  children: ReactNode;
}

const BUTTON =
  "flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background/75 text-foreground backdrop-blur transition-colors hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:h-9 sm:w-9";

/**
 * Frames the 3D canvas with what a mouse-less or touch visitor needs: zoom and reset buttons,
 * and arrow / plus / minus / 0 keys while it has focus. Dragging and pinching are handled by
 * the camera controls inside the canvas.
 */
export default function PreviewFrame({ onZoomIn, onZoomOut, onReset, onRotate, children }: PreviewFrameProps) {
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
      className="relative w-full aspect-[4/3] cursor-grab overflow-hidden rounded-xl border border-border bg-card active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
    >
      {children}
      <div className="absolute right-3 top-3 flex flex-col gap-1.5">
        <button type="button" aria-label="Zoom in" title="Zoom in" onClick={onZoomIn} className={BUTTON}>
          <ZoomIn aria-hidden="true" className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Zoom out" title="Zoom out" onClick={onZoomOut} className={BUTTON}>
          <ZoomOut aria-hidden="true" className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Reset view" title="Reset view" onClick={onReset} className={BUTTON}>
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      <p className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/45 px-2.5 py-1 text-xs text-white/90">
        Drag to rotate · scroll or pinch to zoom
      </p>
    </div>
  );
}
