import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { beforeEach, describe, expect, it } from "vitest";
import HomePage from "../HomePage";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { CTA_PRIMARY } from "../../lib/cta";
import { CUSTOM_ONLY_TERMS, spacedText, textOutsideCustomFabrication, trimClaimViolations } from "./helpers/renderPage";

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
    expect(screen.getByText(/ultra-slim cast acrylic letters and classic trimless channel letters, manufactured to your drawings — UL 48 listed, ready to install and shipped nationwide/i)).toBeInTheDocument();
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

  it("product section has the four owner categories, ultra-slim first and largest, with cabinet and blade signs only in the custom card", () => {
    renderHome();
    const section = document.getElementById("products")!;
    expect(within(section).getByRole("heading", { level: 2, name: "Built for the jobs your shop wins." })).toBeInTheDocument();
    expect(within(section).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Ultra-Slim Letters",
      "Classic Trimless Letters",
      "Non-Illuminated Flat Cutout Letters",
      "Custom Sign Fabrication",
    ]);
    expect(within(section).getByRole("link", { name: /explore ultra-slim/i })).toHaveAttribute("href", "/services/ultra-slim-trimless-channel-letters");
    expect(within(section).getByRole("link", { name: /view classic letters/i })).toHaveAttribute("href", "/services/channel-letters");
    expect(within(section).getByRole("link", { name: /view flat cutouts/i })).toHaveAttribute("href", "/light-effects/lp-1-flat-cutout");
    expect(within(section).getByRole("link", { name: /see custom fabrication/i })).toHaveAttribute("href", "/services/custom-sign-fabrication");
    // the featured card is the first one and carries the signature label
    const cards = [...section.querySelectorAll("article[data-product]")];
    expect(cards.map((c) => c.getAttribute("data-product"))).toEqual(["ultra-slim", "classic-trimless", "flat-cutout", "custom-fabrication"]);
    expect(cards[0].className).toContain("lg:col-span-7");
    expect(cards[0].textContent).toMatch(/signature product/i);
    expect(cards[0].textContent).toMatch(/LP 11/);
    expect(textOutsideCustomFabrication(section)).not.toMatch(CUSTOM_ONLY_TERMS);
    expect(cards[3].textContent).toMatch(/blade signs/i);
    expect(trimClaimViolations(spacedText(section))).toEqual([]);
    expect(section.textContent).not.toMatch(/trimmed/i);
  });

  it("ultra-slim section represents the LP 11 series: depth drawing, eight variants with real renders, links to the page and the configurator", () => {
    renderHome();
    const section = document.getElementById("ultra-slim")!;
    expect(within(section).getByRole("img", { name: /conventional trim-cap channel letter.*versus Sunlite Ultra-Slim LP 11/i })).toBeInTheDocument();
    for (const a of ["25–30 mm depth", "Cast block acrylic", "Eight lighting variants"]) expect(section.textContent).toContain(a);
    expect(section.textContent).toMatch(/cast block acrylic letters with embedded LEDs, epoxy-sealed to IP67/i);
    const variants = [...section.querySelectorAll('a[href^="/light-effects/lp-11-"]')];
    expect(variants).toHaveLength(8);
    expect(variants.map((a) => spacedText(a).trim())).toEqual([
      "F Face-lit",
      "B Halo",
      "FB Face + halo",
      "BS Back side",
      "FS Face + front side",
      "S Full side",
      "N Faux neon",
      "C Conical",
    ]);
    for (const a of variants) expect(a.querySelector("img")!.getAttribute("src")).toMatch(/^\/images\/edgeluxe\/lp-11-/);
    expect(within(section).getByRole("link", { name: /explore ultra-slim/i })).toHaveAttribute("href", "/services/ultra-slim-trimless-channel-letters");
    expect(within(section).getByRole("link", { name: /build your sign/i })).toHaveAttribute("href", "/configurator?config=lp-11-f-face-lit");
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
      ["Ultra-Slim Letters (LP 11)", "/services/ultra-slim-trimless-channel-letters"],
      ["Classic Trimless Letters", "/services/channel-letters"],
      ["Flat Cutout Letters (LP 1)", "/light-effects/lp-1-flat-cutout"],
      ["Custom Fabrication", "/services/custom-sign-fabrication"],
      ["All 12 letter systems", "/#light-effects"],
      ["Projects", "/projects"],
      ["Manufacturing", "/manufacturing"],
      ["About", "/about"],
      ["Build Your Sign", "/configurator"],
    ] as const) {
      expect(within(nav).getByRole("link", { name })).toHaveAttribute("href", href);
    }
    expect(within(nav).queryByText(/cabinet|blade|cast acrylic/i)).toBeNull();
  });

  it("footer gives no street address or Tampa location (it is only a mailbox)", () => {
    renderHome();
    const footer = screen.getByRole("contentinfo");
    expect(footer.textContent).toContain("Sunlite Signs LLC");
    expect(footer.textContent).not.toMatch(/tampa|laurel|33607/i);
    expect(footer.textContent).toContain("Wholesale manufacturing partner for sign companies nationwide.");
      });
});

