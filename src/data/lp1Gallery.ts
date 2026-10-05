import type { Lp1FinishId } from "../components/configurator/lp1Materials";

/**
 * Placeholder pictures for the LP 1 flat cutout letters: renders of the configurator's own finishes (a single "S" on
 * concrete, by day), to be replaced with project photos. Each links to the configurator with that finish selected.
 */
export interface Lp1GalleryItem {
  id: Lp1FinishId;
  label: string;
  img: string;
  alt: string;
}

const DIR = "/images/edgeluxe/lp-1/";

export const lp1Gallery: Lp1GalleryItem[] = [
  { id: "wood", label: "Wood", img: DIR + "wood.jpg", alt: "Flat cutout letter S in wood on a concrete wall (illustrative render)" },
  { id: "mirror-gold", label: "Mirror gold stainless steel", img: DIR + "gold-mirror.jpg", alt: "Flat cutout letter S in mirror gold stainless steel on a concrete wall (illustrative render)" },
  { id: "brushed-steel", label: "Brushed stainless steel", img: DIR + "brushed-stainless.jpg", alt: "Flat cutout letter S in brushed stainless steel on a concrete wall (illustrative render)" },
  { id: "corten", label: "Corten finish", img: DIR + "corten.jpg", alt: "Flat cutout letter S with a corten finish on a concrete wall (illustrative render)" },
  { id: "acrylic-clear", label: "Clear acrylic", img: DIR + "clear-acrylic.jpg", alt: "Flat cutout letter S in clear acrylic on a concrete wall (illustrative render)" },
  { id: "acrylic-colored", label: "Coloured acrylic", img: DIR + "coloured-acrylic.jpg", alt: "Flat cutout letter S in red acrylic on a concrete wall (illustrative render)" },
];
