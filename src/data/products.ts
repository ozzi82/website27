import { CTA_LINKS } from "../lib/cta";

/**
 * The four product categories shown on the homepage and in the header's Products menu (owner clarification,
 * docs/briefs/2026-10-03-product-taxonomy-clarification.md):
 *   01 Ultra-slim letters = the EdgeLuxe LP 11 series = cast block acrylic (the signature product)
 *   02 Classic trimless letters = EdgeLuxe LP 5, LP 3.1, LP 3.2 (fabricated stainless steel)
 *   03 Non-illuminated flat cutout letters = EdgeLuxe LP 1
 *   04 Custom sign fabrication (this is the only place blade and push-through cabinet signs appear)
 * Descriptions use only brochure facts (data/configurations.ts) and the owner's wording. Sunlite does not offer
 * trim-capped letters, so no category mentions "trimmed".
 */
export interface ProductCategory {
  id: "ultra-slim" | "classic-trimless" | "flat-cutout" | "custom-fabrication";
  /** "01".."04", shown in the editorial product list. */
  number: string;
  title: string;
  /** Short label for navigation menus. */
  navLabel: string;
  /** Short tag line under the title: the EdgeLuxe systems behind the category. */
  systems: string;
  description: string;
  cta: { label: string; to: string };
  /** Existing imagery only (see public/images). */
  image: { src: string; alt: string; width: number; height: number };
}

export const productCategories: ProductCategory[] = [
  {
    id: "ultra-slim",
    number: "01",
    title: "Ultra-Slim Letters",
    navLabel: "Ultra-Slim Letters (LP 11)",
    systems: "EdgeLuxe LP 11 series · cast block acrylic · 25–30 mm",
    description:
      "Our signature product: cast block acrylic letters with embedded LEDs, epoxy-sealed to IP67 and just 25–30 mm deep. Eight lighting variants: face, halo, face + halo, side, faux neon and conical.",
    cta: CTA_LINKS.exploreUltraSlim,
    image: {
      src: "/images/pasted-image-1785345075402-x1ttofrm.png",
      alt: "Vertical lettering with glowing white outlines mounted on a blue panel in a concrete concourse",
      width: 1070,
      height: 1022,
    },
  },
  {
    id: "classic-trimless",
    number: "02",
    title: "Classic Trimless Letters",
    navLabel: "Classic Trimless Letters",
    systems: "EdgeLuxe LP 5, LP 3.1, LP 3.2 · fabricated stainless steel",
    description:
      "Fabricated stainless steel channel letters with no trim cap: face-lit LP 5, halo-lit LP 3.1 on standoffs and flush-mount LP 3.2, in depths from 30 to 100 mm.",
    cta: CTA_LINKS.viewChannelLetters,
    image: {
      src: "/images/pasted-image-1787166590951-kao0m19c.jpeg",
      alt: "Illuminated letters on a building facade at dusk",
      width: 1600,
      height: 1200,
    },
  },
  {
    id: "flat-cutout",
    number: "03",
    title: "Non-Illuminated Flat Cutout Letters",
    navLabel: "Flat Cutout Letters (LP 1)",
    systems: "EdgeLuxe LP 1 · unlit",
    description: "Everything non-illuminated: precision-cut flat letters in wood, aluminum, stainless steel, acrylic and more, from 1 mm to 200 mm thick.",
    cta: CTA_LINKS.viewFlatCutout,
    image: {
      src: "/images/edgeluxe/lp-1-flat-cutout-gold.jpg",
      alt: "EdgeLuxe LP 1 flat cutout letter S in gold on a concrete wall",
      width: 1200,
      height: 900,
    },
  },
  {
    id: "custom-fabrication",
    number: "04",
    title: "Custom Sign Fabrication",
    navLabel: "Custom Fabrication",
    systems: "Made to your drawings",
    description: "Custom work to your drawings, including blade signs, push-through cabinet signs, illuminated logos and custom letter projects.",
    cta: CTA_LINKS.customFabrication,
    image: {
      src: "/images/pasted-image-1786571174777-ihzwikss.jpg",
      alt: "Illuminated crest logo on a wood-slat wall",
      width: 709,
      height: 945,
    },
  },
];

/** Where product categories point: the single place the route of each category is decided. */
export const productHref = (p: ProductCategory): string => p.cta.to;
