import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ProductConstruction, { ConstructionList, startDepth } from "../ProductConstruction";
import { configurations } from "../../data/configurations";

const lp5 = configurations.find((c) => c.code === "LP 5")!;
const lp11b = configurations.find((c) => c.code === "LP 11-B")!;

describe("how a product is built (product pages)", () => {
  it("shows the section drawing and offers both drawings as files, at the chosen depth", () => {
    render(<ProductConstruction config={lp5} />);
    const first = startDepth(lp5.depthOptionsMm);
    expect(first).toBe(50);
    expect(startDepth(lp11b.depthOptionsMm)).toBe(Math.max(...lp11b.depthOptionsMm));
    expect(screen.getByRole("heading", { name: "How LP 5 is built." })).toBeInTheDocument();
    expect(screen.getByRole("img").getAttribute("src")).toBe(`https://crm.sunlitesigns.com/edgeluxe/lp5/drawing?format=svg&depth=${first}&view=1`);
    expect(screen.getByRole("link", { name: "LP 5 section drawing as DXF (CAD)" }).getAttribute("href")).toBe(`https://crm.sunlitesigns.com/edgeluxe/lp5/drawing?format=dxf&depth=${first}`);
    expect(screen.getByRole("link", { name: "LP 5 exploded view as PDF" }).getAttribute("href")).toBe(`https://crm.sunlitesigns.com/edgeluxe/lp5/drawing?format=pdf&depth=${first}&drawing=exploded`);
    // Another depth changes every address.
    const other = lp5.depthOptionsMm.find((d) => d !== first)!;
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${other} mm`) }));
    expect(screen.getByRole("link", { name: "LP 5 section drawing as DXF (CAD)" }).getAttribute("href")).toContain(`depth=${other}`);
  });

  it("loads the 3D view only when asked for", () => {
    const { container } = render(<ProductConstruction config={lp11b} />);
    expect(container.querySelector("iframe")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Open the 3D exploded view/ }));
    expect(container.querySelector("iframe")!.getAttribute("src")).toMatch(/^https:\/\/crm\.sunlitesigns\.com\/edgeluxe\/lp11-b\/embed/);
  });

  it("lists a family's products with their 3D view and files", () => {
    const family = configurations.filter((c) => c.family === "Block acrylic");
    render(<ConstructionList configs={family} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(family.length);
    expect(screen.getAllByRole("button", { name: /Exploded view/ })).toHaveLength(family.length);
    expect(screen.getByRole("link", { name: "LP 11-FS exploded view as PDF" }).getAttribute("href")).toBe("https://crm.sunlitesigns.com/edgeluxe/lp11-fs/drawing?format=pdf&drawing=exploded");
  });
});
