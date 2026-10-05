import { useId } from "react";
import { cn } from "@project/lib/utils";
import { configurations, defaultMount, type LightConfig, type Mount } from "../../data/configurations";
import { glowParts } from "../configurator/glowParts";
import { BOTTOM, CY, Defs, H, Ray, STROKE_H, TOP, W, WALL_X, Wall, label } from "./LetterDiagrams";

/**
 * A section of one letter stroke on a wall (viewer on the right) drawn from a configuration's own `light`, `mount`
 * and `profile`, so every EdgeLuxe system shows where ITS light goes: through the face, onto the wall behind, or out
 * of a band of the side wall. The rays flow and the glows breathe in CSS (see .ld-ray / .ld-glow in index.css), which
 * stops entirely for visitors who prefer reduced motion. Concept drawing, not to scale; no dimensions.
 */

const DEPTH = 92;
const NOMINAL_BAND = 0.24;
const ROUND = 14;
const TAPER = 13;

/** Plain-language account of the light paths, used as the accessible name and by tests. */
export function describeLight(config: LightConfig): string {
  const parts = glowParts(config.light, config.profile);
  const bits: string[] = [];
  if (parts.face) bits.push("light passes through the face toward the viewer");
  if (config.light.halo === "standoff") bits.push("light washes the wall behind the letter, which stands off on spacers");
  if (parts.side === "full") bits.push("the whole side wall glows");
  if (parts.side === "partial-back") bits.push("a band along the back edge of the side wall glows");
  if (parts.side === "partial-front") bits.push(parts.sideBand === 0.5 ? "the front half of the side wall glows" : "a band along the front edge of the side wall glows");
  return bits.join("; ");
}

export default function ConfigLightDiagram({ config, mount = defaultMount(config), className }: { config: LightConfig; mount?: Mount; className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const parts = glowParts(config.light, config.profile, mount);
  const standoff = mount === "standoff";
  const back = standoff ? 52 : WALL_X;
  const face = back + DEPTH;
  const bandW = DEPTH * (parts.sideBand ?? NOMINAL_BAND);
  const taper = config.profile === "conical" ? TAPER : 0;
  const round = config.profile === "tube" ? ROUND : 0;

  // Section outline: back edge, top wall, front (face) edge, bottom wall. Conical narrows toward the face; neon rounds the front corners.
  const outline = round
    ? `M ${back} ${TOP} H ${face - round} Q ${face} ${TOP} ${face} ${TOP + round} V ${BOTTOM - round} Q ${face} ${BOTTOM} ${face - round} ${BOTTOM} H ${back} Z`
    : `M ${back} ${TOP} L ${face} ${TOP + taper} V ${BOTTOM - taper} L ${back} ${BOTTOM} Z`;

  // Lit stretch of the side wall along x.
  const lit =
    parts.side === "full" ? [back, face - round] : parts.side === "partial-back" ? [back, back + bandW] : parts.side === "partial-front" ? [face - bandW, face - round] : null;
  const faceTop = TOP + taper;
  const faceBottom = BOTTOM - taper;

  const spillOnWall = parts.wallSpill === "flush"; // a flush letter's back band leaks light onto the wall around it

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Section diagram of ${config.code}: ${describeLight(config) || "no illumination"}`}
      className={cn("w-full h-auto block text-foreground", className)}
      data-diagram={`config-${config.id}`}
    >
      <Defs uid={uid} />
      <Wall uid={uid} />

      {parts.wallSpill === "standoff" && (
        <>
          <rect x={WALL_X} y={TOP - 22} width={back - WALL_X} height={STROKE_H + 44} fill={`url(#${uid}-glow-l)`} className="ld-glow" />
          <Ray x1={back - 2} y1={CY - 14} x2={WALL_X + 5} y2={CY - 14} />
          <Ray x1={back - 2} y1={CY + 14} x2={WALL_X + 5} y2={CY + 14} />
          <Ray x1={back - 4} y1={TOP - 2} x2={WALL_X + 7} y2={TOP - 17} faint />
          <Ray x1={back - 4} y1={BOTTOM + 2} x2={WALL_X + 7} y2={BOTTOM + 17} faint />
        </>
      )}
      {standoff && (
        <g className="fill-foreground/70">
          <rect x={WALL_X} y={TOP + 8} width={back - WALL_X} height={3} />
          <rect x={WALL_X} y={BOTTOM - 11} width={back - WALL_X} height={3} />
        </g>
      )}
      {spillOnWall && (
        <>
          <rect x={WALL_X} y={TOP - 20} width={26} height={20} fill={`url(#${uid}-glow-l)`} className="ld-glow" />
          <rect x={WALL_X} y={BOTTOM} width={26} height={20} fill={`url(#${uid}-glow-l)`} className="ld-glow" />
        </>
      )}

      {/* face glow, then body */}
      {parts.face && <rect x={face - 46} y={faceTop} width={46} height={faceBottom - faceTop} fill={`url(#${uid}-glow-r)`} className="ld-glow" />}
      <path d={outline} className="fill-foreground/[0.04] stroke-foreground/80" strokeWidth={2.5} strokeLinejoin="round" />
      <line x1={back} y1={TOP} x2={back} y2={BOTTOM} className="stroke-foreground/80" strokeWidth={config.light.halo === "standoff" ? 1.5 : 2.5} strokeDasharray={config.light.halo === "standoff" ? "4 3" : undefined} />
      <line x1={face} y1={faceTop} x2={face} y2={faceBottom} className={parts.face ? "stroke-primary" : "stroke-foreground/80"} strokeWidth={parts.face ? 4 : 3.5} />

      {/* LED module */}
      <rect x={back + 6} y={CY - 10} width={5} height={20} className="fill-primary" />

      {/* lit band(s) of the side wall: top and bottom of the section */}
      {lit && (
        <g className="stroke-primary ld-glow" strokeWidth={4} strokeLinecap="round">
          <line x1={lit[0] + 1} y1={TOP} x2={lit[1]} y2={TOP} />
          <line x1={lit[0] + 1} y1={BOTTOM} x2={lit[1]} y2={BOTTOM} />
        </g>
      )}

      {/* light paths */}
      {parts.face && (
        <g>
          <Ray x1={face + 3} y1={CY - 20} x2={W - 14} y2={CY - 30} />
          <Ray x1={face + 3} y1={CY} x2={W - 12} y2={CY} />
          <Ray x1={face + 3} y1={CY + 20} x2={W - 14} y2={CY + 30} />
        </g>
      )}
      {lit && (
        <g>
          <Ray x1={(lit[0] + lit[1]) / 2} y1={TOP - 3} x2={(lit[0] + lit[1]) / 2 + 6} y2={TOP - 20} />
          <Ray x1={(lit[0] + lit[1]) / 2} y1={BOTTOM + 3} x2={(lit[0] + lit[1]) / 2 + 6} y2={BOTTOM + 20} />
        </g>
      )}

      <text x={WALL_X + 4} y={17} className={label} fontSize={8.5} letterSpacing={1}>WALL</text>
      <text x={W - 6} y={H - 7} textAnchor="end" className={label} fontSize={8.5} letterSpacing={1}>VIEW</text>
      <polyline points={`${W - 44},${H - 10} ${W - 38},${H - 7} ${W - 44},${H - 4}`} className="stroke-muted-foreground" fill="none" strokeWidth={1} />
    </svg>
  );
}

