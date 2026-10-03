import type { CaseStudy } from "../../caseStudies";

/** A made-up entry used ONLY by tests (never imported by app code): it exercises every field of the template. */
export const fixtureStudy: CaseStudy = {
  slug: "fixture-trimless-storefront",
  title: "Fixture trimless storefront letters",
  summary: "Fixture summary used to test the case-study template.",
  customer: "Fixture Sign Co",
  projectId: "mustang",
  productSlug: "ultra-slim-trimless-channel-letters",
  productType: "Ultra-slim trimless letters",
  application: "Retail storefront",
  depth: "28 mm fixture depth",
  illumination: "Face illuminated",
  materials: "Fixture materials",
  finish: "Fixture finish",
  mounting: "Fixture mounting",
  image: { src: "/images/fixture-day.jpg", alt: "Fixture day photo", width: 1600, height: 1200 },
  nightImage: { src: "/images/fixture-night.jpg", alt: "Fixture night photo", width: 1600, height: 1200 },
  gallery: [{ src: "/images/fixture-side.jpg", alt: "Fixture side profile", width: 1600, height: 1200 }],
  challenge: ["Fixture challenge paragraph one.", "Fixture challenge paragraph two."],
  specification: ["Fixture specification paragraph."],
  production: ["Fixture production paragraph."],
  result: ["Fixture result paragraph."],
  specs: [
    { label: "Letter height", value: "Fixture height" },
    { label: "Empty row", value: "  " },
  ],
};

/** The minimum a case study needs: everything else is optional and must simply not render. */
export const minimalStudy: CaseStudy = {
  slug: "fixture-minimal",
  title: "Fixture minimal study",
  summary: "Only the required fields.",
  image: { src: "/images/fixture-min.jpg", alt: "Fixture minimal photo", width: 800, height: 600 },
};
