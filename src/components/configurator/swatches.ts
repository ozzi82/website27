export interface Swatch {
  name: string;
  hex: string;
}

// The brochure paints in "any PMS color", so these are just quick picks next to a free colour input.
export const PAINT_SWATCHES: Swatch[] = [
  { name: "Charcoal", hex: "#4b5059" },
  { name: "Black", hex: "#15161a" },
  { name: "White", hex: "#f2f2f2" },
  { name: "Silver", hex: "#aeb3ba" },
  { name: "Red", hex: "#b4332a" },
  { name: "Burgundy", hex: "#6a1f33" },
  { name: "Navy", hex: "#1f3a68" },
  { name: "Gold", hex: "#b8903a" },
];

export const GLOW_SWATCHES: Swatch[] = [
  { name: "White", hex: "#ffffff" },
  { name: "Warm white", hex: "#ffd9a0" },
  { name: "Red", hex: "#ff1a1a" },
  { name: "Amber", hex: "#ff9a1a" },
  { name: "Green", hex: "#20e060" },
  { name: "Cyan", hex: "#19e0ff" },
  { name: "Blue", hex: "#2d5bff" },
  { name: "Magenta", hex: "#ff2bd6" },
];

/** `Red (#b4332a)` for a known swatch, otherwise just the hex. */
export function describeColor(hex: string, swatches: Swatch[]): string {
  const h = hex.toLowerCase();
  const match = swatches.find((s) => s.hex === h);
  return match ? `${match.name} (${h})` : h;
}