export type MountCompareKind = "standoff" | "flush";

const MOUNT_COPY: Record<MountCompareKind, string> = {
  standoff: "Section diagram: letter on spacers with a gap to the wall; light from the back washes the wall behind the letter",
  flush: "Section diagram: letter flush against the wall; light only leaves through a band of the side wall, as a thin edge of light",
};

/** One half of the "standoff vs flush mount" explanation: the same halo-lit letter, with and without a gap to the wall. */
export function MountCompareDiagram({ kind, className }: { kind: MountCompareKind; className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const standoff = kind === "standoff";
  const back = standoff ? 62 : WALL_X;
  const face = back + 84;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={MOUNT_COPY[kind]} className={cn("w-full h-auto block text-foreground", className)} data-diagram={`mount-${kind}`}>
      <Defs uid={uid} />
      <Wall uid={uid} />
      {standoff ? (
        <>
          {/* the wall washed behind the letter: wide and soft */}
          <rect x={WALL_X} y={TOP - 26} width={back - WALL_X} height={STROKE_H + 52} fill={`url(#${uid}-glow-l)`} className="ld-glow" />
          <Ray x1={back - 2} y1={CY - 16} x2={WALL_X + 5} y2={CY - 16} />
          <Ray x1={back - 2} y1={CY + 16} x2={WALL_X + 5} y2={CY + 16} />
          <Ray x1={back - 4} y1={TOP - 2} x2={WALL_X + 7} y2={TOP - 20} faint />
          <Ray x1={back - 4} y1={BOTTOM + 2} x2={WALL_X + 7} y2={BOTTOM + 20} faint />
          <g className="fill-foreground/70">
            <rect x={WALL_X} y={TOP + 8} width={back - WALL_X} height={3} />
            <rect x={WALL_X} y={BOTTOM - 11} width={back - WALL_X} height={3} />
          </g>
          <g className="stroke-muted-foreground" strokeWidth={1} fill="none">
            <line x1={WALL_X} y1={BOTTOM + 30} x2={back} y2={BOTTOM + 30} />
            <line x1={WALL_X} y1={BOTTOM + 26} x2={WALL_X} y2={BOTTOM + 34} />
            <line x1={back} y1={BOTTOM + 26} x2={back} y2={BOTTOM + 34} />
          </g>
          <text x={(WALL_X + back) / 2} y={BOTTOM + 44} textAnchor="middle" className={label} fontSize={8.5} letterSpacing={1}>GAP</text>
        </>
      ) : (
        <>
          {/* only a thin leak of light at the edge, right at the wall */}
          <rect x={WALL_X} y={TOP - 14} width={14} height={14} fill={`url(#${uid}-glow-l)`} className="ld-glow" />
          <rect x={WALL_X} y={BOTTOM} width={14} height={14} fill={`url(#${uid}-glow-l)`} className="ld-glow" />
          <Ray x1={back + 8} y1={TOP - 2} x2={WALL_X + 3} y2={TOP - 12} faint />
          <Ray x1={back + 8} y1={BOTTOM + 2} x2={WALL_X + 3} y2={BOTTOM + 12} faint />
          <text x={WALL_X + 4} y={BOTTOM + 44} className={label} fontSize={8.5} letterSpacing={1}>NO GAP</text>
        </>
      )}
      <rect x={back} y={TOP} width={face - back} height={STROKE_H} className="fill-foreground/[0.04]" />
      <line x1={back} y1={TOP} x2={face} y2={TOP} className="stroke-foreground/80" strokeWidth={2.5} />
      <line x1={back} y1={BOTTOM} x2={face} y2={BOTTOM} className="stroke-foreground/80" strokeWidth={2.5} />
      <line x1={back} y1={TOP} x2={back} y2={BOTTOM} className="stroke-foreground/80" strokeWidth={2.5} strokeDasharray="4 3" />
      <line x1={face} y1={TOP - 1} x2={face} y2={BOTTOM + 1} className="stroke-foreground/80" strokeWidth={3.5} />
      <rect x={back + 6} y={CY - 10} width={5} height={20} className="fill-primary" />
      <text x={WALL_X + 4} y={17} className={label} fontSize={8.5} letterSpacing={1}>WALL</text>
      <text x={face} y={TOP - 9} textAnchor="middle" className={label} fontSize={8.5} letterSpacing={1}>FACE</text>
    </svg>
  );
}

