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
  /** Service page slug the card links back to (e.g. "channel-letters"); the link text derives from productType. */
  productSlug?: string;
  depth?: string;
  illumination?: string;
  finish?: string;
  mounting?: string;
  /** Show on the homepage "Recent production" grid. */
  featured?: boolean;
}

const I = "/images/";

export const projects: Project[] = [
  { id: "mustang", title: "Mustang", image: I + "pasted-image-1786571168082-g326u0k5.png", width: 1536, height: 1024, alt: "Mustang sign with illuminated lettering on a dark panel", featured: true },
  { id: "panther-dome", title: "Panther Dome", image: I + "pasted-image-1786571168465-hoggarou.png", width: 1254, height: 1254, alt: "Panther Dome entrance with an illuminated panther emblem at dusk" },
  { id: "acorn-crest", title: "Acorn crest", image: I + "pasted-image-1786571174777-ihzwikss.jpg", width: 709, height: 945, alt: "Illuminated acorn and laurel crest on a wood-slat wall" },
  { id: "interior-wall-graphic", title: "Interior wall graphic", image: I + "pasted-image-1786571178138-56b8eh5p.jpg", width: 1920, height: 1440, alt: "Illuminated wall graphic in an interior corridor" },
  { id: "pre-loved-luxury", title: "Pre-Loved Luxury Collection", image: I + "pasted-image-1786571504837-jti27n6h.jpeg", width: 1920, height: 887, alt: "Pre-Loved Luxury Collection lettering above a storefront" },
  { id: "inspire", title: "Inspire", image: I + "pasted-image-1786571527961-nvve6zo0.jpg", width: 1260, height: 945, alt: "Inspire logo lettering with a glowing halo on an interior wall", featured: true },
  { id: "stroh-scheuerpflug", title: "Stroh + Scheuerpflug", image: I + "pasted-image-1787166590601-hr7ca0em.jpeg", width: 1600, height: 1200, alt: "Stroh + Scheuerpflug logo lettering on a white wall", featured: true },
  { id: "tradebyte", title: "Tradebyte", image: I + "pasted-image-1787166590730-o61irwkk.jpeg", width: 1600, height: 1200, alt: "Tradebyte lettering with a halo glow on a grey wall", featured: true },
  { id: "macs", title: "MACS", image: I + "pasted-image-1787166590805-pvuw1j0d.jpeg", width: 1600, height: 1200, alt: "MACS Innovative Companies lettering on a concrete wall" },
  { id: "jentower", title: "JenTower", image: I + "pasted-image-1787166590876-4gqe7y4j.jpeg", width: 900, height: 900, alt: "JenTower lettering with a warm halo above an entrance", featured: true },
  { id: "argo-hytos", title: "ARGO-HYTOS", image: I + "pasted-image-1787166590951-kao0m19c.jpeg", width: 1600, height: 1200, alt: "ARGO-HYTOS illuminated lettering on a blue building facade at dusk", featured: true },
  { id: "itonics", title: "itonics", image: I + "pasted-image-1787166591040-2vakze8k.jpeg", width: 1080, height: 1079, alt: "itonics lettering on a white wall", },
];

/** Projects shown on the homepage. */
export const featuredProjects = (): Project[] => projects.filter((p) => p.featured);

/** Projects tagged with a product page slug (empty until the owner supplies the mapping). */
export const projectsForProduct = (slug: string): Project[] => projects.filter((p) => p.productSlug === slug);

/** The metadata rows a card shows, in display order; blank/absent fields are skipped. */
export function projectMeta(p: Project): { label: string; value: string }[] {
  const rows: [string, string | undefined][] = [
    ["Product", p.productType],
    ["Depth", p.depth],
    ["Illumination", p.illumination],
    ["Finish", p.finish],
    ["Mounting", p.mounting],
  ];
  return rows.flatMap(([label, value]) => (value && value.trim() ? [{ label, value: value.trim() }] : []));
}
