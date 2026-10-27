import { CHANNEL_LETTERS_PATH, ULTRA_SLIM_PATH } from "./channelLetters";

export const SELECTION_GUIDE_PATH = "/guides/stainless-steel-vs-cast-acrylic-trimless-letters";

/**
 * Stainless steel or cast acrylic? Every line restates a fact already published on the product pages
 * (data/configurations.ts, data/channelLetters.ts, data/ultraSlim.ts). No new specifications or claims.
 */
export const SELECTION_GUIDE = {
  title: "Stainless Steel vs Cast Acrylic Trimless Letters",
  crumb: "Stainless steel vs cast acrylic",
  h1: "Stainless steel or cast acrylic? Choosing a trimless letter.",
  description:
    "Compare Sunlite's two trimless letter families: fabricated stainless steel (LP 5, LP 3.1, LP 3.2) and ultra-slim cast block acrylic (LP 11). Depth, lighting and mounting side by side.",
  intro:
    "Every Sunlite channel letter is trimless. The choice is between two families: fabricated stainless steel letters, and ultra-slim LP 11 letters in solid cast block acrylic. This page sets the published facts side by side so you can pick the right one for the job.",
  rows: [
    {
      label: "Construction",
      steel: "Thick gauge stainless steel returns and back, welded together, with a step-routed acrylic face and no trim cap (LP 5).",
      acrylic: "Solid cast block acrylic with LEDs embedded in the body, epoxy-sealed to IP67.",
    },
    {
      label: "Depth",
      steel: '30, 50, 75 and 100 mm (1.2, 2, 3 and 4 inches), and custom depths.',
      acrylic: "10–30 mm: 30 mm standard, 25 mm for small letters, and LP 11-B also at 10, 15 and 20 mm.",
    },
    {
      label: "Lighting",
      steel: "Face lit (LP 5), halo lit from the back on standoffs (LP 3.1), and a partial side-lit halo from an exposed acrylic band (LP 3.2).",
      acrylic: "Eight configurations: face, halo, face + halo, back side, face + front side, full side, faux neon and conical.",
    },
    {
      label: "Mounting",
      steel: "LP 5 and LP 3.2 flush to the wall; LP 3.1 on standoff spacers.",
      acrylic: "Flush, or on standoffs where the halo needs the gap, depending on the configuration.",
    },
    {
      label: "Minimum size",
      steel: "Letters 2″ (50 mm) tall; stroke width 0.5″ (12.7 mm).",
      acrylic: "Letters 2″ (50 mm) tall; stroke width 0.47″ (12 mm), with exceptions for LP 11-S and LP 11-C.",
    },
    {
      label: "Certification and warranty",
      steel: "UL 48 listed. 3 years on LED modules and power supplies.",
      acrylic: "UL 48 listed. 3 years on LED modules and power supplies.",
    },
  ],
  choose: [
    {
      title: "Choose stainless steel for",
      points: [
        "Building façade and canopy signage at larger scale (LP 5).",
        "A halo that washes the wall behind the letter, with the letter floating on standoffs (LP 3.1).",
        "Letters deeper than 30 mm, including custom depths.",
      ],
      to: CHANNEL_LETTERS_PATH,
      cta: "See the classic trimless systems",
    },
    {
      title: "Choose cast acrylic for",
      points: [
        "A letter that has to be as shallow as possible, 10–30 mm deep.",
        "Small letters, from 2″ tall (LP 11-F).",
        "Faux neon, conical or side-lit effects that the steel systems do not offer.",
      ],
      to: ULTRA_SLIM_PATH,
      cta: "See the ultra-slim LP 11 series",
    },
  ],
};
