import { productCategories, productHref } from "./products";
import { CTA_LINKS } from "../lib/cta";

export interface NavItem {
  label: string;
  to: string;
}

/**
 * Header / footer navigation (brief section 13).
 * Phase 1 targets: PROJECTS -> /gallery, MANUFACTURING -> homepage anchor, ABOUT -> /about.
 * Intended final targets (Phase 2 decides): PROJECTS -> /gallery or /projects, MANUFACTURING -> a manufacturing page or /about.
 */
export const productNav: NavItem[] = productCategories.map((p) => ({ label: p.navLabel, to: productHref(p) }));

/** Extra entries under PRODUCTS: the 12 EdgeLuxe letter systems and the configurator stay discoverable. */
export const productNavExtras: NavItem[] = [
  { label: "All 12 letter systems", to: "/#light-effects" },
  { label: "3D Configurator", to: CTA_LINKS.tryConfigurator.to },
];

export const primaryNav: NavItem[] = [
  { label: "Projects", to: "/gallery" },
  { label: "Manufacturing", to: "/#manufacturing" },
  { label: "About", to: "/about" },
];
