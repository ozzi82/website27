import { useId } from "react";
import { cn } from "@project/lib/utils";

interface DepthComparisonProps {
  /** "md" fits a two-column homepage section, "lg" is a full-width figure for product pages. */
  size?: "md" | "lg";
  className?: string;
  /** Hide the illustrative-drawing note (keep it unless the surrounding page states the same thing). */
  hideNote?: boolean;
}

const WALL_X = 30; // mounting surface
const STROKE_H = 56; // height of the drawn stroke section
const CONVENTIONAL_DEPTH = 250; // drawn deeper on purpose: illustrative, no depth is claimed for it
const ULTRA_SLIM_DEPTH = 70; // drawn in the 25-30 mm band

/** One stroke cross-section: back on the wall, returns top and bottom, lit face on the right. */
function Profile({ cy, depth, uid }: { cy: number; depth: number; uid: string }) {
  const x1 = WALL_X + depth;
  const top = cy - STROKE_H / 2;
  const bottom = cy + STROKE_H / 2;
  const glowW = Math.min(depth - 8, 60);
  return (
    <g>
      <line x1={10} y1={cy} x2={x1 + 16} y2={cy} className="stroke-foreground/25" strokeWidth={1} strokeDasharray="10 3 2 3" />
      <rect x={WALL_X} y={top} width={depth} height={STROKE_H} className="fill-foreground/[0.04]" />
      <rect x={x1 - glowW} y={top} width={glowW} height={STROKE_H} fill={`url(#${uid}-glow)`} />
      {[-12, 0, 12].map((dy) => (
        <line key={dy} x1={42} y1={cy + dy / 2} x2={x1 - 6} y2={cy + dy * 1.4} className="stroke-primary/45" strokeWidth={1} strokeDasharray="2 4" />
      ))}
      <rect x={WALL_X + 4} y={cy - 11} width={6} height={22} className="fill-primary" />
      <line x1={WALL_X} y1={top} x2={x1} y2={top} className="stroke-foreground/80" strokeWidth={2.5} />
      <line x1={WALL_X} y1={bottom} x2={x1} y2={bottom} className="stroke-foreground/80" strokeWidth={2.5} />
      <line x1={x1} y1={top - 1} x2={x1} y2={bottom + 1} className="stroke-primary" strokeWidth={4} />
    </g>
  );
}

/** Horizontal dimension line with end ticks and arrowheads, drawn under a profile. */
function Dimension({ y, x0, x1 }: { y: number; x0: number; x1: number }) {
  return (
    <g className="stroke-muted-foreground" strokeWidth={1} fill="none">
      <line x1={x0} y1={y - 6} x2={x0} y2={y + 6} />
      <line x1={x1} y1={y - 6} x2={x1} y2={y + 6} />
      <line x1={x0} y1={y} x2={x1} y2={y} />
      <path d={`M${x0 + 7} ${y - 3.5} L${x0} ${y} L${x0 + 7} ${y + 3.5}`} />
      <path d={`M${x1 - 7} ${y - 3.5} L${x1} ${y} L${x1 - 7} ${y + 3.5}`} />
    </g>
  );
}

/**
 * Side-profile depth comparison drawn as an architectural section: conventional channel-letter return versus
 * the Sunlite ultra-slim 25-30 mm profile. Illustrative: the conventional letter is drawn visibly deeper but
 * no depth is claimed for it. Responsive (viewBox scales; works at 360 px) and reused by the ultra-slim page.
 */
export default function DepthComparison({ size = "md", className, hideNote = false }: DepthComparisonProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;
  const ultraX1 = WALL_X + ULTRA_SLIM_DEPTH;
  const convX1 = WALL_X + CONVENTIONAL_DEPTH;

  return (
    <figure className={cn("w-full mx-auto", size === "lg" ? "max-w-3xl" : "max-w-md", className)}>
      <svg
        viewBox="0 0 360 292"
        role="img"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full h-auto block text-foreground"
        data-testid="depth-comparison"
      >
        <title id={titleId}>Side-profile depth comparison: conventional channel letter versus Sunlite ultra-slim, 25 to 30 millimetres deep</title>
        <desc id={descId}>
          Two cross-sections of an illuminated letter mounted on a wall. The conventional channel-letter return is drawn
          several times deeper than the Sunlite ultra-slim letter, which is 25 to 30 millimetres deep in total.
          The drawing is illustrative and not to scale.
        </desc>
        <defs>
          <pattern id={`${uid}-hatch`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" className="stroke-muted-foreground/60" strokeWidth="1" />
          </pattern>
          <linearGradient id={`${uid}-glow`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 0 }} />
            <stop offset="1" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 0.38 }} />
          </linearGradient>
        </defs>

        {/* shared mounting wall */}
        <rect x={16} y={14} width={14} height={264} fill={`url(#${uid}-hatch)`} />
        <line x1={WALL_X} y1={14} x2={WALL_X} y2={278} className="stroke-foreground/70" strokeWidth={1.5} />

        {/* conventional */}
        <text x={44} y={40} className="font-mono fill-muted-foreground" fontSize={11} letterSpacing={1.3}>CONVENTIONAL CHANNEL LETTER</text>
        <Profile cy={84} depth={CONVENTIONAL_DEPTH} uid={uid} />
        <line x1={ultraX1} y1={46} x2={ultraX1} y2={122} className="stroke-primary" strokeWidth={1} strokeDasharray="4 3" />
        <text x={ultraX1 + 6} y={90} className="font-mono fill-primary" fontSize={10} letterSpacing={1}>ULTRA-SLIM DEPTH</text>
        <Dimension y={138} x0={WALL_X} x1={convX1} />
        <text x={(WALL_X + convX1) / 2} y={158} textAnchor="middle" className="font-mono fill-muted-foreground" fontSize={11} letterSpacing={1.3}>CONVENTIONAL RETURN</text>

        {/* ultra-slim */}
        <text x={44} y={172} className="font-mono fill-foreground" fontSize={11} letterSpacing={1.3}>SUNLITE ULTRA-SLIM</text>
        <Profile cy={216} depth={ULTRA_SLIM_DEPTH} uid={uid} />
        <Dimension y={266} x0={WALL_X} x1={ultraX1} />
        <text x={WALL_X} y={284} className="font-mono fill-muted-foreground" fontSize={10} letterSpacing={1.3}>TOTAL DEPTH</text>
        <text x={ultraX1 + 24} y={226} className="font-heading fill-primary" fontSize={36} fontWeight={700}>25–30 mm</text>
        <text x={ultraX1 + 24} y={246} className="font-mono fill-muted-foreground" fontSize={11} letterSpacing={1.3}>ABOUT 1″ – 1.2″</text>
      </svg>
      {!hideNote && (
        <figcaption className="mono-label text-muted-foreground mt-4 leading-relaxed">
          Illustrative side profiles, not to scale. Conventional return depth varies by project.
        </figcaption>
      )}
    </figure>
  );
}
