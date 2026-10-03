import { productCategories, productHref } from "./products";
import { CTA_LINKS } from "../lib/cta";

export interface NavItem {
  label: string;
  to: string;
}

/**
 * Header / footer navigation (brief section 13). Final targets:
 * PRODUCTS (channel letters, ultra-slim, cast acrylic, custom fabrication), PROJECTS -> /projects,
 * MANUFACTURING -> /manufacturing, ABOUT -> /about. Product targets come from data/products.ts.
 */
export const productNav: NavItem[] = productCategories.map((p) => ({ label: p.navLabel, to: productHref(p) }));

/** Extra entries under PRODUCTS: the 12 EdgeLuxe letter systems and the configurator stay discoverable. */
export const productNavExtras: NavItem[] = [
  { label: "All 12 letter systems", to: "/#light-effects" },
  { label: "3D Configurator", to: CTA_LINKS.tryConfigurator.to },
];

export const primaryNav: NavItem[] = [
  { label: "Projects", to: CTA_LINKS.viewProjects.to },
  { label: "Manufacturing", to: CTA_LINKS.viewManufacturing.to },
  { label: "About", to: "/about" },
];
