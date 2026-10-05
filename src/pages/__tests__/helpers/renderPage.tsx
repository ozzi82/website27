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

export const FORBIDDEN = [/light ?box/i, /testimonial/i, /\b(built|made|manufactured|fabricated|produced) in tampa/i, /\d+\s?%/, /\d+\+\s/];

/** Text of an element with a space between adjacent text nodes (textContent glues "01" and "10–30 mm" together). */
export function spacedText(el: Element): string {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const parts: string[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) parts.push(n.textContent ?? "");
  return parts.join(" ").replace(/\s+/g, " ");
}

/** The custom-fabrication page path: the only place blade and cabinet signs are described. */
export const CUSTOM_PATH = "/services/custom-sign-fabrication";

/**
 * Text of `root` without the places where cabinet / blade signs may legitimately be named: the custom-fabrication product
 * card, links pointing at the custom page (nav, related copy), and the custom-fabrication pointer section.
 */
export function textOutsideCustomFabrication(root: Element): string {
  const clone = root.cloneNode(true) as Element;
  clone.querySelectorAll(`[data-product="custom-fabrication"], a[href="${CUSTOM_PATH}"], #custom-fabrication`).forEach((n) => n.remove());
  return spacedText(clone);
}

/** Cabinet, blade and light box signs: only custom fabrication may mention them. */
export const CUSTOM_ONLY_TERMS = /cabinet|\bblade\b|light ?box/i;

/**
 * Sentences that name a trim cap (or a "trimmed" letter) without saying Sunlite does not offer it. Sunlite builds no
 * trim-capped letters, so the only legitimate mentions are negations ("no trim cap", "we do not use trim caps") and the
 * labelled comparison with a conventional letter.
 */
export function trimClaimViolations(text: string): string[] {
  return text
    .split(/(?<=[.!?;])\s+/)
    .filter((sentence) => !sentence.includes("?")) // a question ("Do you build letters with a trim cap?") offers nothing
    .filter((sentence) => /trim(med|-capped| cap)/i.test(sentence))
    .filter((sentence) => !/\b(no|not|never|without|conventional)\b|n't/i.test(sentence));
}