const codes = (list: typeof configurations) => list.map((c) => c.code).join(", ");
const STANDOFF_ONLY = codes(configurations.filter((c) => !c.mounts.includes("flush")));
const FLUSH_ONLY = codes(configurations.filter((c) => !c.mounts.includes("standoff")));
const EITHER = codes(configurations.filter((c) => c.mounts.length > 1));

/** Standoff next to flush mount, each with a short factual caption; used where the mount decides how the halo looks. */
export function StandoffVsFlush({ className }: { className?: string }) {
  return (
    <div className={cn("grid sm:grid-cols-2 gap-5", className)}>
      <figure className="border border-border bg-card/50">
        <div className="corner-marks border-b border-border bg-background/60 p-4">
          <MountCompareDiagram kind="standoff" />
        </div>
        <figcaption className="p-5">
          <p className="mono-label text-primary">Standoff mount</p>
          <p className="text-sm text-muted-foreground mt-2">
            The letter floats off the wall on spacers. Light from the back washes the wall behind it, so a halo shows around the letter. The spacers are clear plastic tubes, 1″ long and 0.4″ in diameter. Standoff only: {STANDOFF_ONLY}, because the halo needs the gap. Flush or standoff: {EITHER}.
          </p>
        </figcaption>
      </figure>
      <figure className="border border-border bg-card/50">
        <div className="corner-marks border-b border-border bg-background/60 p-4">
          <MountCompareDiagram kind="flush" />
        </div>
        <figcaption className="p-5">
          <p className="mono-label text-primary">Flush mount</p>
          <p className="text-sm text-muted-foreground mt-2">
            The letter sits against the wall. Light leaves through a band of the side wall instead, as a thin edge of light rather than a wall wash. Flush only: {FLUSH_ONLY}. Flush or standoff: {EITHER}.
          </p>
        </figcaption>
      </figure>
    </div>
  );
}
