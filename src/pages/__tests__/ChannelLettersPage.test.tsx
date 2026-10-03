import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FORBIDDEN, internalHrefs, mmClaims, renderAt, spacedText, validRoutes } from "./helpers/renderPage";
import { CTA_PRIMARY, RETIRED_CTA_LABELS } from "../../lib/cta";
import { channelLetterFaqs, channelLetterSpecs } from "../../data/channelLetters";
import { SITE_URL } from "../../lib/seo";

const PATH = "/services/channel-letters";

describe("/services/channel-letters", () => {
  it("routes to the dedicated page (not the generic service page) with the brief's two-line H1", () => {
    const { main } = renderAt(PATH);
    const h1s = within(main).getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toBe("Wholesale Channel Lettersfor Sign Companies.");
    expect(h1s[0].querySelector("br")).not.toBeNull();
    expect(main.textContent).toContain("UL 48 listed channel letters fabricated to your drawings and shipped ready to install nationwide.");
    expect(main.textContent).toMatch(/trade-only wholesale manufacturer/i);
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
    expect(crumbs).toEqual(["Home", "Products", "Channel Letters"]);
  });

  it("shows the primary CTA from the shared module in the hero, before any section", () => {
    const { main } = renderAt(PATH);
    const hero = main.querySelector("section")!;
    const cta = within(hero).getByRole("link", { name: new RegExp(CTA_PRIMARY.label, "i") });
    expect(cta).toHaveAttribute("href", CTA_PRIMARY.to);
    expect(within(hero).getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("has every section the brief lists, in order", () => {
    const { main } = renderAt(PATH);
    const ids = [...main.querySelectorAll("section[id]")].map((s) => s.id);
    const order = ["illumination", "trim", "mounting", "finish", "custom-fabrication", "specifications", "process", "projects", "faq", "request-pricing"];
    expect(ids.filter((id) => order.includes(id))).toEqual(order);
    const text = main.textContent!;
    for (const t of ["Front lit", "Reverse / halo lit", "Front + back lit", "Trimmed", "Trimless", "Mounting options", "Lighting options", "Color / finish options", "Technical specifications", "Reference projects"]) {
      expect(text).toContain(t);
    }
  });

  it("has a concept diagram per lighting type, trim option and mounting option", () => {
    const { container } = renderAt(PATH);
    const kinds = [...container.querySelectorAll("[data-diagram]")].map((d) => d.getAttribute("data-diagram"));
    expect(kinds).toEqual([
      "lighting-front",
      "lighting-halo",
      "lighting-front-back",
      "trim-trimmed",
      "trim-trimless",
      "mounting-flush",
      "mounting-standoff",
      "mounting-raceway",
      "mounting-remote",
    ]);
    for (const svg of container.querySelectorAll("[data-diagram]")) {
      expect(svg.getAttribute("role")).toBe("img");
      expect(svg.getAttribute("aria-label")).toMatch(/section diagram/i);
      expect(svg.getAttribute("width")).toBeNull();
    }
  });

  it("links to the ultra-slim page and every internal link resolves to a real route or an on-page anchor", () => {
    const { main, container } = renderAt(PATH);
    expect(within(main).getAllByRole("link", { name: /ultra-slim/i }).some((a) => a.getAttribute("href") === "/services/ultra-slim-trimless-channel-letters")).toBe(true);
    for (const href of internalHrefs(container)) {
      const [route, hash] = href.split("#");
      expect(validRoutes.has(route === "" ? "/" : route.split("?")[0]), href).toBe(true);
      if (hash && (route === PATH || route === "")) expect(container.querySelector(`#${hash}`), `#${hash}`).not.toBeNull();
    }
  });

  it("only states numbers that the brief or the site supplies, and nothing about cabinets or light boxes", () => {
    const { main } = renderAt(PATH);
    const text = main.textContent!;
    expect(new Set(mmClaims(spacedText(main)))).toEqual(new Set(["25–30 mm"]));
    for (const f of FORBIDDEN) expect(text).not.toMatch(f);
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
    expect(main.querySelector("#specifications")!.textContent).toContain("48 hours");
  });

  it("shows no category claim on reference projects while none is tagged for channel letters", () => {
    const { main } = renderAt(PATH);
    const refs = main.querySelector("#projects")!;
    expect(refs.querySelectorAll("article").length).toBeGreaterThanOrEqual(3);
    expect(refs.textContent).toContain("Recent production.");
    expect(refs.querySelector("dl")).toBeNull();
    screen.getAllByRole("link", { name: /view all projects/i }).forEach((a) => expect(a).toHaveAttribute("href", "/projects"));
  });
});
