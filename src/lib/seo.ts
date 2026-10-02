export const SITE_URL = "https://sunlitesigns.com";
export const SITE_NAME = "Sunlite Signs";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/pasted-image-1787755330414-fxpkbj9m.png`;

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
