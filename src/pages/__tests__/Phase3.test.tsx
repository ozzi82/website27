import { within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FORBIDDEN, internalHrefs, renderAt, spacedText, validRoutes } from "./helpers/renderPage";
import { CTA_LINKS } from "../../lib/cta";
import { CONFIGURATOR_META } from "../../lib/configuratorMeta";
import { configurations } from "../../data/configurations";
import { productNavExtras } from "../../data/nav";
import { constructionRows, depthOptions, filesWeAccept, whatArrives } from "../../data/channelLetters";

describe("Build Your Sign (the configurator as a sales tool)", () => {
  it("is named Build Your Sign in the CTA links and the nav, still pointing at /configurator", () => {
    expect(CTA_LINKS.tryConfigurator).toEqual({ label: "Build Your Sign", to: "/configurator" });
    expect(productNavExtras.find((n) => n.to === "/configurator")?.label).toBe("Build Your Sign");
    expect(CONFIGURATOR_META.path).toBe("/configurator");
    expect(CONFIGURATOR_META.title).toMatch(/^Build Your Sign/);
    expect(CONFIGURATOR_META.description).toMatch(/wholesale pricing/i);
  });

  it("is not a primary nav item (only inside the Products dropdown) and the old label is gone from the header", () => {
    const { container } = renderAt("/");
    const nav = within(container.querySelector('nav[aria-label="Main"]') as HTMLElement);
    expect(nav.getAllByRole("link", { name: "Build Your Sign" })).toHaveLength(1);
    expect(nav.queryByText(/3d configurator/i)).toBeNull();
    expect(container.textContent).not.toMatch(/3D Configurator|Try the 3D/);
  });

  const pages: [string, string | undefined][] = [
    ["/services/channel-letters", "lp-5-trimless-face-lit"],
    ["/services/ultra-slim-trimless-channel-letters", "lp-11-f-face-lit"],
    ["/light-effects/lp-5-trimless-face-lit", "lp-5-trimless-face-lit"],
  ];
  for (const [path, config] of pages) {
    it(`${path} has the contextual Build Your Sign module`, () => {
      const { main } = renderAt(path);
      const aside = main.querySelector('aside[aria-label="Build Your Sign"]') as HTMLElement;
      expect(aside, "module present").not.toBeNull();
      const link = within(aside).getByRole("link", { name: /build your sign/i });
      expect(link.getAttribute("href")).toBe(config ? `/configurator?config=${config}` : "/configurator");
      expect(aside.textContent).toMatch(path.startsWith("/light-effects") ? /with your logo/i : /not sure which configuration you need/i);
    });
  }

  it("every preselected configurator id used by the modules exists", () => {
    const ids = new Set(configurations.map((c) => c.id));
    for (const [, config] of pages) if (config) expect(ids.has(config)).toBe(true);
  });

  it("the footer links to it", () => {
    const { container } = renderAt("/about");
    expect(within(container.querySelector("footer") as HTMLElement).getByRole("link", { name: "Build Your Sign" })).toHaveAttribute("href", "/configurator");
  });
});

describe("/services/channel-letters depth (construction, depth options, files, what arrives)", () => {
  it("has a Construction block built from the brochure (stainless steel returns and back, face, LEDs, power supply)", () => {
    const { main } = renderAt("/services/channel-letters");
    const section = main.querySelector("#construction") as HTMLElement;
    expect(section).not.toBeNull();
    expect(constructionRows.map((r) => r.label)).toEqual(["Returns and back", "Face", "LED system", "Power supply"]);
    for (const r of constructionRows) {
      expect(within(section).getByText(r.label)).toBeInTheDocument();
      expect(within(section).getByText(r.value)).toBeInTheDocument();
    }
    // no gauges, brands or invented specifics
    expect(section.textContent).not.toMatch(/(?<!thick )gauge|\bga\b|osram|samsung|philips|mean well|\d+\s?(mil|in\b|inch|")/i);
  });

  it("has the three depth options (brochure depths, custom, ultra-slim) and links the ultra-slim one to its page", () => {
    const { main } = renderAt("/services/channel-letters");
    const section = main.querySelector("#depth-options") as HTMLElement;
    expect(depthOptions.map((d) => d.title)).toEqual(["30 / 50 / 75 / 100 mm", "Custom depth", "Need it slimmer?"]);
    expect(within(section).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(depthOptions.map((d) => d.title));
    expect(within(section).getByRole("link", { name: /explore ultra-slim/i })).toHaveAttribute("href", "/services/ultra-slim-trimless-channel-letters");
    expect(section.textContent).toMatch(/signature product/i);
  });

  it("files we accept: only what the FAQ says (AI, EPS, PDF vector), no SVG/DXF for quotes; the preview note is separate", () => {
    const { main } = renderAt("/services/channel-letters");
    const section = main.querySelector("#files") as HTMLElement;
    const files = spacedText(within(section).getByText("Artwork").closest("dl") as HTMLElement);
    expect(files).toMatch(/AI, EPS or PDF/);
    expect(files).not.toMatch(/svg|dxf|dwg|cdr|png|jpe?g/i);
    expect(filesWeAccept.map((r) => r.label)).toEqual(["Artwork", "Size", "Site", "Brief"]);
    expect(section.textContent).toMatch(/Build Your Sign 3D preview accepts SVG or PDF/);
  });

  it("what arrives stays within the existing ready-to-install wording (no hardware, no test, no backer panel)", () => {
    const { main } = renderAt("/services/channel-letters");
    const section = main.querySelector("#what-arrives") as HTMLElement;
    const text = section.textContent!;
    for (const r of whatArrives) expect(text).toContain(r.value);
    expect(text).toMatch(/installation template/i);
    expect(text).toMatch(/touch-up paint/i);
    expect(text).not.toMatch(/pre-wired|wiring plan/i);
    expect(text).not.toMatch(/hardware|\btest|backer|mounting pattern|blind ship/i);
    expect(main.textContent).not.toMatch(/backer panel/i);
  });

  it("keeps links valid, no forbidden claims, the two brochure mountings, and the anchors in the on-this-page nav", () => {
    const { main } = renderAt("/services/channel-letters");
    for (const h of internalHrefs(main)) {
      const [p] = h.split("#");
      expect(validRoutes.has(p.split("?")[0] || "/"), h).toBe(true);
    }
    for (const f of FORBIDDEN) expect(main.textContent).not.toMatch(f);
    const nav = within(main.querySelector('nav[aria-label="On this page"]') as HTMLElement);
    expect(nav.getByRole("link", { name: "Construction" })).toHaveAttribute("href", "#construction");
    expect(nav.getByRole("link", { name: "Files" })).toHaveAttribute("href", "#files");
    expect(within(main.querySelector("#mounting") as HTMLElement).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Standoff mount",
      "Flush mount",
    ]);
  });
});