describe("owner final touches (2026-10)", () => {
  it("shows German engineered and UL 48 in the capability strip, with 24 to 48 hour quotes", () => {
    renderHome();
    const strip = screen.getByRole("region", { name: "Capabilities" });
    expect(strip.textContent).toMatch(/German engineered/i);
    expect(strip.textContent).toMatch(/UL 48 Listed/);
    expect(strip.textContent).toMatch(/24–48 H/);
  });

  it("has no Tampa address anywhere on the home page", () => {
    renderHome();
    expect(document.body.textContent).not.toMatch(/5005 W Laurel|Tampa, F/i);
  });
});

describe("product cards and detail pages", () => {
  it("opens the detail page from the picture of a system card, and each detail page has Build in 3D beside the quote button", async () => {
    const { renderAt } = await import("./helpers/renderPage");
    const { main } = renderAt("/services/ultra-slim-trimless-channel-letters");
    const card = main.querySelector('[data-system="LP 11-FS"]') as HTMLElement;
    const pictureLink = card.querySelector("img")!.closest("a")!;
    expect(pictureLink.getAttribute("href")).toBe("/light-effects/lp-11-fs-front-side-lit");

    const detail = renderAt("/light-effects/lp-5-trimless-face-lit");
    const build = detail.main.querySelector('a[href="/configurator?config=lp-5-trimless-face-lit"]');
    expect(build?.textContent).toMatch(/build in 3d/i);
    const quote = [...detail.main.querySelectorAll('a[href="/contact"]')].find((a) => /request wholesale pricing/i.test(a.textContent ?? ""));
    expect(quote).toBeTruthy();
  });
});

describe("UL mark", () => {
  it("shows the owner's UL mark beside UL 48 Listed in the capability strip and in the footer", () => {
    renderHome();
    const strip = screen.getByRole("region", { name: "Capabilities" });
    expect(strip.querySelector('img[src="/images/ul-mark.svg"]')).not.toBeNull();
    expect(screen.getByRole("contentinfo").querySelector('img[src="/images/ul-mark.svg"]')).not.toBeNull();
  });
});

describe("UL mark placements", () => {
  it("also appears on the home proof section and system grid, the product pages, a system page and the contact page", async () => {
    const { renderAt } = await import("./helpers/renderPage");
    const marks = (el: Element) => el.querySelectorAll('img[src="/images/ul-mark.svg"]').length;
    renderHome();
    expect(marks(document.getElementById("trusted")!)).toBe(1);
    expect(marks(document.getElementById("light-effects")!)).toBe(1);
    for (const path of ["/services/ultra-slim-trimless-channel-letters", "/services/channel-letters", "/light-effects/lp-5-trimless-face-lit", "/contact"]) {
      const { main } = renderAt(path);
      expect(marks(main), path).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("new project photos", () => {
  it("lists Quarrix and Piada on the projects data", async () => {
    const { projects } = await import("../../data/projects");
    expect(projects.map((p) => p.id)).toEqual(expect.arrayContaining(["quarrix", "piada"]));
  });
});
