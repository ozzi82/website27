import { services } from "../data/services";
import { configurations } from "../data/configurations";

/** Every route that ships as static HTML (the WebGL /configurator stays a client-rendered SPA page). */
export function getPrerenderRoutes(): string[] {
  return [
    "/",
    "/about",
    "/manufacturing",
    "/projects",
    "/contact",
    ...services.map((s) => `/services/${s.id}`),
    ...configurations.map((c) => `/light-effects/${c.id}`),
  ];
}

/**
 * Top-level pages that moved. The client redirects them (App.tsx) and the hosts answer with a real 301
 * (public/_redirects, nginx.conf), so old links and indexed URLs do not 404.
 * Retired /services/* URLs live next to the product data (LEGACY_SERVICE_REDIRECTS in data/products.ts).
 */
export const LEGACY_PAGE_REDIRECTS: Record<string, string> = {
  "/gallery": "/projects",
};
