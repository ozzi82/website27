import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { beforeEach, describe, expect, it } from "vitest";
import HomePage from "../../pages/HomePage";
import TrustBadgeSection, { TRUST_BADGE } from "../home/TrustBadgeSection";
import { CTA_PRIMARY } from "../../lib/cta";

beforeEach(() => {
  window.scrollTo = () => undefined;
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});

function renderSection() {
  return render(
    <MemoryRouter>
      <TrustBadgeSection />
    </MemoryRouter>,
  );
}

describe("TrustBadgeSection", () => {
  it("shows the badge image unaltered with the exact descriptive alt text, dimensions and lazy loading", () => {
    renderSection();
    const img = screen.getByRole("img", { name: TRUST_BADGE.alt });
    expect(TRUST_BADGE.alt).toBe(
      "Trusted by sign companies: 10,000+ channel letters produced, clients across North America, quotes in 24 to 48 hours, German Engineered, UL 48 listed, 3 to 4 week typical delivery, trade only",
    );
    expect(img).toHaveAttribute("src", "/images/trust-badge-clear.webp");
    expect(img).toHaveAttribute("width", String(TRUST_BADGE.width));
    expect(img).toHaveAttribute("height", String(TRUST_BADGE.height));
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img.getAttribute("srcset")).toContain("640w");
  });

  it("carries the key facts as real HTML text, not only inside the graphic", () => {
    const { container } = renderSection();
    const text = container.textContent ?? "";
    expect(text).toMatch(/proven production partner/i);
    expect(text).toMatch(/wholesale manufacturer/i);
    expect(text).toMatch(/UL 48 listed/i);
    expect(text).toMatch(/German-engineered/i);
    expect(text).toMatch(/North America/i);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Built for sign companies.Trusted by sign companies.");
  });

  it("uses the shared primary call to action", () => {
    renderSection();
    const link = screen.getByRole("link", { name: new RegExp(CTA_PRIMARY.label, "i") });
    expect(link).toHaveAttribute("href", CTA_PRIMARY.to);
  });

  it("sits between the products section and the ultra-slim section on the homepage", () => {
    const { container } = render(
      <HelmetProvider>
        <MemoryRouter initialEntries={["/"]}>
          <HomePage />
        </MemoryRouter>
      </HelmetProvider>,
    );
    const ids = Array.from(container.querySelectorAll("section[id]")).map((s) => s.id);
    const products = ids.indexOf("products");
    const trusted = ids.indexOf("trusted");
    const ultra = ids.indexOf("ultra-slim");
    expect(products).toBeGreaterThan(-1);
    expect(trusted).toBe(products + 1);
    expect(ultra).toBe(trusted + 1);
  });
});
