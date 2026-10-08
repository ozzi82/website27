export interface Swatch {
  name: string;
  hex: string;
  /** CSS background for the swatch button when a flat colour does not show it (brushed metal). */
  look?: string;
}

/** The "Brushed stainless" paint choice: stands for the bare metal, not a paint colour. Fabricated stainless letters only. */
export const BRUSHED_HEX = "#c9ced4";
export const BRUSHED_SWATCH: Swatch = {
  name: "Brushed stainless",
  hex: BRUSHED_HEX,
  look: "linear-gradient(135deg,#f4f6f8,#9aa0a6 45%,#e4e7ea 55%,#8d9399)",
};

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

// Glow colours are a fixed set (no free colour picker): four LED white temperatures and six colours.
// The whites are what an LED of that temperature looks like on a screen next to the photos of the real signs: the eye adapts
// to a lit sign, so a "3000 K" LED reads as a soft cream, not the saturated orange a black-body calculation gives.
export const GLOW_SWATCHES: Swatch[] = [
  { name: "3000 K warm white", hex: "#ffdab5" },
  { name: "4000 K white", hex: "#ffebd4" },
  { name: "5000 K cool white", hex: "#fff3e8" },
  { name: "6000 K daylight white", hex: "#fff4f0" },
  { name: "Yellow", hex: "#ffd400" },
  { name: "Orange", hex: "#ff8a1a" },
  { name: "Red", hex: "#ff1a1a" },
  { name: "Pink", hex: "#ff4fb8" },
  { name: "Green", hex: "#20e060" },
  { name: "Blue", hex: "#2d5bff" },
];

/** `Red (#b4332a)` for a known swatch, otherwise just the hex. */
export function describeColor(hex: string, swatches: Swatch[]): string {
  const h = hex.toLowerCase();
  const match = swatches.find((s) => s.hex === h);
  return match ? `${match.name} (${h})` : h;
}
