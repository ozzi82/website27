import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ProductMedia from "../ProductMedia";
import { configurations } from "../../data/configurations";

const lp11b = configurations.find((c) => c.code === "LP 11-B")!;

describe("product page: picture area with tabs", () => {
  it("starts on the photo and loads the 3D view only when its tab is opened: exploded, still, in the site's colours", () => {
    const { container } = render(<ProductMedia config={lp11b} />);
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector("img")).not.toBeNull();
    fireEvent.click(screen.getByRole("radio", { name: "Exploded 3D" }));
    const src = container.querySelector("iframe")!.getAttribute("src")!;
    expect(src).toMatch(/^https:\/\/crm\.sunlitesigns\.com\/edgeluxe\/lp11-b\/embed\?theme=site&explode=100&play=0&depth=\d+$/);
  });

  it("shows the section drawing and offers the files at the chosen depth", () => {
    render(<ProductMedia config={lp11b} />);
    fireEvent.click(screen.getByRole("radio", { name: "Section" }));
    expect(screen.getByRole("img").getAttribute("src")).toContain("/edgeluxe/lp11-b/drawing?format=svg&depth=");
    const other = lp11b.depthOptionsMm[0];
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${other} mm`) }));
    expect(screen.getByRole("link", { name: "LP 11-B section drawing as DXF (CAD)" }).getAttribute("href")).toBe(`https://crm.sunlitesigns.com/edgeluxe/lp11-b/drawing?format=dxf&depth=${other}`);
    expect(screen.getByRole("link", { name: "LP 11-B exploded view as PDF" }).getAttribute("href")).toBe(`https://crm.sunlitesigns.com/edgeluxe/lp11-b/drawing?format=pdf&depth=${other}&drawing=exploded`);
    expect(screen.getByRole("img").getAttribute("src")).toContain(`depth=${other}`);
  });
});
