import type { LightConfig } from "../../data/configurations";
import { BRUSHED_SWATCH, GLOW_SWATCHES, PAINT_SWATCHES, describeColor } from "./swatches";
import type { SummaryRow } from "./quoteStorage";
import { getLp1Finish, isLp1 } from "./lp1Materials";
import { DISCLAIMER_TEXT } from "./disclaimer";
import { emitsLight, formatDepth, type ConfiguratorState } from "./types";
import { formatSize } from "./realSize";

/** Where the sign's shapes came from, for the quote summary. */
export type ArtworkInfo =
  | { kind: "upload"; fileName: string }
  | { kind: "text"; text: string; fontLabel: string };

export interface SummaryExtras {
  /** One extra sentence for the sales team, e.g. the thin-stroke note. */
  note?: string;
  /** Width over height of the artwork: with it the summary states the size in inches and millimetres. */
  aspect?: number;
}

function describeArtwork(artwork: ArtworkInfo): string {
  if (artwork.kind === "upload") return `uploaded file ${artwork.fileName}`;
  const text = artwork.text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join(" / ");
  return `typed text "${text}" in ${artwork.fontLabel}`;
}

/**
 * The choices that matter for a quote, as label/value rows (US units first). Background and
 * day/night are preview settings and are left out; so is whatever the configuration lacks
 * (no glow colour or brightness on the unlit LP 1, no paint colour on an LP 1 finish that is not coloured).
 */
export function configSummaryRows(
  state: ConfiguratorState,
  config: LightConfig,
  artwork: ArtworkInfo | null,
  extras: SummaryExtras = {}
): SummaryRow[] {
  const lit = emitsLight(config);
  const rows: SummaryRow[] = [
    { label: "Configuration", value: `${config.code} ${config.subtitle}` },
    ...(extras.aspect ? [{ label: "Size", value: formatSize(state.sizeIn, extras.aspect) }] : []),
    { label: "Depth", value: formatDepth(state.depthMm) },
    { label: "Mounting", value: state.mounting === "standoff" ? "Standoff spacers (clear plastic tubes, 1″ long, 0.4″ diameter)" : "Flush to the wall" },
  ];
  const finish = getLp1Finish(state.finish);
  if (isLp1(config)) {
    rows.splice(1, 0, { label: "Finish", value: finish.label }, { label: "Build", value: state.build === "fabricated" ? "Fabricated (hollow)" : "Solid material" });
  }
  if (isLp1(config) ? finish.usesPaint : true) {
    rows.push({ label: isLp1(config) ? "Acrylic color" : "Paint color", value: describeColor(state.color, [BRUSHED_SWATCH, ...PAINT_SWATCHES]), swatch: state.color });
  }
  if (lit) {
    rows.push({ label: "Glow color", value: describeColor(state.glowColor, GLOW_SWATCHES), swatch: state.glowColor });
    rows.push({ label: "LED brightness", value: `${Math.round(state.brightness)}%` });
  }
  if (artwork) rows.push({ label: "Artwork", value: describeArtwork(artwork) });
  if (extras.note) rows.push({ label: "Note", value: extras.note });
  return rows;
}

/** Plain readable text for the quote: copied by the "Copy summary" button and used to prefill the form. */
export function formatConfigSummary(
  state: ConfiguratorState,
  config: LightConfig,
  artwork: ArtworkInfo | null,
  extras: SummaryExtras = {}
): string {
  const lines = configSummaryRows(state, config, artwork, extras).map((r) => `${r.label}: ${r.value}`);
  return ["Sign configuration (from the Sunlite 3D configurator)", ...lines, `Note: ${DISCLAIMER_TEXT}`].join("\n");
}
