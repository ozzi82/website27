import { services } from "../data/services";
import { configurations } from "../data/configurations";

/** Every route that ships as static HTML (the WebGL /configurator stays a client-rendered SPA page). */
export function getPrerenderRoutes(): string[] {
  return [
    "/",
    "/about",
    "/gallery",
    "/contact",
    ...services.map((s) => `/services/${s.id}`),
    ...configurations.map((c) => `/light-effects/${c.id}`),
  ];
}
