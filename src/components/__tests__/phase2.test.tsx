import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { describe, expect, it } from "vitest";
import Breadcrumbs from "../Breadcrumbs";
import RelatedLinks from "../RelatedLinks";
import Seo from "../Seo";
import { LightingDiagram, MountingDiagram, TrimDiagram } from "../diagrams/LetterDiagrams";
import { breadcrumbJsonLd } from "../../lib/seo";
import { channelLetterFaqs, channelLetterSpecs, illuminationTypes, mountingOptions, trimOptions } from "../../data/channelLetters";
import { relatedSystems, ultraSlimSpecs } from "../../data/ultraSlim";

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
      [1, "Home", "https://sunlitesigns.com"],
      [2, "Products", "https://sunlitesigns.com/#products"],
      [3, "Channel Letters", "https://sunlitesigns.com/services/channel-letters"],
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
  it("covers the brief's configurations", () => {
    expect(illuminationTypes.map((t) => t.title)).toEqual(["Front lit", "Reverse / halo lit", "Front + back lit"]);
    expect(trimOptions.map((t) => t.title)).toEqual(["Trimmed", "Trimless"]);
    expect(mountingOptions.map((m) => m.title)).toEqual(["Flush mount", "Standoff mount", "Raceway mount", "Remote mount"]);
  });

  it("FAQ and spec text only restate supported claims (no invented numbers, no cabinets)", () => {
    const blob = JSON.stringify([channelLetterFaqs, channelLetterSpecs, ultraSlimSpecs]);
    expect(blob).not.toMatch(/cabinet|light ?box/i);
    // the only numeric facts: 48 hours, 3-4 weeks, 3 years, UL 48, 25-30 mm (and the 1"-1.2" depth conversion)
    const numbers = (blob.match(/\d+(?:[–.]\d+)?/g) ?? []).filter((n) => !["48", "3", "4", "3–4", "25–30", "25", "30", "1", "1.2"].includes(n));
    expect(numbers).toEqual([]);
    for (const f of channelLetterFaqs) {
      expect(f.q.length).toBeGreaterThan(10);
      expect(f.a.length).toBeGreaterThan(10);
    }
  });

  it("related systems never claim more than the brochure data says", () => {
    expect(relatedSystems.find((s) => s.code === "LP 5")!.depthText).toBe("Standard depths start at 30 mm");
    expect(relatedSystems.find((s) => s.code === "LP 11-F")!.depthText).toBe("30 mm standard, 25 mm for small letters");
  });
});
