import { useId } from "react";
import { cn } from "@project/lib/utils";

/**
 * Small technical concept drawings for the channel-letter pages: side sections of one letter stroke on a wall
 * (viewer on the right). They explain WHERE the light goes and HOW a letter is carried, nothing more:
 * no dimensions, no depths, not to scale. Inline SVG, theme-aware (currentColor / design tokens), scales with its container.
 */

export const W = 240;
export const H = 150;
export const WALL_X = 20;
export const CY = 75;
export const STROKE_H = 60;
export const TOP = CY - STROKE_H / 2;
export const BOTTOM = CY + STROKE_H / 2;

/** A line with an arrowhead at (x2, y2). */
export function Ray({ x1, y1, x2, y2, faint = false }: { x1: number; y1: number; x2: number; y2: number; faint?: boolean }) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const head = (d: number) => `${x2 - 6.5 * Math.cos(a + d)},${y2 - 6.5 * Math.sin(a + d)}`;
  return (
    <g className="stroke-primary" strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={faint ? 0.45 : 1}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} className="ld-ray" />
      <polyline points={`${head(0.45)} ${x2},${y2} ${head(-0.45)}`} />
    </g>
  );
}

export function Wall({ uid }: { uid: string }) {
  return (
    <g>
      <rect x={8} y={6} width={WALL_X - 8} height={H - 12} fill={`url(#${uid}-hatch)`} />
      <line x1={WALL_X} y1={6} x2={WALL_X} y2={H - 6} className="stroke-foreground/70" strokeWidth={1.5} />
    </g>
  );
}

export function Defs({ uid }: { uid: string }) {
  return (
    <defs>
      <pattern id={`${uid}-hatch`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="6" className="stroke-muted-foreground/60" strokeWidth="1" />
      </pattern>
      <linearGradient id={`${uid}-glow-r`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 0 }} />
        <stop offset="1" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 0.32 }} />
      </linearGradient>
      <linearGradient id={`${uid}-glow-l`} x1="1" y1="0" x2="0" y2="0">
        <stop offset="0" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 0 }} />
        <stop offset="1" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 0.32 }} />
      </linearGradient>
    </defs>
  );
}

export const label = "font-mono fill-muted-foreground";

export type LightingKind = "front" | "halo" | "front-back";

const LIGHTING_LABEL: Record<LightingKind, string> = {
  front: "Section diagram: front lit letter, light passes through the face toward the viewer",
  halo: "Section diagram: halo lit letter, light is directed to the wall behind the letter",
  "front-back": "Section diagram: front and back lit letter, light passes through the face and onto the wall behind",
};

