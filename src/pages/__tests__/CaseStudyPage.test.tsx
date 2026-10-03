import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { describe, expect, it } from "vitest";
import { CaseStudyView } from "../CaseStudyPage";
import ProjectCard from "../../components/ProjectCard";
import { caseStudies, caseStudyForProject, caseStudyPath, caseStudySpecRows, caseStudyToProject, findCaseStudy } from "../../data/caseStudies";
import { projects } from "../../data/projects";
import { fixtureStudy, minimalStudy } from "../../data/__tests__/fixtures/caseStudyFixture";
import { renderAt } from "./helpers/renderPage";
import { SITE_URL } from "../../lib/seo";

const renderView = (study = fixtureStudy) => {
  window.scrollTo = () => undefined;
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <CaseStudyView study={study} />
      </MemoryRouter>
    </HelmetProvider>,
  );
};

describe("case-study data (template ships empty)", () => {
  it("has no real entries yet: nothing fake ships", () => {
    expect(caseStudies).toEqual([]);
  });

  it("looks entries up by slug and by the project card they expand", () => {
    expect(findCaseStudy("fixture-trimless-storefront", [fixtureStudy])).toBe(fixtureStudy);
    expect(findCaseStudy("nope", [fixtureStudy])).toBeUndefined();
    expect(findCaseStudy(undefined, [fixtureStudy])).toBeUndefined();
    expect(caseStudyForProject("mustang", [fixtureStudy])).toBe(fixtureStudy);
    expect(caseStudyForProject("tradebyte", [fixtureStudy])).toBeUndefined();
    expect(caseStudyPath("a-b")).toBe("/projects/a-b");
  });

  it("builds spec rows from the known fields only, in order, trimming blanks", () => {
    expect(caseStudySpecRows(fixtureStudy).map((r) => r.label)).toEqual([
      "Customer",
      "Product",
      "Application",
      "Depth",
      "Illumination",
      "Materials",
      "Finish",
      "Mounting",
      "Letter height",
    ]);
    expect(caseStudySpecRows(minimalStudy)).toEqual([]);
  });

  it("turns a case study into a reference card without inventing metadata", () => {
    const card = caseStudyToProject(minimalStudy);
    expect(card.title).toBe(minimalStudy.title);
    expect(card.image).toBe(minimalStudy.image.src);
    expect(card.depth).toBeUndefined();
    expect(card.productType).toBeUndefined();
  });
});

describe("CaseStudyView with a fixture entry", () => {
  it("renders H1, summary, day and night images and the primary CTA", () => {
    renderView();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(fixtureStudy.title);
    expect(screen.getAllByText(fixtureStudy.summary).length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: "Fixture day photo" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Fixture night photo" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /request wholesale pricing/i })[0]).toHaveAttribute("href", "/contact");
  });

  it("shows Challenge, Specification, Production, Result and Technical specs in that order", () => {
    const { container } = renderView();
    const ids = [...container.querySelectorAll("section[id]")].map((s) => s.id).filter((id) => ["challenge", "specification", "production", "result", "technical-specs"].includes(id));
    expect(ids).toEqual(["challenge", "specification", "production", "result", "technical-specs"]);
    expect(screen.getByRole("heading", { level: 2, name: "Challenge" })).toBeInTheDocument();
    expect(screen.getByText("Fixture challenge paragraph two.")).toBeInTheDocument();
    const specs = within(container.querySelector("#technical-specs") as HTMLElement);
    expect(specs.getByText("28 mm fixture depth")).toBeInTheDocument();
    expect(specs.getByText("Fixture height")).toBeInTheDocument();
    expect(specs.queryByText("Empty row")).toBeNull();
    expect(container.querySelector("#gallery")).not.toBeNull();
  });

  it("links back to the product page, projects and manufacturing", () => {
    renderView();
    const related = within(screen.getByRole("region", { name: "Related pages" }));
    expect(related.getByRole("link", { name: /ultra-slim letters/i })).toHaveAttribute("href", "/services/ultra-slim-trimless-channel-letters");
    expect(related.getByRole("link", { name: /all projects/i })).toHaveAttribute("href", "/projects");
    expect(related.getByRole("link", { name: /manufacturing/i })).toHaveAttribute("href", "/manufacturing");
  });

  it("sets title, description, canonical and Article + BreadcrumbList JSON-LD", async () => {
    renderView();
    await waitFor(() => expect(document.title).toBe(`${fixtureStudy.title} | Sunlite Signs`));
    expect(document.head.querySelector('meta[name="description"]')!.getAttribute("content")).toBe(fixtureStudy.summary);
    expect(document.head.querySelector('link[rel="canonical"]')!.getAttribute("href")).toBe(`${SITE_URL}/projects/${fixtureStudy.slug}`);
    const ld = [...document.head.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent!));
    expect(ld.map((x) => x["@type"]).sort()).toEqual(["Article", "BreadcrumbList"]);
    const article = ld.find((x) => x["@type"] === "Article");
    expect(article.headline).toBe(fixtureStudy.title);
    expect(article.image).toHaveLength(3);
  });
});

describe("CaseStudyView with only the required fields", () => {
  it("renders just the hero: no empty sections, no spec list, no gallery, no night image", () => {
    const { container } = renderView(minimalStudy);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(minimalStudy.title);
    for (const id of ["challenge", "specification", "production", "result", "technical-specs", "gallery"]) expect(container.querySelector(`#${id}`), id).toBeNull();
    expect(screen.getAllByRole("img").filter((i) => i.getAttribute("alt")?.startsWith("Fixture")).length).toBe(1);
    expect(container.textContent).not.toMatch(/undefined|null/);
  });
});

describe("ProjectCard and the case-study link", () => {
  const mustang = projects.find((p) => p.id === "mustang")!;
  const wrap = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

  it("shows no case-study link while there are no case studies", () => {
    wrap(<ProjectCard project={mustang} />);
    expect(screen.queryByText(/read the case study/i)).toBeNull();
  });

  it("links to the case study when one is given", () => {
    wrap(<ProjectCard project={mustang} caseStudy={fixtureStudy} />);
    expect(screen.getByRole("link", { name: /read the case study/i })).toHaveAttribute("href", "/projects/fixture-trimless-storefront");
    expect(screen.getByText(fixtureStudy.summary)).toBeInTheDocument();
  });
});

describe("/projects/:slug with no case studies", () => {
  it("sends an unknown slug back to the projects page", async () => {
    const { main } = renderAt("/projects/does-not-exist");
    await waitFor(() => expect(within(main).getByRole("heading", { level: 1, name: /see what we've built/i })).toBeInTheDocument());
    expect(main.querySelector("#case-studies")).toBeNull();
  });
});
