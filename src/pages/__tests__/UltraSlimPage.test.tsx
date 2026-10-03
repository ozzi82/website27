import { waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FORBIDDEN, internalHrefs, mmClaims, renderAt, spacedText, validRoutes } from "./helpers/renderPage";
import { CTA_PRIMARY, RETIRED_CTA_LABELS } from "../../lib/cta";
import { configurations } from "../../data/configurations";
import { relatedSystems, ultraSlimSpecs } from "../../data/ultraSlim";
import { SITE_URL } from "../../lib/seo";

const PATH = "/services/ultra-slim-trimless-channel-letters";

describe("/services/ultra-slim-trimless-channel-letters", () => {
  it("routes to the dedicated page with the brief's H1 and body", () => {
    const { main } = renderAt(PATH);
    const h1 = within(main).getByRole("heading", { level: 1 });
    expect(h1.textContent).toBe("Ultra-Slim Channel Letters.Just 25–30 mm Deep.");
    expect(h1.querySelector("br")).not.toBeNull();
    expect(main.textContent).toContain(
      "A cleaner alternative to conventional deep-return channel letters — engineered for premium retail, architectural and interior signage applications.",
    );
  });

  it("frames 25-30 mm as a specialized option, never the standard depth", () => {
    const { main } = renderAt(PATH);
    expect(main.textContent).toMatch(/specialized premium option, not the standard depth of our channel letters/i);
    expect(main.textContent).not.toMatch(/standard (channel letter )?depth is 25/i);
  });

  it("sets the exact SEO title (no site suffix), description, canonical and Product + BreadcrumbList JSON-LD", async () => {
    renderAt(PATH);
    await waitFor(() => expect(document.title).toBe("Ultra-Slim Trimless Channel Letters | 25–30 mm Depth"));
    expect(document.head.querySelector('meta[property="og:title"]')!.getAttribute("content")).toBe(document.title);
    expect(document.head.querySelector('meta[name="description"]')!.getAttribute("content")).toMatch(/25–30 mm/);
    expect(document.head.querySelector('link[rel="canonical"]')!.getAttribute("href")).toBe(`${SITE_URL}${PATH}`);
    const ld = [...document.head.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent!));
    expect(ld.map((x) => x["@type"]).sort()).toEqual(["BreadcrumbList", "Product"]);
    expect(JSON.stringify(ld)).not.toMatch(/rating|review|"price|offers/i);
  });

  it("has the primary CTA in the hero and the large depth comparison", () => {
    const { main } = renderAt(PATH);
    const hero = main.querySelector("section")!;
    expect(within(hero).getByRole("link", { name: new RegExp(CTA_PRIMARY.label, "i") })).toHaveAttribute("href", "/contact");
    const depth = main.querySelector("#depth")!;
    expect(within(depth as HTMLElement).getByRole("img", { name: /conventional channel letter versus sunlite ultra-slim/i })).toBeInTheDocument();
    expect(depth.querySelector("figure")!.className).toContain("max-w-3xl");
    expect(depth.textContent).toMatch(/cleaner profile/i);
    expect(depth.textContent).toMatch(/less visual bulk/i);
  });

  it("covers the focus areas: attributes, illumination, specs, installation, project photography with a side-profile slot", () => {
    const { main } = renderAt(PATH);
    for (const a of ["25–30 mm depth", "Trimless construction", "Face / halo / dual lit"]) expect(main.textContent).toContain(a);
    const kinds = [...main.querySelectorAll("[data-diagram]")].map((d) => d.getAttribute("data-diagram"));
    expect(kinds).toEqual(["lighting-front", "lighting-halo", "lighting-front-back"]);
    for (const t of ["Face lit", "Halo lit", "Dual lit"]) expect(main.querySelector("#illumination")!.textContent).toContain(t);
    expect(main.querySelector("#specifications")!.textContent).toContain("25–30 mm");
    expect(main.querySelector("#installation")!.textContent).toMatch(/drill template and wiring plan/);
    const slot = main.querySelector('[data-slot="side-profile"]')!;
    expect(slot.textContent).toContain("Side-profile photography — coming soon");
    expect(slot.querySelector("img")).toBeNull();
  });

  it("uses real project photos that link back here and no stock imagery", () => {
    const { main } = renderAt(PATH);
    const imgs = [...main.querySelectorAll("img")].map((i) => i.getAttribute("src")!);
    for (const src of imgs) expect(src.startsWith("/images/"), src).toBe(true);
    expect(imgs.some((s) => s.includes("1787683170345"))).toBe(true);
  });

  it("describes related systems from the brochure data without contradicting it", () => {
    const lp5 = configurations.find((c) => c.id === "lp-5-trimless-face-lit")!;
    const lp11 = configurations.find((c) => c.id === "lp-11-f-face-lit")!;
    expect(Math.min(...lp5.depthOptionsMm)).toBe(30);
    expect(Math.min(...lp11.depthOptionsMm)).toBe(25);
    const { main } = renderAt(PATH);
    const section = main.querySelector("#related-systems")!;
    expect(section.textContent).toContain("Standard depths start at 30 mm");
    expect(section.textContent).toContain("30 mm standard, 25 mm for small letters");
    expect(relatedSystems.map((s) => s.code)).toEqual(["LP 5", "LP 11-F"]);
    expect(ultraSlimSpecs.find((s) => s.label === "Materials")!.value).toMatch(/specified per project/i);
  });

  it("cross-links to channel letters and every internal link resolves", () => {
    const { main, container } = renderAt(PATH);
    expect(within(main).getAllByRole("link").some((a) => a.getAttribute("href") === "/services/channel-letters")).toBe(true);
    for (const href of internalHrefs(container)) {
      const [route, hash] = href.split("#");
      expect(validRoutes.has(route === "" ? "/" : route.split("?")[0]), href).toBe(true);
      if (hash && route === PATH) expect(container.querySelector(`#${hash}`), `#${hash}`).not.toBeNull();
    }
  });

  it("states no unsupported numbers and no cabinets", () => {
    const { main } = renderAt(PATH);
    const text = main.textContent!;
    // 25-30 mm (brief), plus the brochure depths in the related-systems block (30 mm, 25 mm)
    for (const m of mmClaims(spacedText(main))) expect(["25–30 mm", "30 mm", "25 mm"], m).toContain(m);
    for (const f of FORBIDDEN) expect(text).not.toMatch(f);
    for (const r of RETIRED_CTA_LABELS) expect(text).not.toContain(r);
  });
});
