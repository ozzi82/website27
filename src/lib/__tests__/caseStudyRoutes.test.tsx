// With a (fixture) case study in the data, every route list the build uses picks it up. The module is mocked, so
// nothing real or fake is ever added to the shipped list.
import { waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fixtureStudy } from "../../data/__tests__/fixtures/caseStudyFixture";

vi.mock("../../data/caseStudies", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../data/caseStudies")>();
  const { fixtureStudy: fx } = await import("../../data/__tests__/fixtures/caseStudyFixture");
  // the real helpers default to the real (empty) list, so point them at the fixture list too
  return {
    ...actual,
    caseStudies: [fx],
    findCaseStudy: (slug: string | undefined) => actual.findCaseStudy(slug, [fx]),
    caseStudyForProject: (id: string) => actual.caseStudyForProject(id, [fx]),
  };
});

import { getCaseStudyLinks, getPrerenderRoutes, getSitemapEntries } from "../routes";
import { buildLlmsTxt, buildSitemap } from "../siteFiles";
import { SITE_URL } from "../seo";
import { renderAt } from "../../pages/__tests__/helpers/renderPage";

const route = `/projects/${fixtureStudy.slug}`;

describe("case studies drive routes, sitemap, llms.txt and the page", () => {
  it("adds one prerender route per entry", () => {
    expect(getPrerenderRoutes()).toContain(route);
    expect(getPrerenderRoutes().filter((r) => r.startsWith("/projects/"))).toEqual([route]);
  });

  it("lists it in the sitemap with the configured origin, and the sitemap still equals the route list", () => {
    const xml = buildSitemap(getSitemapEntries(), SITE_URL);
    expect(xml).toContain(`<loc>${SITE_URL}${route}</loc>`);
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort();
    expect(locs).toEqual([...getPrerenderRoutes(), "/configurator"].map((r) => (r === "/" ? `${SITE_URL}/` : SITE_URL + r)).sort());
    expect(getSitemapEntries().find((e) => e.path === route)).toMatchObject({ changefreq: "yearly", priority: 0.6 });
  });

  it("lists it in llms.txt under Company, after Projects", () => {
    const template = "- [Projects]({{SITE_URL}}/projects): x\n{{CASE_STUDIES}}\n- [About]({{SITE_URL}}/about): y\n";
    const text = buildLlmsTxt(template, SITE_URL, getCaseStudyLinks());
    expect(text).toBe(`- [Projects](${SITE_URL}/projects): x\n- [${fixtureStudy.title}](${SITE_URL}${route}): ${fixtureStudy.summary}\n- [About](${SITE_URL}/about): y\n`);
  });

  it("routes /projects/<slug> to the case study page", async () => {
    const { main } = renderAt(route);
    await waitFor(() => expect(within(main).getByRole("heading", { level: 1 }).textContent).toBe(fixtureStudy.title));
    expect(main.querySelector("#technical-specs")).not.toBeNull();
  });

  it("shows a Case studies section on /projects, and the matching photo card links to the study", () => {
    const { main } = renderAt("/projects");
    const section = main.querySelector("#case-studies") as HTMLElement;
    expect(section).not.toBeNull();
    expect(within(section).getByRole("link", { name: /read the case study/i })).toHaveAttribute("href", route);
    const mustangCard = main.querySelector('#projects [data-project="mustang"]') as HTMLElement;
    expect(within(mustangCard).getByRole("link", { name: /read the case study/i })).toHaveAttribute("href", route);
  });
});
