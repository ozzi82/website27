import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import Seo from "../components/Seo";
import Breadcrumbs from "../components/Breadcrumbs";
import MediaFrame from "../components/MediaFrame";
import RelatedLinks, { type RelatedItem } from "../components/RelatedLinks";
import FinalCTA from "../components/FinalCTA";
import { PrimaryCta } from "../components/CtaButton";
import { caseStudyPath, caseStudySpecRows, findCaseStudy, type CaseStudy } from "../data/caseStudies";
import { CTA_LINKS } from "../lib/cta";
import { SITE_NAME, SITE_URL, absoluteUrl, breadcrumbJsonLd, type Crumb } from "../lib/seo";

/** The narrative sections, in the order of the template (each renders only when the case study has it). */
const SECTIONS = [
  { key: "challenge", id: "challenge", label: "Challenge" },
  { key: "specification", id: "specification", label: "Specification" },
  { key: "production", id: "production", label: "Production" },
  { key: "result", id: "result", label: "Result" },
] as const;

const PRODUCT_LINKS: Record<string, RelatedItem> = {
  "channel-letters": { to: CTA_LINKS.viewChannelLetters.to, title: "Channel letters", text: "Front, halo and front + back lit, trimmed or trimless." },
  "ultra-slim-trimless-channel-letters": { to: CTA_LINKS.exploreUltraSlim.to, title: "Ultra-slim trimless", text: "A specialized option at 25–30 mm total depth." },
  "cast-block-acrylic": { to: CTA_LINKS.viewCastAcrylic.to, title: "Cast acrylic", text: "Solid cast acrylic letters with homogeneous illumination." },
};

/** The page body for one case study. Separate from the route wrapper so it can be rendered with any entry. */
export function CaseStudyView({ study }: { study: CaseStudy }) {
  const path = caseStudyPath(study.slug);
  const crumbs: Crumb[] = [
    { label: "Home", to: "/" },
    { label: "Projects", to: "/projects" },
    { label: study.title, to: path },
  ];
  const specs = caseStudySpecRows(study);
  const gallery = study.gallery ?? [];
  const product = study.productSlug ? PRODUCT_LINKS[study.productSlug] : undefined;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: study.title,
      description: study.summary,
      url: absoluteUrl(path),
      image: [study.image, ...(study.nightImage ? [study.nightImage] : []), ...gallery].map((i) => absoluteUrl(i.src)),
      about: study.productType,
      author: { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: SITE_NAME },
      publisher: { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: SITE_NAME },
      mainEntityOfPage: absoluteUrl(path),
    },
    breadcrumbJsonLd(crumbs),
  ];

  const related: RelatedItem[] = [
    ...(product ? [product] : []),
    { to: CTA_LINKS.viewAllProjects.to, title: "All projects", text: "More recent production." },
    { to: CTA_LINKS.viewManufacturing.to, title: "Manufacturing", text: "How drawings become finished signs." },
  ];

  return (
    <>
      <Seo title={study.title} description={study.summary} path={path} image={absoluteUrl(study.image.src)} jsonLd={jsonLd} />

      <section className="steel-plate border-b border-border">
        <div className="max-w-7xl mx-auto px-6 pt-6 md:pt-8 pb-12 md:pb-16">
          <Breadcrumbs items={crumbs} className="mb-8 md:mb-10" />
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-14 items-end">
            <div>
              <p className="mono-label text-primary mb-4">Case study{study.productType ? ` · ${study.productType}` : ""}</p>
              <h1 className="text-[clamp(1.9rem,8.4vw,2.6rem)] sm:text-5xl lg:text-6xl leading-[1.04]">{study.title}</h1>
              <p className="mt-5 md:mt-7 text-base md:text-lg text-foreground/85 max-w-xl">{study.summary}</p>
              <div className="mt-7 md:mt-9">
                <PrimaryCta />
              </div>
            </div>
            <div className={study.nightImage ? "grid grid-cols-2 gap-3" : ""}>
              <figure className="corner-marks border border-border bg-card/50">
                <MediaFrame image={study.image} aspect="aspect-[4/3]" priority />
                {study.nightImage && <figcaption className="mono-label text-muted-foreground p-3 border-t border-border">Day</figcaption>}
              </figure>
              {study.nightImage && (
                <figure className="corner-marks border border-border bg-card/50">
                  <MediaFrame image={study.nightImage} aspect="aspect-[4/3]" priority />
                  <figcaption className="mono-label text-muted-foreground p-3 border-t border-border">Night</figcaption>
                </figure>
              )}
            </div>
          </div>
        </div>
      </section>

      {SECTIONS.map((s) => {
        const paragraphs = (study[s.key] ?? []).filter((p) => p.trim());
        if (paragraphs.length === 0) return null;
        return (
          <section key={s.id} id={s.id} className="py-12 md:py-20 border-b border-border scroll-mt-20">
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-[1fr_2fr] gap-6 md:gap-16">
              <h2 className="text-3xl md:text-5xl uppercase">{s.label}</h2>
              <div className="space-y-4 text-foreground/85 max-w-2xl">
                {paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {specs.length > 0 && (
        <section id="technical-specs" className="py-12 md:py-20 border-b border-border steel-plate scroll-mt-20">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-[1fr_2fr] gap-6 md:gap-16">
            <h2 className="text-3xl md:text-5xl uppercase">Technical specs</h2>
            <dl className="border-t border-border max-w-2xl">
              {specs.map((r) => (
                <div key={r.label} className="grid sm:grid-cols-[9rem_1fr] gap-1 sm:gap-6 py-3.5 border-b border-border">
                  <dt className="mono-label text-muted-foreground pt-0.5">{r.label}</dt>
                  <dd className="text-sm">{r.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}

      {gallery.length > 0 && (
        <section id="gallery" aria-label="More photos" className="py-12 md:py-20 border-b border-border scroll-mt-20">
          <div className="max-w-7xl mx-auto px-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {gallery.map((img) => (
              <figure key={img.src} className="border border-border bg-card/50">
                <MediaFrame image={img} aspect="aspect-[4/3]" />
              </figure>
            ))}
          </div>
        </section>
      )}

      <RelatedLinks items={related} />
      <FinalCTA />
    </>
  );
}

/** /projects/:slug. An unknown slug (there are none until case studies are added to data/caseStudies.ts) goes back to /projects. */
export default function CaseStudyPage() {
  const { slug } = useParams();
  const study = findCaseStudy(slug);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);
  if (!study) return <Navigate to="/projects" replace />;
  return <CaseStudyView study={study} />;
}
