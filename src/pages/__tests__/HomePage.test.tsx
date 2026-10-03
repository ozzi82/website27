import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { beforeEach, describe, expect, it } from "vitest";
import HomePage from "../HomePage";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { CTA_PRIMARY } from "../../lib/cta";

function renderHome() {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/"]}>
        <Header />
        <HomePage />
        <Footer />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

beforeEach(() => {
  window.scrollTo = () => undefined;
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});

describe("HomePage", () => {
  it("has a single H1 with the wholesale channel-letter message and a visible line break", () => {
    const { container } = renderHome();
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toBe("Wholesale Channel Letters.Built for Sign Companies.");
    expect(h1s[0].querySelector("br")).not.toBeNull();
    expect(container.textContent).toMatch(/wholesale sign manufacturer · trade only/i);
  });

  it("hero body keeps the UL 48, drawings and nationwide wording and offers both CTAs", () => {
    renderHome();
    expect(screen.getByText(/manufactured to your drawings — UL 48 listed, ready to install and shipped nationwide/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /explore products/i })[0]).toHaveAttribute("href", "/#products");
  });

  it("every primary CTA says the same thing and goes to the quote page (header, hero and sections)", () => {
    renderHome();
    const ctas = screen.getAllByRole("link", { name: new RegExp(CTA_PRIMARY.label, "i") });
    // header desktop + mobile menu closed: header(1), hero, manufacturing, projects, trade statement, final CTA, footer link
    expect(ctas.length).toBeGreaterThanOrEqual(6);
    for (const c of ctas) expect(c).toHaveAttribute("href", "/contact");
  });

  it("does not use retired CTA wording anywhere on the page", () => {
    const { container } = renderHome();
    for (const retired of ["Get a Quote", "Start Your Project", "Request a Quote", "Get in Touch", "Send Your Drawings"]) {
      expect(container.textContent).not.toContain(retired);
    }
  });

  it("renders the sections in the brief's order", () => {
    const { container } = renderHome();
    const ids = [...container.querySelectorAll("main, section[id]")].map((s) => s.id).filter(Boolean);
    const order = ["products", "ultra-slim", "trade", "manufacturing", "projects", "light-effects", "process", "trade-only", "faq", "request-pricing"];
    expect(ids.filter((id) => order.includes(id))).toEqual(order);
  });

  it("trust strip only uses claims that already exist on the site", () => {
    renderHome();
    const strip = screen.getByRole("region", { name: "Capabilities" });
    const text = strip.textContent!;
    for (const claim of ["UL 48 Listed", "48 H", "3–4 WK", "3 YR", "Trade only"]) expect(text).toContain(claim);
    expect(text).not.toMatch(/\d+\s?\+|%|years in business|projects/i);
    expect(within(strip).getByText("Your customer stays your customer.")).toBeInTheDocument();
  });

  it("why-Sunlite section: five short benefits under the brief's headline", () => {
    renderHome();
    const section = document.getElementById("trade")!;
    expect(within(section).getByRole("heading", { level: 2 }).textContent).toContain("More capacity.");
    expect(section.textContent).toContain("Without more overhead.");
    expect(section.textContent).toMatch(/built for the trade/i);
    expect(within(section).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Win more jobs",
      "Keep your crew installing",
      "Handle overflow",
      "Add specialty capability",
      "Your customer stays yours",
    ]);
    // nothing the site does not already say: no "test", no numbers
    expect(section.textContent!.toLowerCase()).not.toMatch(/\btest(ed|ing)?\b/);
    expect(section.textContent).not.toMatch(/\d\s?(%|\+|mm|weeks?|years?)/i);
    expect(section.textContent).toContain("pre-wire");
  });

  it("product section has the four categories with the brief's CTA labels and no cabinet signs", () => {
    renderHome();
    const section = document.getElementById("products")!;
    expect(within(section).getByRole("heading", { level: 2, name: "Built for the jobs your shop wins." })).toBeInTheDocument();
    expect(within(section).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Standard Channel Letters",
      "Ultra-Slim Trimless",
      "Cast Acrylic Letters",
      "Custom Sign Fabrication",
    ]);
    expect(within(section).getByRole("link", { name: /view channel letters/i })).toHaveAttribute("href", "/services/channel-letters");
    expect(within(section).getByRole("link", { name: /explore ultra-slim/i })).toHaveAttribute("href", "/services/ultra-slim-trimless-channel-letters");
    expect(section.textContent!.toLowerCase()).not.toMatch(/cabinet|light ?box/);
  });

  it("ultra-slim section shows the 25-30 mm story as a specialized option, with the depth drawing", () => {
    renderHome();
    const section = document.getElementById("ultra-slim")!;
    expect(within(section).getByRole("img", { name: /conventional channel letter versus sunlite ultra-slim/i })).toBeInTheDocument();
    expect(section.textContent).toMatch(/specialized option, not the standard depth/i);
    for (const a of ["25–30 mm depth", "Trimless construction", "Face / halo / dual lit"]) expect(section.textContent).toContain(a);
  });

  it("manufacturing section lists the six stages and process has six steps", () => {
    renderHome();
    const mfg = document.getElementById("manufacturing")!;
    expect(within(mfg).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "CNC Fabrication",
      "LED & Electrical",
      "Hand Assembly",
      "Quality Control",
      "Packaging",
      "Ready for Freight",
    ]);
    expect(within(document.getElementById("process")!).getAllByRole("heading", { level: 3 })).toHaveLength(6);
  });

  it("keeps the EdgeLuxe grid and the configurator link", () => {
    renderHome();
    const section = document.getElementById("light-effects")!;
    expect(within(section).getAllByRole("link", { name: /EdgeLuxe LP/i }).length).toBeGreaterThanOrEqual(12);
    expect(within(section).getByRole("link", { name: /build your sign/i })).toHaveAttribute("href", "/configurator");
  });
});

describe("Header and footer", () => {
  it("header nav has Products (with the four categories), Projects, Manufacturing, About as real links", () => {
    renderHome();
    const nav = screen.getByRole("navigation", { name: "Main" });
    for (const [name, href] of [
      ["Channel Letters", "/services/channel-letters"],
      ["Ultra-Slim Trimless", "/services/ultra-slim-trimless-channel-letters"],
      ["Cast Acrylic", "/services/cast-block-acrylic"],
      ["Custom Fabrication", "/services/channel-letters#custom-fabrication"],
      ["Projects", "/projects"],
      ["Manufacturing", "/manufacturing"],
      ["About", "/about"],
      ["Build Your Sign", "/configurator"],
    ] as const) {
      expect(within(nav).getByRole("link", { name })).toHaveAttribute("href", href);
    }
    expect(within(nav).queryByText(/cabinet/i)).toBeNull();
  });

  it("footer states the location without claiming Tampa production", () => {
    renderHome();
    const footer = screen.getByRole("contentinfo");
    expect(footer.textContent).toContain("Sunlite Signs LLC · Tampa, Florida");
    expect(footer.textContent).toContain("Wholesale manufacturing partner for sign companies nationwide.");
    expect(footer.textContent).not.toMatch(/manufactured in tampa|made in tampa|built in tampa/i);
  });
});
