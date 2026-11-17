import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

/** One stop of the tour: what to point at, which step of the options to open, and what to say. */
export interface TourStop {
  /** CSS selector of the thing to point at. A stop whose target is not on the page (phone layout) is left out. */
  target: string;
  /** The options step to open for this stop. */
  panel?: string;
  title: string;
  text: string;
}

export const TOUR_STOPS: TourStop[] = [
  { target: '[data-tour="preview"]', title: "This is your sign", text: "It is built in 3D as you go. Drag it to turn it, scroll or pinch to zoom." },
  { target: '[data-tour-step="type"]', panel: "type", title: "1 · Pick the sign type", text: "How the letters are built and where the light comes out. Flip through them; your text stays." },
  { target: '[data-tour-step="text"]', panel: "text", title: "2 · Your text or logo", text: "Type the words and choose a font, or upload your logo as a PDF or SVG." },
  { target: '[data-tour-step="size"]', panel: "size", title: "3 · The size", text: "Enter the width or the height in inches; the other follows. The picture shows the measures." },
  { target: '[data-tour-step="colour"]', panel: "colour", title: "4 · The colour", text: "Pick the colour or finish of the letters." },
  { target: '[data-tour-step="light"]', panel: "light", title: "5 · The light", text: "Choose the light colour and brightness. The picture switches to night so you see it lit." },
  { target: '[data-tour="view"]', title: "Look at it your way", text: "Day or night, the wall behind it, and a picture to download." },
  { target: '[data-tour="actions"]', title: "When it looks right", text: "See it on a building, then ask for your wholesale price. We get your sign exactly as you built it." },
];

const SEEN_KEY = "sunlite-configurator-tour";

/** Whether this visitor has already answered the "show me how" question (never throws: storage may be blocked). */
export function tourAnswered(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) !== null;
  } catch {
    return true; // without storage the question would come back on every visit
  }
}

export function rememberTourAnswer(answer: "tour" | "skip") {
  try {
    window.localStorage.setItem(SEEN_KEY, answer);
  } catch {
    /* storage blocked: nothing to remember */
  }
}

/** The small question for a first-time visitor: a tour, or straight in (owner, 2026-11-17). */
export function TourOffer({ onTour, onSkip }: { onTour: () => void; onSkip: () => void }) {
  return (
    <div role="dialog" aria-label="First time here?" className="absolute left-3 top-3 z-20 w-[min(21rem,calc(100%-1.5rem))] rounded-2xl border border-border bg-card p-4 shadow-2xl">
      <p className="text-base font-semibold">First time here?</p>
      <p className="mt-1 text-sm text-muted-foreground">A one-minute tour shows you how to build your sign.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={onTour} className="h-10 flex-1 whitespace-nowrap rounded-lg bg-brand px-3 text-sm font-bold text-brand-foreground hover:bg-brand/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Show me how
        </button>
        <button type="button" onClick={onSkip} className="h-10 flex-1 whitespace-nowrap rounded-lg border border-input bg-background px-3 text-sm font-semibold hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
          I know how
        </button>
      </div>
    </div>
  );
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const CARD_W = 320;
const GAP = 14;

/** Where the card goes: beside the target on wide screens, above or below it on narrow ones, always inside the window. */
export function cardPosition(box: Box, view: { w: number; h: number }, cardH: number): { left: number; top: number } {
  const w = Math.min(CARD_W, view.w - 24);
  const clampX = (x: number) => Math.max(12, Math.min(view.w - w - 12, x));
  const clampY = (y: number) => Math.max(12, Math.min(view.h - cardH - 12, y));
  if (view.w >= 1024) {
    const left = box.x - w - GAP >= 12 ? box.x - w - GAP : box.x + box.w + GAP + w <= view.w - 12 ? box.x + box.w + GAP : clampX(box.x + box.w - w - GAP);
    return { left, top: clampY(box.y + Math.min(24, box.h / 4)) };
  }
  const below = box.y + box.h + GAP;
  const top = below + cardH <= view.h - 12 ? below : box.y - cardH - GAP >= 12 ? box.y - cardH - GAP : clampY(view.h - cardH - 12);
  return { left: clampX(box.x + box.w / 2 - w / 2), top };
}

/**
 * The guided tour: a dimmed page with the current thing left bright, and a card that says what it is for. Each stop
 * opens its step of the options, so the preview turns and labels what the step changes.
 */
export default function ConfiguratorTour({ onPanel, onClose }: { onPanel: (id: string) => void; onClose: () => void }) {
  // Only the stops that exist in this layout (the view toolbar is desktop only).
  const [stops] = useState(() => TOUR_STOPS.filter((s) => s.panel || document.querySelector(s.target)));
  const [at, setAt] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [cardH, setCardH] = useState(190);
  const stop = stops[at];

  const measure = useCallback(() => {
    const el = stop ? document.querySelector<HTMLElement>(stop.target) : null;
    if (!el) return setBox(null);
    const r = el.getBoundingClientRect();
    setBox({ x: r.left, y: r.top, w: r.width, h: r.height });
  }, [stop]);

  useEffect(() => {
    if (stop?.panel) onPanel(stop.panel);
    // The step opens and the page settles before the target is measured (and again, in case it grew).
    const timers = [60, 320, 700].map((ms) => window.setTimeout(measure, ms));
    const el = stop ? document.querySelector<HTMLElement>(stop.target) : null;
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at]);

  useLayoutEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!stop) return null;
  const view = { w: window.innerWidth, h: window.innerHeight };
  const pos = box ? cardPosition(box, view, cardH) : { left: Math.max(12, view.w / 2 - CARD_W / 2), top: Math.max(12, view.h / 2 - cardH / 2) };
  const last = at === stops.length - 1;
  return (
    <div className="fixed inset-0 z-[70]" data-testid="configurator-tour">
      {/* The bright window on the target; its huge shadow dims everything else. Clicks outside the card do nothing. */}
      {box ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed rounded-2xl ring-2 ring-brand transition-all duration-300"
          style={{ left: box.x - 6, top: box.y - 6, width: box.w + 12, height: box.h + 12, boxShadow: "0 0 0 9999px rgba(10, 13, 20, 0.62)" }}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-[rgba(10,13,20,0.62)]" />
      )}
      <div
        role="dialog"
        aria-label={`Tour, step ${at + 1} of ${stops.length}: ${stop.title}`}
        ref={(el) => {
          if (el && Math.abs(el.offsetHeight - cardH) > 2) setCardH(el.offsetHeight);
        }}
        className="fixed rounded-2xl border border-border bg-card p-4 shadow-2xl transition-all duration-300"
        style={{ left: pos.left, top: pos.top, width: Math.min(CARD_W, view.w - 24) }}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-base font-semibold">{stop.title}</p>
          <button type="button" aria-label="Close the tour" onClick={onClose} className="-mr-1 -mt-1 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{stop.text}</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground" aria-hidden="true">
            {at + 1} / {stops.length}
          </span>
          <span className="flex-1" />
          {at > 0 && (
            <button type="button" onClick={() => setAt(at - 1)} className="flex h-9 items-center gap-1 rounded-lg border border-input bg-background px-3 text-sm font-semibold hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Back
            </button>
          )}
          <button
            type="button"
            autoFocus
            onClick={() => (last ? onClose() : setAt(at + 1))}
            className="flex h-9 items-center gap-1 rounded-lg bg-brand px-3 text-sm font-bold text-brand-foreground hover:bg-brand/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {last ? "Start building" : "Next"}
            {!last && <ArrowRight aria-hidden="true" className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