/** One stroke in section: where the light goes for front lit / halo (reverse) lit / front + back lit. */
export function LightingDiagram({ kind, className }: { kind: LightingKind; className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const floating = kind !== "front"; // halo and dual letters stand off the wall so light can reach it
  const back = floating ? 48 : WALL_X;
  const face = back + 104;
  const litFace = kind !== "halo";
  const litBack = kind !== "front";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={LIGHTING_LABEL[kind]} className={cn("w-full h-auto block text-foreground", className)} data-diagram={`lighting-${kind}`}>
      <Defs uid={uid} />
      <Wall uid={uid} />
      {litBack && <rect x={WALL_X} y={TOP - 22} width={back - WALL_X} height={STROKE_H + 44} fill={`url(#${uid}-glow-l)`} className="ld-glow" />}
      {litFace && <rect x={face - 46} y={TOP} width={46} height={STROKE_H} fill={`url(#${uid}-glow-r)`} className="ld-glow" />}
      {/* body */}
      <rect x={back} y={TOP} width={face - back} height={STROKE_H} className="fill-foreground/[0.04]" />
      <line x1={back} y1={TOP} x2={face} y2={TOP} className="stroke-foreground/80" strokeWidth={2.5} />
      <line x1={back} y1={BOTTOM} x2={face} y2={BOTTOM} className="stroke-foreground/80" strokeWidth={2.5} />
      {/* back plate: solid for front lit, open (dashed) where light leaves through it */}
      <line x1={back} y1={TOP} x2={back} y2={BOTTOM} className="stroke-foreground/80" strokeWidth={litBack ? 1.5 : 2.5} strokeDasharray={litBack ? "4 3" : undefined} />
      {/* face: translucent (orange) where it glows, solid where it does not */}
      <line x1={face} y1={TOP - 1} x2={face} y2={BOTTOM + 1} className={litFace ? "stroke-primary" : "stroke-foreground/80"} strokeWidth={litFace ? 4 : 3.5} />
      {/* LED module */}
      <rect x={back + 6} y={CY - 10} width={5} height={20} className="fill-primary" />
      {/* stand-off pegs */}
      {floating && (
        <g className="fill-foreground/70">
          <rect x={WALL_X} y={TOP + 8} width={back - WALL_X} height={3} />
          <rect x={WALL_X} y={BOTTOM - 11} width={back - WALL_X} height={3} />
        </g>
      )}
      {/* light paths */}
      {litFace && (
        <g>
          <Ray x1={face + 3} y1={CY - 20} x2={W - 14} y2={CY - 30} />
          <Ray x1={face + 3} y1={CY} x2={W - 12} y2={CY} />
          <Ray x1={face + 3} y1={CY + 20} x2={W - 14} y2={CY + 30} />
        </g>
      )}
      {litBack && (
        <g>
          <Ray x1={back - 2} y1={CY - 14} x2={WALL_X + 5} y2={CY - 14} />
          <Ray x1={back - 2} y1={CY + 14} x2={WALL_X + 5} y2={CY + 14} />
          <Ray x1={back - 4} y1={TOP - 2} x2={WALL_X + 7} y2={TOP - 17} faint />
          <Ray x1={back - 4} y1={BOTTOM + 2} x2={WALL_X + 7} y2={BOTTOM + 17} faint />
        </g>
      )}
      <text x={WALL_X + 4} y={17} className={label} fontSize={8.5} letterSpacing={1}>WALL</text>
      <text x={face} y={TOP - 9} textAnchor="middle" className={label} fontSize={8.5} letterSpacing={1}>FACE</text>
      <text x={W - 6} y={H - 7} textAnchor="end" className={label} fontSize={8.5} letterSpacing={1}>VIEW</text>
      <polyline points={`${W - 44},${H - 10} ${W - 38},${H - 7} ${W - 44},${H - 4}`} className="stroke-muted-foreground" fill="none" strokeWidth={1} />
    </svg>
  );
}

export type TrimKind = "trimmed" | "trimless";

const TRIM_LABEL: Record<TrimKind, string> = {
  trimmed: "Section diagram of a letter edge: a trim cap frames the face",
  trimless: "Section diagram of a letter edge: the face meets the return with no trim cap",
};

/** The edge of a letter in section: with a trim cap around the face, or trimless. */
export function TrimDiagram({ kind, className }: { kind: TrimKind; className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const faceX = 190;
  const returnY = 58;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={TRIM_LABEL[kind]} className={cn("w-full h-auto block text-foreground", className)} data-diagram={`trim-${kind}`}>
      <Defs uid={uid} />
      <Wall uid={uid} />
      {/* return (the letter's side wall), seen from the side, and the face */}
      <rect x={WALL_X} y={returnY} width={faceX - WALL_X} height={H - returnY - 14} className="fill-foreground/[0.04]" />
      <line x1={WALL_X} y1={returnY} x2={faceX} y2={returnY} className="stroke-foreground/80" strokeWidth={2.5} />
      <line x1={faceX} y1={returnY} x2={faceX} y2={H - 14} className="stroke-primary" strokeWidth={4} />
      {kind === "trimmed" ? (
        <g>
          {/* trim cap: a visible rim that wraps the face edge */}
          <path d={`M ${faceX - 20} ${returnY - 7} H ${faceX + 8} V ${returnY + 24}`} className="stroke-foreground" strokeWidth={4.5} fill="none" strokeLinejoin="round" />
          <text x={faceX - 26} y={returnY - 11} textAnchor="end" className={label} fontSize={8.5} letterSpacing={1}>TRIM CAP</text>
        </g>
      ) : (
        <g>
          <circle cx={faceX} cy={returnY} r={9} className="stroke-muted-foreground" strokeWidth={1} strokeDasharray="2.5 2.5" fill="none" />
          <text x={faceX - 14} y={returnY - 11} textAnchor="end" className={label} fontSize={8.5} letterSpacing={1}>NO TRIM CAP</text>
        </g>
      )}
      <text x={WALL_X + 4} y={17} className={label} fontSize={8.5} letterSpacing={1}>WALL</text>
      <text x={faceX - 4} y={H - 3} textAnchor="end" className={label} fontSize={8.5} letterSpacing={1}>FACE</text>
      <text x={faceX - 8} y={returnY + 17} textAnchor="end" className={label} fontSize={8.5} letterSpacing={1}>RETURN</text>
    </svg>
  );
}

