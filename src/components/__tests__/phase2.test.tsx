import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { describe, expect, it } from "vitest";
import Breadcrumbs from "../Breadcrumbs";
import RelatedLinks from "../RelatedLinks";
import Seo from "../Seo";
import { LightingDiagram, MountingDiagram, TrimDiagram } from "../diagrams/LetterDiagrams";
import { SITE_URL, breadcrumbJsonLd } from "../../lib/seo";
import { channelLetterFaqs, channelLetterSpecs, classicSystems, illuminationTypes, mountingOptions, trimComparison } from "../../data/channelLetters";
import { customFaqs, customSpecs } from "../../data/customFabrication";
import { lp11Variants, ultraSlimSpecs } from "../../data/ultraSlim";
import { configurations } from "../../data/configurations";
import { trimClaimViolations } from "../../pages/__tests__/helpers/renderPage";

const wrap = (ui: React.ReactElement) => render(<HelmetProvider><MemoryRouter>{ui}</MemoryRouter></HelmetProvider>);

describe("Breadcrumbs", () => {
  const crumbs = [
    { label: "Home", to: "/" },
    { label: "Products", to: "/#products" },
    { label: "Channel Letters", to: "/services/channel-letters" },
  ];

  it("links every crumb but the current page, which is marked aria-current", () => {
    wrap(<Breadcrumbs items={crumbs} />);
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(nav).getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual(["/", "/#products"]);
    expect(within(nav).getByText("Channel Letters")).toHaveAttribute("aria-current", "page");
  });

  it("builds BreadcrumbList JSON-LD from the same crumbs", () => {
    const ld = breadcrumbJsonLd(crumbs);
    expect(ld["@type"]).toBe("BreadcrumbList");
    expect(ld.itemListElement.map((i) => [i.position, i.name, i.item])).toEqual([
      [1, "Home", SITE_URL],
      [2, "Products", `${SITE_URL}/#products`],
      [3, "Channel Letters", `${SITE_URL}/services/channel-letters`],
    ]);
  });
});

describe("RelatedLinks", () => {
  it("renders each item as one link with its title and text", () => {
    wrap(<RelatedLinks items={[{ to: "/projects", title: "Projects", text: "See recent production." }, { to: "/manufacturing", title: "Manufacturing", text: "How it is made." }]} />);
    const links = within(screen.getByRole("region", { name: "Related pages" })).getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["/projects", "/manufacturing"]);
    expect(links[0].textContent).toContain("See recent production.");
  });
});

describe("Seo exactTitle", () => {
  it("uses the title verbatim when asked and appends the site name otherwise", async () => {
    const { rerender } = wrap(<Seo title="Ultra-Slim Trimless Channel Letters | 25–30 mm Depth" exactTitle description="d" path="/x" />);
    await waitFor(() => expect(document.title).toBe("Ultra-Slim Trimless Channel Letters | 25–30 mm Depth"));
    rerender(<HelmetProvider><MemoryRouter><Seo title="Projects" description="d" path="/x" /></MemoryRouter></HelmetProvider>);
    await waitFor(() => expect(document.title).toBe("Projects | Sunlite Signs"));
  });

  it("does not duplicate the site name when the title already has it", async () => {
    wrap(<Seo title="Wholesale Channel Letter Manufacturer | Sunlite Signs" description="d" path="/x" />);
    await waitFor(() => expect(document.title).toBe("Wholesale Channel Letter Manufacturer | Sunlite Signs"));
  });
});

