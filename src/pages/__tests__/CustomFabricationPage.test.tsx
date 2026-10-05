import { waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FORBIDDEN, internalHrefs, renderAt, validRoutes } from "./helpers/renderPage";
import { CTA_PRIMARY, RETIRED_CTA_LABELS } from "../../lib/cta";
import { customFaqs, customOffers, customSpecs } from "../../data/customFabrication";
import { SITE_URL } from "../../lib/seo";

const PATH = "/services/custom-sign-fabrication";

describe("/services/custom-sign-fabrication", () => {
  it("routes to its own page with one H1 and the primary CTA in the hero", () => {
    const { main } = renderAt(PATH);
    const h1s = within(main).getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toBe("Custom Sign Fabrication.Made to Your Drawings.");
    const hero = main.querySelector("section")!;
    expect(within(hero).getByRole("link", { name: new RegExp(CTA_PRIMARY.label, "i") })).toHaveAttribute("href", "/contact");
  });

  it("names blade signs and push-through cabinet signs only as part of custom fabrication, with the owner's earlier wording", () => {
    const { main } = renderAt(PATH);
    const offers = main.querySelector("#what-we-make") as HTMLElement;
    expect(customOffers.map((o) => o.title)).toEqual(["Push-through cabinet signs", "Blade signs", "Illuminated logos & letter projects"]);
    expect(offers.textContent).toContain("Illuminated cabinets with CNC-routed aluminum faces and push-through acrylic graphics");
    expect(offers.textContent).toMatch(/double-sided/i);
    expect(main.textContent).toMatch(/custom to project/i);
    expect(main.textContent).not.toMatch(/light ?box/i);
  });

  it("has the spec sheet from the owner's content only: custom size, aluminum + acrylic, internal LED, UL 48, 3 years", () => {
    const { main } = renderAt(PATH);
    const specs = main.querySelector("#specifications")!.textContent!;
    const blob = customSpecs.map((s) => s.value).join(" ");
    expect(blob).toContain("CNC-routed aluminum face with push-through acrylic graphics");
    expect(blob).toContain("Internal LED");
    expect(blob).toContain("Single-sided, double-sided or blade");
    expect(specs).toContain("UL 48 listed");
    expect(specs).toContain("3 years");
    // no invented dimensions: the only digits are the owner's 24 to 48 hours, 3 years and UL 48
    const digits = (specs.match(/\d+/g) ?? []).filter((n) => !["48", "3", "24"].includes(n));
    expect(digits).toEqual([]);
  });

  it("has the 'bring us your drawing' call to action, the process, projects and FAQ in order", () => {
    const { main } = renderAt(PATH);
    const ids = [...main.querySelectorAll("section[id]")].map((s) => s.id);
    expect(ids.filter((id) => ["what-we-make", "drawing", "specifications", "process", "projects", "faq", "request-pricing"].includes(id))).toEqual([
      "what-we-make",
      "drawing",
      "specifications",
      "process",
      "projects",
      "faq",
      "request-pricing",
    ]);
    const drawing = main.querySelector("#drawing") as HTMLElement;
    expect(drawing.textContent).toContain("Bring us your drawing.");
    expect(within(drawing).getByRole("link", { name: new RegExp(CTA_PRIMARY.label, "i") })).toHaveAttribute("href", "/contact");
    const faq = main.querySelector("#faq") as HTMLElement;
    for (const f of customFaqs) expect(within(faq).getByText(f.q)).toBeInTheDocument();
  });

  it("sets title, description, canonical and Service + BreadcrumbList + FAQPage JSON-LD", async () => {
    renderAt(PATH);
    await waitFor(() => expect(document.title).toBe("Custom Sign Fabrication: Blade and Cabinet Signs | Sunlite Signs"));
    expect(document.head.querySelector('meta[name="description"]')!.getAttribute("content")).toMatch(/blade signs, push-through cabinet signs/i);
    expect(document.head.querySelector('link[rel="canonical"]')!.getAttribute("href")).toBe(`${SITE_URL}${PATH}`);
    const ld = [...document.head.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent!));
    expect(ld.map((x) => x["@type"]).sort()).toEqual(["BreadcrumbList", "FAQPage", "Service"]);
    expect(ld.find((x) => x["@type"] === "FAQPage").mainEntity).toHaveLength(customFaqs.length);
    expect(JSON.stringify(ld)).not.toMatch(/rating|review|"price|offers|light ?box/i);
    expect(ld.find((x) => x["@type"] === "BreadcrumbList").itemListElement.map((i: { name: string }) => i.name)).toEqual(["Home", "Products", "Custom Fabrication"]);
  });

  it("links to the flat cutouts (LP 1), the letter systems and the configurator, and every internal link resolves", () => {
    const { main, container } = renderAt(PATH);
    const hrefs = internalHrefs(main);
    for (const h of ["/light-effects/lp-1-flat-cutout", "/services/ultra-slim-trimless-channel-letters", "/services/channel-letters", "/configurator"]) {
      expect(hrefs, h).toContain(h);
    }
    for (const href of internalHrefs(container)) {
      const [route, hash] = href.split("#");
      expect(validRoutes.has(route === "" ? "/" : route.split("?")[0]), href).toBe(true);
      if (hash && route === PATH) expect(container.querySelector(`#${hash}`), `#${hash}`).not.toBeNull();
    }
  });

  it("uses shared CTA wording, no forbidden claims and no trimmed letters", () => {
    const { main } = renderAt(PATH);
    const text = main.textContent!;
    for (const f of FORBIDDEN) expect(text).not.toMatch(f);
    for (const r of RETIRED_CTA_LABELS) expect(text).not.toContain(r);
    expect(text).not.toMatch(/trimmed|trim cap/i);
    for (const a of within(main).getAllByRole("link", { name: new RegExp(CTA_PRIMARY.label, "i") })) expect(a).toHaveAttribute("href", "/contact");
  });
});
