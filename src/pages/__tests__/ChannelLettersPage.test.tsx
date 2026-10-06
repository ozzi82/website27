import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FORBIDDEN, CUSTOM_ONLY_TERMS, internalHrefs, mmClaims, renderAt, spacedText, textOutsideCustomFabrication, trimClaimViolations, validRoutes } from "./helpers/renderPage";
import { CTA_PRIMARY, RETIRED_CTA_LABELS } from "../../lib/cta";
import { channelLetterFaqs, channelLetterSpecs, classicSystems } from "../../data/channelLetters";
import { SITE_URL } from "../../lib/seo";

const PATH = "/services/channel-letters";

describe("/services/channel-letters (classic trimless letters)", () => {
  it("routes to the dedicated page with the owner's two-line H1 and UL 48 intro", () => {
    const { main } = renderAt(PATH);
    const h1s = within(main).getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toBe("Wholesale Channel Lettersfor Sign Companies.");
    expect(h1s[0].querySelector("br")).not.toBeNull();
    expect(main.textContent).toContain("UL 48 listed channel letters fabricated to your drawings and shipped ready to install nationwide.");
    expect(main.textContent).toMatch(/trade-only wholesale manufacturer/i);
    expect(main.textContent).toMatch(/classic channel letters are trimless fabricated stainless steel/i);
  });

  it("sets the exact SEO title, a natural description, canonical and JSON-LD (Service, BreadcrumbList, FAQPage)", async () => {
    renderAt(PATH);
    await waitFor(() => expect(document.title).toBe("Wholesale Channel Letter Manufacturer | Sunlite Signs"));
    const desc = document.head.querySelector('meta[name="description"]')!.getAttribute("content")!;
    expect(desc).toMatch(/wholesale channel letter manufacturer/i);
    expect(desc.length).toBeLessThanOrEqual(180);
    expect(document.head.querySelector('link[rel="canonical"]')!.getAttribute("href")).toBe(`${SITE_URL}/services/channel-letters`);
    const ld = [...document.head.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent!));
    expect(ld.map((x) => x["@type"]).sort()).toEqual(["BreadcrumbList", "FAQPage", "Service"]);
    const faq = ld.find((x) => x["@type"] === "FAQPage");
    expect(faq.mainEntity).toHaveLength(channelLetterFaqs.length);
    const service = ld.find((x) => x["@type"] === "Service");
    expect(JSON.stringify(service)).not.toMatch(/rating|review|price|offers/i);
    const crumbs = ld.find((x) => x["@type"] === "BreadcrumbList").itemListElement.map((i: { name: string }) => i.name);
    expect(crumbs).toEqual(["Home", "Products", "Classic Trimless Letters"]);
  });

  it("shows the primary CTA from the shared module in the hero, before any section", () => {
    const { main } = renderAt(PATH);
    const hero = main.querySelector("section")!;
    const cta = within(hero).getByRole("link", { name: new RegExp(CTA_PRIMARY.label, "i") });
    expect(cta).toHaveAttribute("href", CTA_PRIMARY.to);
    expect(within(hero).getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("has the sections in order: signature ultra-slim, systems, illumination, no trim caps, construction, mounting, finish, custom pointer, specs, process, projects, FAQ", () => {
    const { main } = renderAt(PATH);
    const ids = [...main.querySelectorAll("section[id]")].map((s) => s.id);
    const order = ["signature", "systems", "illumination", "trim-caps", "construction", "mounting", "finish", "custom-fabrication", "specifications", "process", "projects", "faq", "request-pricing"];
    expect(ids.filter((id) => order.includes(id))).toEqual(order);
    const text = main.textContent!;
    for (const t of ["Face lit", "Halo lit", "Mounting options", "Lighting options", "Color / finish options", "Technical specifications", "Reference projects"]) {
      expect(text).toContain(t);
    }
  });

  it("presents exactly the three classic systems (LP 5, LP 3.1, LP 3.2) with brochure depths, and links each page and the configurator", () => {
    const { main } = renderAt(PATH);
    const cards = [...main.querySelectorAll("#systems [data-system]")];
    expect(cards.map((c) => c.getAttribute("data-system"))).toEqual(["LP 5", "LP 3.1", "LP 3.2"]);
    for (const s of classicSystems) {
      const card = main.querySelector(`#systems [data-system="${s.code}"]`) as HTMLElement;
      expect(within(card).getByRole("link", { name: /view system/i })).toHaveAttribute("href", s.page);
      expect(within(card).getByRole("link", { name: /preview in 3d/i })).toHaveAttribute("href", s.configurator);
      expect(card.textContent).toContain("30, 50, 75 or 100 mm, or custom");
    }
  });

  it("positions ultra-slim LP 11 prominently as the signature option and links the ultra-slim page", () => {
    const { main } = renderAt(PATH);
    const signature = main.querySelector("#signature") as HTMLElement;
    expect(signature.textContent).toMatch(/signature option/i);
    expect(signature.textContent).toMatch(/LP 11/);
    expect(within(signature).getByRole("link", { name: /explore ultra-slim/i })).toHaveAttribute("href", "/services/ultra-slim-trimless-channel-letters");
    // it comes before the first classic system
    expect(main.querySelector("#signature")!.compareDocumentPosition(main.querySelector("#systems")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("has a concept diagram per lighting type, the trim-cap comparison and the two mountings (no raceway or remote)", () => {
    const { container } = renderAt(PATH);
    const kinds = [...container.querySelectorAll("[data-diagram]")].map((d) => d.getAttribute("data-diagram"));
    expect(kinds).toEqual(["lighting-front", "lighting-halo", "trim-trimmed", "trim-trimless", "mounting-standoff", "mounting-flush"]);
    for (const svg of container.querySelectorAll("[data-diagram]")) {
      expect(svg.getAttribute("role")).toBe("img");
      expect(svg.getAttribute("aria-label")).toMatch(/section diagram/i);
      expect(svg.getAttribute("width")).toBeNull();
    }
  });

  it('"Why we don\'t use trim caps" labels the trim-cap letter as conventional and not offered, next to Sunlite\'s trimless construction', () => {
    const { main } = renderAt(PATH);
    const section = main.querySelector("#trim-caps") as HTMLElement;
    expect(within(section).getByRole("heading", { level: 2 }).textContent).toBe("Why we don't use trim caps.");
    const cards = within(section).getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(cards.slice(0, 2)).toEqual(["Conventional trim-cap letter", "Sunlite trimless letter"]);
    expect(section.textContent).toContain("Not offered");
    expect(section.textContent).toContain("What we build");
    expect(section.textContent).toMatch(/does not build that letter/i);
    expect(section.textContent).toMatch(/shown for comparison only/i);
    // the benefits are qualitative: no figures at all in this section
    expect(section.textContent).not.toMatch(/\d\s?(mm|in|%)/i);
  });

  it("never offers trim-capped letters: trim caps are named only in the comparison section and in negations", () => {
    const { main } = renderAt(PATH);
    const clone = main.cloneNode(true) as HTMLElement;
    clone.querySelector("#trim-caps")!.remove();
    expect(trimClaimViolations(spacedText(clone))).toEqual([]);
    // no "trimmed" letter, raceway or remote-mount claim anywhere
    expect(main.textContent).not.toMatch(/trimmed|raceway|remote mount|remote-mount|front \+ back/i);
  });

  it("links to the ultra-slim page and custom fabrication, and every internal link resolves to a real route or an on-page anchor", () => {
    const { main, container } = renderAt(PATH);
    const hrefs = internalHrefs(main);
    expect(hrefs).toContain("/services/ultra-slim-trimless-channel-letters");
    expect(hrefs).toContain("/services/custom-sign-fabrication");
    for (const href of internalHrefs(container)) {
      const [route, hash] = href.split("#");
      expect(validRoutes.has(route === "" ? "/" : route.split("?")[0]), href).toBe(true);
      if (hash && (route === PATH || route === "")) expect(container.querySelector(`#${hash}`), `#${hash}`).not.toBeNull();
    }
  });

  it("only states numbers the brochure or the site supplies, and cabinet or blade signs appear only in the custom pointer", () => {
    const { main } = renderAt(PATH);
    const text = main.textContent!;
    const allowed = new Set(["10–30 mm", "30 mm", "25 mm", "50 mm", "75 mm", "100 mm", "10 mm", "15 mm", "25 mm"]);
    for (const m of mmClaims(spacedText(main))) expect(allowed.has(m), m).toBe(true);
    for (const f of FORBIDDEN) expect(text).not.toMatch(f);
    expect(textOutsideCustomFabrication(main)).not.toMatch(CUSTOM_ONLY_TERMS);
    for (const r of RETIRED_CTA_LABELS) expect(text).not.toContain(r);
  });

  it("FAQ answers are on the page and the spec sheet covers the supported facts", () => {
    const { main } = renderAt(PATH);
    const faq = main.querySelector("#faq")!;
    for (const f of channelLetterFaqs) expect(within(faq as HTMLElement).getByText(f.q)).toBeInTheDocument();
    const specText = channelLetterSpecs.map((s) => s.value).join(" ");
    expect(specText).toContain("UL 48 listed");
    expect(specText).toContain("3–4 weeks");
    expect(specText).toContain("3 years");
    expect(specText).toContain("Trimless: no trim cap");
    expect(main.querySelector("#specifications")!.textContent).toContain("48 hours");
  });

  it("states the classic construction from the brochure: stainless steel, not aluminum", () => {
    const { main } = renderAt(PATH);
    expect(main.querySelector("#construction")!.textContent).toMatch(/stainless steel/i);
    expect(main.textContent).not.toMatch(/aluminum|aluminium/i);
  });

  it("shows the owner's system on each reference project and links it to the system page, with no other category claim", () => {
    const { main } = renderAt(PATH);
    const refs = main.querySelector("#projects")!;
    expect(refs.querySelectorAll("article").length).toBeGreaterThanOrEqual(3);
    expect(refs.textContent).toContain("Recent production.");
    for (const article of refs.querySelectorAll("article[data-project]")) {
      const links = [...article.querySelectorAll("a")].map((a) => a.getAttribute("href"));
      for (const href of links) expect(href, article.getAttribute("data-project")!).toMatch(/^\/light-effects\//);
    }
    screen.getAllByRole("link", { name: /view all projects/i }).forEach((a) => expect(a).toHaveAttribute("href", "/projects"));
  });
});