describe("letter diagrams", () => {
  it("each drawing is an accessible image, scales with its container and carries no numbers", () => {
    const { container } = render(
      <>
        {(["front", "halo", "front-back"] as const).map((k) => <LightingDiagram key={k} kind={k} />)}
        {(["trimmed", "trimless"] as const).map((k) => <TrimDiagram key={k} kind={k} />)}
        {(["flush", "standoff", "raceway", "remote"] as const).map((k) => <MountingDiagram key={k} kind={k} />)}
      </>,
    );
    const svgs = [...container.querySelectorAll("svg")];
    expect(svgs).toHaveLength(9);
    for (const svg of svgs) {
      expect(svg.getAttribute("role")).toBe("img");
      expect(svg.getAttribute("aria-label")).toMatch(/section diagram/i);
      expect(svg.getAttribute("viewBox")).toBe("0 0 240 150");
      expect(svg.textContent).not.toMatch(/\d/);
    }
    const ids = [...container.querySelectorAll("[id]")].map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("states where the light goes in the label of each lighting diagram", () => {
    const { container } = render(<><LightingDiagram kind="front" /><LightingDiagram kind="halo" /><LightingDiagram kind="front-back" /></>);
    const labels = [...container.querySelectorAll("svg")].map((s) => s.getAttribute("aria-label")!);
    expect(labels[0]).toMatch(/through the face/);
    expect(labels[1]).toMatch(/wall behind/);
    expect(labels[2]).toMatch(/face and onto the wall/);
  });
});

describe("page data", () => {
  it("covers the classic trimless systems and the trim-cap comparison", () => {
    expect(classicSystems.map((s) => s.code)).toEqual(["LP 5", "LP 3.1", "LP 3.2"]);
    expect(illuminationTypes.map((t) => t.title)).toEqual(["Face lit", "Halo lit"]);
    expect(trimComparison.map((t) => [t.title, t.status.value])).toEqual([
      ["Conventional trim-cap letter", "Not offered"],
      ["Sunlite trimless letter", "What we build"],
    ]);
    // only the two brochure mountings: no raceway, no remote mount
    expect(mountingOptions.map((m) => m.title)).toEqual(["Standoff mount", "Flush mount"]);
  });

  it("FAQ and spec text only restate supported claims (no invented numbers, no raceway or remote mounts)", () => {
    const blob = JSON.stringify([channelLetterFaqs, channelLetterSpecs, ultraSlimSpecs, customFaqs, customSpecs]);
    expect(blob).not.toMatch(/light ?box|raceway|remote/i);
    // numeric facts: 48 hours, 3-4 weeks, 3 years, UL 48, and brochure sizes (depths, heights, strokes, system codes)
    const allowed = new Set(["48", "3", "4", "3–4", "25–30", "25", "30", "1", "1.2", "2", "50", "75", "100", "0.5", "15", "10", "12", "20", "0.47", "0.79", "0.12", "11", "5", "3.1", "3.2", "67"]);
    const numbers = (blob.match(/\d+(?:[–.]\d+)?/g) ?? []).filter((n) => !allowed.has(n));
    expect(numbers).toEqual([]);
    for (const f of [...channelLetterFaqs, ...customFaqs]) {
      expect(f.q.length).toBeGreaterThan(10);
      expect(f.a.length).toBeGreaterThan(10);
    }
  });

  it("no spec or FAQ text offers a trim-capped letter", () => {
    const text = [...channelLetterFaqs.map((f) => `${f.q}. ${f.a}`), ...channelLetterSpecs.map((s) => `${s.label}: ${s.value}.`), ...customFaqs.map((f) => `${f.a}`)].join(" ");
    expect(trimClaimViolations(text)).toEqual([]);
    expect(trimClaimViolations("We offer trimmed and trimless letters.")).toHaveLength(1);
    expect(trimClaimViolations("Every letter is trimless, with no trim cap.")).toEqual([]);
  });

  it("the LP 11 variants and classic systems state the brochure depths, never more", () => {
    const depth = (code: string) => lp11Variants.find((v) => v.code === code)!.depth;
    expect(depth("LP 11-F")).toBe("25 or 30 mm");
    expect(depth("LP 11-B")).toBe("10, 15, 20 or 30 mm");
    expect(depth("LP 11-FS")).toBe("30 mm");
    expect(lp11Variants.map((v) => v.suffix)).toEqual(["F", "B", "FB", "BS", "FS", "S", "N", "C"]);
    const lp5 = classicSystems.find((s) => s.code === "LP 5")!;
    expect(lp5.depths).toBe("30, 50, 75 or 100 mm, or custom");
    for (const s of classicSystems) {
      const c = configurations.find((x) => x.id === s.id)!;
      expect(c.depthOptionsMm).toEqual([30, 50, 75, 100]);
    }
  });
});
