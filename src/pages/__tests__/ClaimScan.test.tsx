import { describe, expect, it } from "vitest";
import { CUSTOM_ONLY_TERMS, renderAt, spacedText, textOutsideCustomFabrication, trimClaimViolations } from "./helpers/renderPage";
import { getPrerenderRoutes } from "../../lib/routes";

/**
 * Site-wide claim scan over every prerendered page (owner taxonomy, 2026-10-03):
 *  - Sunlite builds no trim-capped letters: "trimmed" / "trim cap" appear only in negations and in the labelled comparison
 *    with a conventional letter, never as something offered.
 *  - Blade signs and push-through cabinet signs belong to custom fabrication only (its page, its product card and the
 *    links that point to it); "light box" is never claimed anywhere.
 *  - There is no raceway or remote-mount claim.
 */
describe("claim scan over every prerendered route", () => {
  for (const route of getPrerenderRoutes()) {
    it(`${route}: no offered trim caps, cabinet or blade signs only under custom fabrication, no light box, no raceway`, () => {
      const { main } = renderAt(route);
      const all = spacedText(main);
      expect(all, "light box").not.toMatch(/light ?box/i);
      expect(all, "raceway / remote mount").not.toMatch(/raceway|remote[- ]mount/i);
      if (route !== "/services/custom-sign-fabrication") {
        expect(textOutsideCustomFabrication(main), "cabinet or blade outside custom fabrication").not.toMatch(CUSTOM_ONLY_TERMS);
      }
      expect(trimClaimViolations(all), "trim caps offered").toEqual([]);
    });
  }
});
