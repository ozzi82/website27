/**
 * Reusable structured project data (brief section 8).
 * Metadata fields are OPTIONAL and intentionally blank for the existing photos: we only record what the site
 * already knew (the sign name shown in the photo). Never invent depth/finish/mounting for an image; the owner
 * supplies them per project and the cards pick them up automatically.
 */
export interface Project {
  id: string;
  /** What the photo shows (sign name as already labelled on the site). */
  title: string;
  image: string;
  width: number;
  height: number;
  alt: string;
  /** Product category label, e.g. "Trimless face-lit letters". */
  productType?: string;
  /** EdgeLuxe systems this job was made in (ids from data/configurations.ts); the card names them and links to their pages. */
  systems?: string[];
  /** Service page slug the card links back to (e.g. "channel-letters"); the link text derives from productType. */
  productSlug?: string;
  depth?: string;
  illumination?: string;
  finish?: string;
  mounting?: string;
  /** Show on the homepage "Recent production" grid. */
  featured?: boolean;
}

import { configurations } from "./configurations";

const I = "/images/";

/** "LP 11-BS" for a configuration id (the id itself if it is unknown). */
export const systemCode = (id: string): string => configurations.find((c) => c.id === id)?.code ?? id;

export const projects: Project[] = [
  // Added 2026-10-05 (owner photos). Only what the photos show is recorded: no product line, depth or finish is claimed.
  // Custom sign fabrication (owner photos, 2026-10-05). Only what the photos show is recorded.
  { id: "hockey-display-front", title: "WE ♥ HOCKEY display", image: I + "custom-hockey-display-front.jpg", width: 1600, height: 900, alt: "Large \"WE ♥ HOCKEY\" display with a red heart and icicle details beside an illuminated IIHF 2026 World Junior Championship panel, on a wheeled base", productType: "Custom sign fabrication" },
  { id: "hockey-display-detail", title: "WE ♥ HOCKEY display (panel detail)", image: I + "custom-hockey-display-detail.jpg", width: 1600, height: 900, alt: "Close view of the lit IIHF 2026 World Junior Championship United States Minnesota panel and the WE ♥ HOCKEY letters", productType: "Custom sign fabrication" },
  { id: "hockey-display-back", title: "WE ♥ HOCKEY display (rear)", image: I + "custom-hockey-display-back.jpg", width: 1600, height: 900, alt: "Rear of the WE ♥ HOCKEY display showing the dark panel back, the heart and the blue letter bodies on the wheeled base", productType: "Custom sign fabrication" },
  { id: "cabinet-sign-lit", title: "Rounded illuminated sign on legs (lit)", image: I + "custom-cabinet-sign-lit.jpg", width: 1600, height: 1600, alt: "Rounded-rectangle illuminated sign on two black legs, lit with a glowing white border and logo", productType: "Custom sign fabrication" },
  { id: "cabinet-sign-unlit", title: "Rounded illuminated sign on legs (unlit)", image: I + "custom-cabinet-sign-unlit-front.jpg", width: 1600, height: 1600, alt: "Rounded-rectangle sign with a green recessed face and raised logo, standing on two black legs with base plates", productType: "Custom sign fabrication" },
  { id: "cabinet-sign-side", title: "Rounded illuminated sign on legs (side view)", image: I + "custom-cabinet-sign-unlit-side.jpg", width: 1600, height: 1600, alt: "Side view of the rounded sign showing its depth and the black leg supports", productType: "Custom sign fabrication" },
  { id: "jaxen-grey-lit", title: "Jaxen Grey custom sign (lit)", image: I + "custom-blade-sign-jaxen-grey-lit.jpg", width: 900, height: 1600, alt: "Jaxen Grey wall-bracket box sign with warm white glowing letters on a black cabinet", productType: "Custom sign fabrication" },
  { id: "jaxen-grey-unlit", title: "Jaxen Grey custom sign (unlit)", image: I + "custom-blade-sign-jaxen-grey-unlit.jpg", width: 1280, height: 1280, alt: "Jaxen Grey wall-bracket box sign with white letters on a black cabinet and a black mounting bracket", productType: "Custom sign fabrication" },
  { id: "quarrix", title: "Quarrix", image: I + "project-quarrix.jpg", width: 1280, height: 1707, alt: "Quarrix lettering with a blue glow behind the letters on a white display wall", systems: ["lp-11-b-back-lit"] },
  { id: "piada", title: "Piada", image: I + "project-piada.jpg", width: 1280, height: 1706, alt: "Piada lettering above a dark canopy on a brick storefront", systems: ["lp-5-trimless-face-lit"] },
  { id: "olympus-templates", title: "Olympus Clinical Research", image: I + "project-olympus-flat.jpg", width: 1600, height: 1200, alt: "Olympus Clinical Research logo and lettering cut out in blue, orange and white, laid on paper templates", productType: "Flat cutout letters" },
  { id: "olympus-layout", title: "Olympus Clinical Research (layout)", image: I + "project-olympus-layout.jpg", width: 1600, height: 1200, alt: "Two Olympus Clinical Research flat cutout sign sets laid out on paper templates in the workshop", productType: "Flat cutout letters" },
  { id: "mustang", title: "Mustang", image: I + "pasted-image-1786571168082-g326u0k5.png", width: 1536, height: 1024, alt: "Mustang sign with illuminated lettering on a dark panel", featured: true, systems: ["lp-5-trimless-face-lit"] },
  { id: "panther-dome", title: "Panther Dome", image: I + "pasted-image-1786571168465-hoggarou.png", width: 1254, height: 1254, alt: "Panther Dome entrance with an illuminated panther emblem at dusk", systems: ["lp-5-trimless-face-lit"] },
  { id: "acorn-crest", title: "Acorn crest", image: I + "pasted-image-1786571174777-ihzwikss.jpg", width: 709, height: 945, alt: "Illuminated acorn and laurel crest on a wood-slat wall", systems: ["lp-11-bs-back-side-lit"] },
  { id: "interior-wall-graphic", title: "Interior wall graphic", image: I + "pasted-image-1786571178138-56b8eh5p.jpg", width: 1920, height: 1440, alt: "Illuminated wall graphic in an interior corridor", systems: ["lp-11-n-faux-neon"] },
  { id: "inspire", title: "Inspire", image: I + "pasted-image-1786571527961-nvve6zo0.jpg", width: 1260, height: 945, alt: "Inspire logo lettering with a glowing halo on an interior wall", featured: true, systems: ["lp-11-bs-back-side-lit"] },
  { id: "stroh-scheuerpflug", title: "Stroh + Scheuerpflug", image: I + "pasted-image-1787166590601-hr7ca0em.jpeg", width: 1600, height: 1200, alt: "Stroh + Scheuerpflug logo lettering on a white wall", featured: true, systems: ["lp-11-b-back-lit"] },
  { id: "tradebyte", title: "Tradebyte", image: I + "pasted-image-1787166590730-o61irwkk.jpeg", width: 1600, height: 1200, alt: "Tradebyte lettering with a halo glow on a grey wall", featured: true, systems: ["lp-3-1-standoff-halo"] },
  { id: "macs", title: "MACS", image: I + "pasted-image-1787166590805-pvuw1j0d.jpeg", width: 1600, height: 1200, alt: "MACS Innovative Companies lettering on a concrete wall", productType: "Flat cutout letters", systems: ["lp-1-flat-cutout"] },
  { id: "jentower", title: "JenTower", image: I + "pasted-image-1787166590876-4gqe7y4j.jpeg", width: 900, height: 900, alt: "JenTower lettering with a warm halo above an entrance", featured: true, systems: ["lp-11-b-back-lit"] },
  { id: "argo-hytos", title: "ARGO-HYTOS", image: I + "pasted-image-1787166590951-kao0m19c.jpeg", width: 1600, height: 1200, alt: "ARGO-HYTOS illuminated lettering on a blue building facade at dusk", featured: true, systems: ["lp-3-1-standoff-halo", "lp-5-trimless-face-lit"] },
  // The next three were the imagery of the previous "Trimless Letters" and "Cast Block Acrylic" service pages, so they link to the ultra-slim page.
  // No depth or finish is recorded for them (owner to confirm which jobs are 10–30 mm).
  { id: "concourse-lettering", title: "Ticketmaster", image: I + "pasted-image-1785345075402-x1ttofrm.png", width: 1070, height: 1022, alt: "Vertical lettering with glowing white outlines on a blue panel beside a concrete column", productType: "Ultra-slim letters", productSlug: "ultra-slim-trimless-channel-letters", systems: ["lp-11-n-faux-neon"] },
  { id: "concourse-column", title: "Ticketmaster (concourse column)", image: I + "pasted-image-1787683170345-8s9whs6f.jpg", width: 1920, height: 1440, alt: "Illuminated vertical lettering on a blue column panel in a large interior concourse", productType: "Ultra-slim letters", productSlug: "ultra-slim-trimless-channel-letters", systems: ["lp-11-n-faux-neon"] },
  { id: "event-stand", title: "OATLY Booth", image: I + "pasted-image-1787683165508-erx4nd1w.jpg", width: 1280, height: 1792, alt: "Large white illuminated lettering with a soft halo above an event stand", productType: "Ultra-slim letters", productSlug: "ultra-slim-trimless-channel-letters", systems: ["lp-11-fs-front-side-lit"] },
  { id: "itonics", title: "itonics", image: I + "pasted-image-1787166591040-2vakze8k.jpeg", width: 1080, height: 1079, alt: "itonics lettering on a white wall", systems: ["lp-11-b-back-lit"] },
];

/** Projects shown on the homepage. */
export const featuredProjects = (): Project[] => projects.filter((p) => p.featured);

/** Projects tagged with a product page slug (empty until the owner supplies the mapping). */
export const projectsForProduct = (slug: string): Project[] => projects.filter((p) => p.productSlug === slug);

/** Projects by id, in the order given (unknown ids are skipped). */
export const projectsByIds = (ids: string[]): Project[] => ids.flatMap((id) => projects.filter((p) => p.id === id));

/** The metadata rows a card shows, in display order; blank/absent fields are skipped. */
export function projectMeta(p: Project): { label: string; value: string }[] {
  const rows: [string, string | undefined][] = [
    ["Product", p.systems?.length ? p.systems.map((id) => systemCode(id)).join(" + ").replace(/^/, "EdgeLuxe ") : p.productType],
    ["Depth", p.depth],
    ["Illumination", p.illumination],
    ["Finish", p.finish],
    ["Mounting", p.mounting],
  ];
  return rows.flatMap(([label, value]) => (value && value.trim() ? [{ label, value: value.trim() }] : []));
}
