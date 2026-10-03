import type { MediaImage } from "./production";
import type { Project } from "./projects";

/**
 * Case studies for /projects/:slug (the "Challenge / Specification / Production / Result / Technical specs" template).
 *
 * THIS LIST SHIPS EMPTY ON PURPOSE. A case study is real project documentation: nothing is invented and nothing fake
 * ships. With zero entries there are no case-study routes, no sitemap or llms.txt lines and no links anywhere.
 * Add an entry and the page, the prerender, the sitemap, llms.txt, the content export and the project card link all
 * appear on the next build. Every field except slug/title/summary/image is optional and renders only when present.
 * How to supply them: content-to-fill/CASE-STUDIES.md.
 */
export interface CaseStudySpec {
  label: string;
  value: string;
}

export interface CaseStudy {
  /** URL segment: /projects/<slug>. Lowercase letters, digits and hyphens. */
  slug: string;
  /** Page heading and card title, e.g. "Trimless face-lit letters for a retail storefront". */
  title: string;
  /** One or two sentences: meta description, card text, search snippet. */
  summary: string;
  /** Name the customer only if they allowed it. */
  customer?: string;
  /** The reference card in data/projects.ts this case study expands (the card then links here). */
  projectId?: string;
  /** Product page the study belongs to (e.g. "channel-letters"). */
  productSlug?: string;
  productType?: string;
  application?: string;
  depth?: string;
  illumination?: string;
  materials?: string;
  finish?: string;
  mounting?: string;
  /** Main (day) image. */
  image: MediaImage;
  /** Night / illuminated image, shown beside the day image when present. */
  nightImage?: MediaImage;
  /** Further photos (side profile, installation, production). */
  gallery?: MediaImage[];
  /** Each section is a list of paragraphs; omit a section to hide it. */
  challenge?: string[];
  specification?: string[];
  production?: string[];
  result?: string[];
  /** Extra technical rows, shown after the rows built from the fields above. */
  specs?: CaseStudySpec[];
}

export const caseStudies: CaseStudy[] = [];

export const caseStudyPath = (slug: string) => `/projects/${slug}`;

export const findCaseStudy = (slug: string | undefined, list: CaseStudy[] = caseStudies): CaseStudy | undefined =>
  slug ? list.find((c) => c.slug === slug) : undefined;

/** The case study that expands a given reference card, if any. */
export const caseStudyForProject = (projectId: string, list: CaseStudy[] = caseStudies): CaseStudy | undefined =>
  list.find((c) => c.projectId === projectId);

/** The labelled technical rows of a case study, in display order; empty or absent fields are skipped. */
export function caseStudySpecRows(c: CaseStudy): CaseStudySpec[] {
  const rows: [string, string | undefined][] = [
    ["Customer", c.customer],
    ["Product", c.productType],
    ["Application", c.application],
    ["Depth", c.depth],
    ["Illumination", c.illumination],
    ["Materials", c.materials],
    ["Finish", c.finish],
    ["Mounting", c.mounting],
  ];
  const fromFields = rows.flatMap(([label, value]) => (value && value.trim() ? [{ label, value: value.trim() }] : []));
  const extra = (c.specs ?? []).filter((s) => s.label.trim() && s.value.trim());
  return [...fromFields, ...extra];
}

/** A case study as a reference card (title, photo, known metadata), so it can sit in the same grid as the project photos. */
export function caseStudyToProject(c: CaseStudy): Project {
  return {
    id: c.projectId ?? `case-${c.slug}`,
    title: c.title,
    image: c.image.src,
    width: c.image.width,
    height: c.image.height,
    alt: c.image.alt,
    productType: c.productType,
    productSlug: c.productSlug,
    depth: c.depth,
    illumination: c.illumination,
    finish: c.finish,
    mounting: c.mounting,
  };
}
