import { CTA_LINKS } from "../lib/cta";

/**
 * The product categories shown on the homepage and in the header's Products menu (brief sections 3 and 13).
 * Wording of the descriptions and CTA labels comes from the owner's brief. No cabinet signs / light boxes.
 */
export interface ProductCategory {
  id: "channel-letters" | "ultra-slim" | "cast-acrylic" | "custom-fabrication";
  /** "01".."04", shown in the editorial product list. */
  number: string;
  title: string;
  /** Short label for navigation menus. */
  navLabel: string;
  description: string;
  cta: { label: string; to: string };
  /** Existing imagery only (see public/images). */
  image: { src: string; alt: string; width: number; height: number };
}

export const productCategories: ProductCategory[] = [
  {
    id: "channel-letters",
    number: "01",
    title: "Standard Channel Letters",
    navLabel: "Channel Letters",
    description: "Front lit, halo lit and dual illuminated channel letters built to project specifications.",
    cta: CTA_LINKS.viewChannelLetters,
    image: {
      src: "/images/pasted-image-1787166590951-kao0m19c.jpeg",
      alt: "Illuminated letters on a building facade at dusk",
      width: 1600,
      height: 1200,
    },
  },
  {
    id: "ultra-slim",
    number: "02",
    title: "Ultra-Slim Trimless",
    navLabel: "Ultra-Slim Trimless",
    description: "Premium illuminated letters available at just 25–30 mm total depth.",
    cta: CTA_LINKS.exploreUltraSlim,
    image: {
      src: "/images/pasted-image-1787683170345-8s9whs6f.jpg",
      alt: "Illuminated vertical lettering in a large interior concourse",
      width: 1920,
      height: 1440,
    },
  },
  {
    id: "cast-acrylic",
    number: "03",
    title: "Cast Acrylic Letters",
    navLabel: "Cast Acrylic",
    description: "Solid cast acrylic letters with homogeneous illumination for a refined, premium brand presence.",
    cta: CTA_LINKS.viewCastAcrylic,
    image: {
      src: "/images/pasted-image-1785345075402-x1ttofrm.png",
      alt: "Vertical illuminated lettering mounted on a concrete structure",
      width: 1070,
      height: 1022,
    },
  },
  {
    id: "custom-fabrication",
    number: "04",
    title: "Custom Sign Fabrication",
    navLabel: "Custom Fabrication",
    description: "Custom logos and illuminated letter projects fabricated to your drawings.",
    // No separate page: custom logos and illuminated letter projects are a section of the channel-letters page.
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

/**
 * Service URLs that no longer exist. The client redirects them (ServicePage) and the hosts answer
 * with a real 301 (public/_redirects, nginx.conf), so old links and indexed URLs do not 404.
 */
export const LEGACY_SERVICE_REDIRECTS: Record<string, string> = {
  "cabinet-signs": "/services/channel-letters",
  "trimless-letters": "/services/ultra-slim-trimless-channel-letters",
};
