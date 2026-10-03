import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AppRoutes } from "../../../App";
import { getPrerenderRoutes } from "../../../lib/routes";

/** Renders the real app routes (header, page, footer) at a path, like the browser and the prerender do. */
export function renderAt(path: string) {
  window.scrollTo = () => undefined;
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
  const result = render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </HelmetProvider>,
  );
  return { ...result, main: result.container.querySelector("main")! as HTMLElement };
}

/** Every internal route a link may point at. */
export const validRoutes = new Set<string>([...getPrerenderRoutes(), "/configurator"]);

/** The href of every internal link inside `root`. */
export function internalHrefs(root: Element): string[] {
  return [...root.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")!).filter((h) => h.startsWith("/"));
}

/** Millimetre figures and similar numeric claims in a text, for the "no invented numbers" checks. */
export function mmClaims(text: string): string[] {
  return [...text.matchAll(/\d+(?:[–.]\d+)?\s?mm/g)].map((m) => m[0]);
}

export const FORBIDDEN = [/cabinet/i, /light ?box/i, /testimonial/i, /\b(built|made|manufactured|fabricated|produced) in tampa/i, /\d+\s?%/, /\d+\+\s/];

/** Text of an element with a space between adjacent text nodes (textContent glues "01" and "25-30 mm" together). */
export function spacedText(el: Element): string {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const parts: string[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) parts.push(n.textContent ?? "");
  return parts.join(" ").replace(/\s+/g, " ");
}
