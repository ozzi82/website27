import { waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CUSTOM_ONLY_TERMS, FORBIDDEN, internalHrefs, mmClaims, renderAt, spacedText, textOutsideCustomFabrication, trimClaimViolations, validRoutes } from "./helpers/renderPage";
import { CTA_PRIMARY, RETIRED_CTA_LABELS } from "../../lib/cta";
import { configurations } from "../../data/configurations";
import { lp11, lp11Variants, ultraSlimSpecs } from "../../data/ultraSlim";
import { SITE_URL } from "../../lib/seo";

const PATH = "/services/ultra-slim-trimless-channel-letters";

describe("/services/ultra-slim-trimless-channel-letters (the EdgeLuxe LP 11 series)", () => {
  it("routes to the dedicated page with the owner's H1 and body", () => {
    const { main } = renderAt(PATH);
    const h1 = within(main).getByRole("heading", { level: 1 });
    expect(h1.textContent).toBe("Ultra-Slim Channel Letters.Just 25–30 mm Deep.");
    expect(h1.querySelector("br")).not.toBeNull();
    expect(main.textContent).toContain(
      "A cleaner alternative to conventional deep-return channel letters — engineered for premium retail, architectural and interior signage applications.",
    );
  });

  it("describes ultra-slim as the signature LP 11 cast block acrylic line, with embedded LEDs and IP67 sealing", () => {
    const { main } = renderAt(PATH);
    expect(main.textContent).toMatch(/signature product/i);
    expect(main.textContent).toMatch(/EdgeLuxe LP 11 series of cast block acrylic letters/i);
    expect(main.textContent).toMatch(/LEDs embedded in the body/i);
    expect(main.textContent).toMatch(/IP67/);
    // no longer framed as a "specialized option" next to a standard channel letter depth
    expect(main.textContent).not.toMatch(/specialized (premium )?option/i);
    expect(main.textContent).not.toMatch(/depths differ by system/i);
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

  it("has the primary CTA in the hero and the large depth comparison labelled as trim-cap versus LP 11", () => {
    const { main } = renderAt(PATH);
    const hero = main.querySelector("section")!;
    expect(within(hero).getByRole("link", { name: new RegExp(CTA_PRIMARY.label, "i") })).toHaveAttribute("href", "/contact");
    const depth = main.querySelector("#depth")!;
    expect(within(depth as HTMLElement).getByRole("img", { name: /conventional trim-cap channel letter.*versus Sunlite Ultra-Slim LP 11/i })).toBeInTheDocument();
    expect(depth.querySelector("figure")!.className).toContain("max-w-3xl");
    expect(depth.textContent).toMatch(/SUNLITE ULTRA-SLIM \(LP 11\)/);
    expect(depth.textContent).toMatch(/does not build/i);
    expect(depth.textContent).toMatch(/cleaner profile/i);
    expect(depth.textContent).toMatch(/less visual bulk/i);
  });

  it("shows a prominent grid of the eight LP 11 variants, each linking to its page and to the configurator pre-selected", () => {
    const { main } = renderAt(PATH);
    const section = main.querySelector("#variants") as HTMLElement;
    expect(lp11.map((c) => c.code)).toEqual(["LP 11-F", "LP 11-B", "LP 11-FB", "LP 11-BS", "LP 11-FS", "LP 11-S", "LP 11-N", "LP 11-C"]);
    const cards = [...section.querySelectorAll("[data-system]")];
    expect(cards.map((c) => c.getAttribute("data-system"))).toEqual(lp11.map((c) => c.code));
    for (const v of lp11Variants) {
      const card = section.querySelector(`[data-system="${v.code}"]`) as HTMLElement;
      expect(card.querySelector("img")!.getAttribute("src")).toBe(v.img);
      expect(within(card).getByRole("link", { name: /view system/i })).toHaveAttribute("href", `/light-effects/${v.id}`);
      expect(within(card).getByRole("link", { name: /preview in 3d/i })).toHaveAttribute("href", `/configurator?config=${v.id}`);
      expect(configurations.some((c) => c.id === v.id)).toBe(true);
    }
    // the F / B / S / N / C legend
    for (const code of ["F", "B", "S", "N", "C"]) expect(within(section).getByText(code, { selector: "dt" })).toBeInTheDocument();
    for (const w of ["Face", "Back (halo)", "Side", "Neon", "Conical"]) expect(section.textContent).toContain(w);
  });

  it("describes LP 11-FS as face-lit plus a partial front side band", () => {
    const { main } = renderAt(PATH);
    const fs = main.querySelector('#variants [data-system="LP 11-FS"]') as HTMLElement;
    expect(fs.textContent).toMatch(/face glows and a thin band lights the front edge of the side wall/i);
    expect(fs.textContent).toContain("Face-lit + Partial Front Side-lit");
    expect(fs.textContent).toContain("Flush or stand-off");
  });

  it("states the brochure depths without contradicting them: 30 mm standard, 25 mm for small letters, LP 11-B thinner", () => {
    const f = configurations.find((c) => c.id === "lp-11-f-face-lit")!;
    const b = configurations.find((c) => c.id === "lp-11-b-back-lit")!;
    expect(Math.max(...f.depthOptionsMm)).toBe(30);
    expect(Math.min(...f.depthOptionsMm)).toBe(25);
    expect(b.depthOptionsMm).toEqual([10, 15, 20, 30]);
    const { main } = renderAt(PATH);
    const specs = main.querySelector("#specifications")!.textContent!;
    expect(specs).toMatch(/30 mm \(1\.2″\) standard/);
    expect(specs).toMatch(/25 mm \(1″\) for small letters/);
    expect(specs).toMatch(/LP 11-B is also offered at 10, 15 and 20 mm/);
    expect(specs).toMatch(/Epoxy-sealed for IP67/);
    expect(specs).toMatch(/2″ \(50 mm\)/);
    expect(specs).toMatch(/0\.47″ \(12 mm\)/);
    expect(ultraSlimSpecs.find((s) => s.label === "Mounting")!.value).toBe(
      "Flush to the wall or on stand-off spacers. LP 11-B and LP 11-FB are stand-off only, because the halo needs the gap to reach the wall.",
    );
  });

  it("explains face, halo and face + halo with the section drawings, and the other variants in words", () => {
    const { main } = renderAt(PATH);
    const kinds = [...main.querySelectorAll("[data-diagram]")].map((d) => d.getAttribute("data-diagram"));
    // The three section drawings, then one animated, data-driven drawing per other variant, then stand-off versus flush.
    expect(kinds).toEqual([
      "lighting-front",
      "lighting-halo",
      "lighting-front-back",
      "config-lp-11-bs-back-side-lit",
      "config-lp-11-fs-front-side-lit",
      "config-lp-11-s-side-lit",
      "config-lp-11-n-faux-neon",
      "config-lp-11-c-conical",
      "mount-standoff",
      "mount-flush",
    ]);
    const section = main.querySelector("#illumination")!;
    for (const t of ["Face lit", "Halo (back) lit", "Face + halo", "Partial back side-lit", "Face-lit + partial front side-lit", "Full side-lit", "Faux neon", "Conical"]) {
      expect(section.textContent).toContain(t);
    }
  });

  it("covers installation from brochure facts: standoff spacers versus flush-mount", () => {
    const { main } = renderAt(PATH);
    const text = main.querySelector("#installation")!.textContent!;
    expect(text).toMatch(/printed installation template/);
    expect(text).toMatch(/LP 11-B and LP 11-FB are mounted on standoff spacers/);
    expect(text).toMatch(/the other LP 11 variants can be mounted flush to the surface or on standoffs/);
  });

  it("keeps project photography with a side-profile slot, and real images only", () => {
    const { main } = renderAt(PATH);
    const slot = main.querySelector('[data-slot="side-profile"]')!;
    expect(slot.textContent).toContain("Side-profile photography — coming soon");
    expect(slot.querySelector("img")).toBeNull();
    const imgs = [...main.querySelectorAll("img")].map((i) => i.getAttribute("src")!);
    for (const src of imgs) expect(src.startsWith("/images/"), src).toBe(true);
    expect(imgs.some((s) => s.includes("1787683170345"))).toBe(true);
  });

  it("cross-links to the classic letters (30-100 mm, fabricated stainless steel) and never says stainless is the 25-30 mm product", () => {
    const { main } = renderAt(PATH);
    const classic = main.querySelector("#classic") as HTMLElement;
    expect(classic.textContent).toMatch(/trimless fabricated stainless steel in depths from 30 to 100 mm/);
    expect(classic.textContent).toMatch(/only 25–30 mm line/);
    for (const code of ["LP 5", "LP 3.1", "LP 3.2"]) expect(classic.textContent).toContain(code);
    expect(internalHrefs(classic)).toContain("/services/channel-letters");
    expect(main.textContent).not.toMatch(/Standard depths start at 30 mm/);
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

  it("states only brochure or brief numbers, offers no trim caps, and keeps cabinet or blade signs off the page", () => {
    const { main } = renderAt(PATH);
    const text = main.textContent!;
    const allowed = new Set(["25–30 mm", "30 mm", "25 mm", "10 mm", "15 mm", "20 mm", "12 mm", "50 mm", "3 mm", "75 mm", "100 mm", "12.7 mm"]);
    for (const m of mmClaims(spacedText(main))) expect(allowed.has(m), m).toBe(true);
    for (const f of FORBIDDEN) expect(text).not.toMatch(f);
    expect(textOutsideCustomFabrication(main)).not.toMatch(CUSTOM_ONLY_TERMS);
    expect(trimClaimViolations(spacedText(main))).toEqual([]);
    for (const r of RETIRED_CTA_LABELS) expect(text).not.toContain(r);
  });

  it("the merged cast-block-acrylic URL lands here", () => {
    const { main } = renderAt("/services/cast-block-acrylic");
    expect(within(main).getByRole("heading", { level: 1 }).textContent).toBe("Ultra-Slim Channel Letters.Just 25–30 mm Deep.");
  });
});
