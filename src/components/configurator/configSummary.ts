import type { LightConfig } from "../../data/configurations";
import { GLOW_SWATCHES, PAINT_SWATCHES, describeColor } from "./swatches";
import type { SummaryRow } from "./quoteStorage";
import { emitsLight, formatDepth, type ConfiguratorState } from "./types";

/** Where the sign's shapes came from, for the quote summary. */
export type ArtworkInfo =
  | { kind: "upload"; fileName: string }
  | { kind: "text"; text: string; fontLabel: string };

export interface SummaryExtras {
  /** One extra sentence for the sales team, e.g. the thin-stroke note. */
  note?: string;
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
 * (no glow colour or brightness on the unlit LP 1, no paint on the neon tube, which is all light).
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
    { label: "Depth", value: formatDepth(state.depthMm) },
  ];
  if (config.profile !== "tube") {
    rows.push({ label: "Paint color", value: describeColor(state.color, PAINT_SWATCHES), swatch: state.color });
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
  return ["Sign configuration (from the Sunlite 3D configurator)", ...lines].join("\n");
}