export type MountingKind = "flush" | "standoff" | "raceway" | "remote";

const MOUNT_LABEL: Record<MountingKind, string> = {
  flush: "Section diagram: letter mounted flush to the wall",
  standoff: "Section diagram: letter mounted on standoffs, leaving a gap to the wall",
  raceway: "Section diagram: letter mounted on a raceway fixed to the wall",
  remote: "Section diagram: letter mounted to the wall with the power supply located remotely",
};

/** How a letter is carried: flush, on standoffs, on a raceway, or with the power supply mounted remotely. */
export function MountingDiagram({ kind, className }: { kind: MountingKind; className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const back = kind === "standoff" ? 48 : kind === "raceway" ? 62 : WALL_X;
  const face = back + 84;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={MOUNT_LABEL[kind]} className={cn("w-full h-auto block text-foreground", className)} data-diagram={`mounting-${kind}`}>
      <Defs uid={uid} />
      <Wall uid={uid} />
      {kind === "raceway" && (
        <g>
          <rect x={WALL_X} y={TOP - 14} width={back - WALL_X} height={STROKE_H + 28} className="fill-foreground/[0.07] stroke-foreground/80" strokeWidth={1.5} />
          <text x={WALL_X + 4} y={BOTTOM + 28} className={label} fontSize={8.5} letterSpacing={1}>RACEWAY</text>
        </g>
      )}
      {kind === "standoff" && (
        <g className="fill-foreground/70">
          <rect x={WALL_X} y={TOP + 8} width={back - WALL_X} height={3} />
          <rect x={WALL_X} y={BOTTOM - 11} width={back - WALL_X} height={3} />
        </g>
      )}
      {kind === "flush" && (
        <g className="stroke-foreground/70" strokeWidth={1.5}>
          <line x1={WALL_X - 9} y1={TOP + 10} x2={WALL_X + 12} y2={TOP + 10} />
          <line x1={WALL_X - 9} y1={BOTTOM - 10} x2={WALL_X + 12} y2={BOTTOM - 10} />
        </g>
      )}
      <rect x={back} y={TOP} width={face - back} height={STROKE_H} className="fill-foreground/[0.04]" />
      <line x1={back} y1={TOP} x2={face} y2={TOP} className="stroke-foreground/80" strokeWidth={2.5} />
      <line x1={back} y1={BOTTOM} x2={face} y2={BOTTOM} className="stroke-foreground/80" strokeWidth={2.5} />
      <line x1={back} y1={TOP} x2={back} y2={BOTTOM} className="stroke-foreground/80" strokeWidth={2.5} />
      <line x1={face} y1={TOP - 1} x2={face} y2={BOTTOM + 1} className="stroke-primary" strokeWidth={4} />
      {kind === "remote" && (
        <g>
          <path d={`M ${WALL_X + 40} ${BOTTOM} V ${H - 20} H ${W - 86}`} className="stroke-primary" strokeWidth={1.4} fill="none" strokeDasharray="4 3" />
          <rect x={W - 86} y={H - 32} width={78} height={24} className="fill-foreground/[0.07] stroke-foreground/80" strokeWidth={1.5} />
          <text x={W - 47} y={H - 17} textAnchor="middle" className={label} fontSize={8} letterSpacing={0.8}>POWER SUPPLY</text>
        </g>
      )}
      <text x={WALL_X + 4} y={17} className={label} fontSize={8.5} letterSpacing={1}>WALL</text>
      <text x={face} y={TOP - 9} textAnchor="middle" className={label} fontSize={8.5} letterSpacing={1}>FACE</text>
    </svg>
  );
}
