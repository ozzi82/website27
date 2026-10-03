import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Seo from "../components/Seo";
import Breadcrumbs from "../components/Breadcrumbs";
import SectionHeader from "../components/SectionHeader";
import MediaFrame from "../components/MediaFrame";
import ProjectCard from "../components/ProjectCard";
import RelatedLinks from "../components/RelatedLinks";
import FAQSection from "../components/FAQSection";
import FinalCTA from "../components/FinalCTA";
import ProcessSteps from "../components/home/ProcessSteps";
import { ArrowLink, PrimaryCta, SecondaryCta } from "../components/CtaButton";
import { CUSTOM_FABRICATION_PATH, customFaqs, customMeta, customOffers, customReferenceIds, customRelated, customSpecs } from "../data/customFabrication";
import { projectsByIds } from "../data/projects";
import { CTA_LINKS } from "../lib/cta";
import { SITE_URL, absoluteUrl, breadcrumbJsonLd, type Crumb } from "../lib/seo";

const crumbs: Crumb[] = [
  { label: "Home", to: "/" },
  { label: "Products", to: "/#products" },
  { label: "Custom Fabrication", to: CUSTOM_FABRICATION_PATH },
];

const sectionTitle = "text-3xl sm:text-4xl md:text-5xl lg:text-6xl";

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Custom sign fabrication",
    serviceType: "Custom sign fabrication",
    description: customMeta.intro,
    url: absoluteUrl(CUSTOM_FABRICATION_PATH),
    image: absoluteUrl(customMeta.heroImage.src),
    provider: { "@type": "LocalBusiness", "@id": `${SITE_URL}/#organization`, name: "Sunlite Signs" },
    areaServed: "United States",
    audience: { "@type": "BusinessAudience", audienceType: "Sign companies and trade professionals" },
  },
  breadcrumbJsonLd(crumbs),
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: customFaqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  },
];

/**
 * Custom sign fabrication: work made to the partner's drawings, including blade signs and push-through cabinet signs
 * (these appear only here, never as standalone core products). Sizes are "custom to project".
 */
export default function CustomFabricationPage() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const timer = setTimeout(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ behavior: "smooth" }), 300);
    return () => clearTimeout(timer);
  }, [hash]);

  const references = projectsByIds(customReferenceIds);

  return (
    <>
      <Seo title={customMeta.title} description={customMeta.description} path={CUSTOM_FABRICATION_PATH} image={absoluteUrl(customMeta.heroImage.src)} jsonLd={jsonLd} />

      <section className="relative border-b border-border steel-plate">
        <div className="max-w-7xl mx-auto px-6 pt-6 md:pt-8 pb-12 md:pb-16 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
          <div>
            <Breadcrumbs items={crumbs} className="mb-8 md:mb-10" />
            <p className="mono-label font-bold text-foreground mb-4 md:mb-5">Wholesale sign manufacturer · Trade only</p>
            <h1 className="text-[clamp(1.75rem,8.6vw,2.4rem)] leading-[1.04] sm:text-5xl lg:text-[3.4rem] xl:text-6xl">
              Custom Sign Fabrication.<br />
              <span className="text-primary">Made to Your Drawings.</span>
            </h1>
            <p className="mt-5 md:mt-7 text-base md:text-lg text-foreground/85 max-w-xl">{customMeta.intro}</p>
            <div className="mt-7 md:mt-9 flex flex-col sm:flex-row gap-3">
              <PrimaryCta />
              <SecondaryCta label="View Specs" to={`${CUSTOM_FABRICATION_PATH}#specifications`} />
            </div>
          </div>
          <figure className="corner-marks border border-border bg-card/50">
            <MediaFrame image={customMeta.heroImage} aspect="aspect-[4/3]" priority />
            <figcaption className="mono-label text-muted-foreground p-3 border-t border-border">Fig. 01 / Illuminated sign panel</figcaption>
          </figure>
        </div>
      </section>

      <section id="what-we-make" className="py-14 md:py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader eyebrow="What we make to order" title="Your drawing. Our fabrication." titleClassName={sectionTitle} />
          <ol className="grid md:grid-cols-3 border-t-2 border-primary/50">
            {customOffers.map((o, i) => (
              <li key={o.id} className="pt-6 pb-8 md:pr-8 md:pl-8 md:first:pl-0 md:border-l md:first:border-l-0 border-border max-md:border-b max-md:last:border-b-0">
                <span className="mono-label text-muted-foreground">0{i + 1}</span>
                <h2 className="text-3xl md:text-4xl mt-2 uppercase leading-[1.05]">{o.title}</h2>
                <p className="mono-label text-primary mt-3">{o.tag}</p>
                <p className="text-sm text-muted-foreground mt-4 max-w-sm">{o.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="drawing" className="py-14 md:py-20 border-t border-border steel-plate scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[1.3fr_1fr] gap-8 lg:gap-16 items-end">
          <h2 className="text-4xl sm:text-5xl md:text-6xl uppercase">
            Bring us your drawing.
            <br />
            <span className="text-primary">We make it to size.</span>
          </h2>
          <div>
            <p className="text-foreground/85 max-w-md">
              Sizes are custom to the project. Send your artwork as a vector file, with dimensions or a dimension sketch, and we return a tailored quote within 48 hours.
            </p>
            <div className="mt-6">
              <PrimaryCta />
            </div>
          </div>
        </div>
      </section>

      <section id="specifications" className="py-14 md:py-24 border-t border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader eyebrow="Technical details" title="The spec sheet." titleClassName={sectionTitle} />
          <dl className="grid lg:grid-cols-2 lg:gap-x-16 border-t border-border">
            {customSpecs.map((r) => (
              <div key={r.label} className="grid sm:grid-cols-[9rem_1fr] gap-1 sm:gap-6 py-3.5 border-b border-border">
                <dt className="mono-label text-muted-foreground pt-0.5">{r.label}</dt>
                <dd className="text-sm">{r.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <ProcessSteps />

      <section id="projects" className="py-14 md:py-24 border-t border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader
            eyebrow="Reference projects"
            title="Recent production."
            titleClassName={sectionTitle}
            action={<ArrowLink label={CTA_LINKS.viewAllProjects.label} to={CTA_LINKS.viewAllProjects.to} />}
          />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 md:gap-6">
            {references.map((p, i) => (
              <ProjectCard key={p.id} project={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      <FAQSection items={customFaqs} eyebrow="Custom fabrication FAQ" title="Before you send the drawing." titleClassName={sectionTitle} />

      <RelatedLinks items={customRelated} eyebrow="Letter systems" title="Standard systems, too." />

      <FinalCTA />
    </>
  );
}
