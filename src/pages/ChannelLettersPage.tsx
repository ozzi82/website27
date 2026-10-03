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
import TrustStrip from "../components/home/TrustStrip";
import ProcessSteps from "../components/home/ProcessSteps";
import { ArrowLink, PrimaryCta, SecondaryCta } from "../components/CtaButton";
import DiagramCard from "../components/diagrams/DiagramCard";
import { LightingDiagram, MountingDiagram, TrimDiagram } from "../components/diagrams/LetterDiagrams";
import {
  CHANNEL_LETTERS_PATH,
  ULTRA_SLIM_PATH,
  channelLetterFaqs,
  channelLetterReferenceIds,
  channelLetterSpecs,
  channelLettersIntro,
  channelLettersMeta,
  channelLettersWho,
  customFabrication,
  finishOptions,
  illuminationPhotos,
  illuminationTypes,
  lightingOptions,
  mountingNote,
  mountingOptions,
  trimOptions,
} from "../data/channelLetters";
import { projectsByIds, projectsForProduct } from "../data/projects";
import { CTA_LINKS, CTA_SECONDARY } from "../lib/cta";
import { SITE_URL, absoluteUrl, breadcrumbJsonLd, type Crumb } from "../lib/seo";

const crumbs: Crumb[] = [
  { label: "Home", to: "/" },
  { label: "Products", to: "/#products" },
  { label: "Channel Letters", to: CHANNEL_LETTERS_PATH },
];

const sectionTitle = "text-3xl sm:text-4xl md:text-5xl lg:text-6xl";

const onThisPage = [
  ["Illumination", "#illumination"],
  ["Trim", "#trim"],
  ["Mounting", "#mounting"],
  ["Finish", "#finish"],
  ["Specifications", "#specifications"],
  ["Process", "#process"],
  ["Projects", "#projects"],
  ["FAQ", "#faq"],
] as const;

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Wholesale channel letter manufacturing",
    serviceType: "Channel letter fabrication",
    description: `${channelLettersIntro} ${channelLettersWho}`,
    url: absoluteUrl(CHANNEL_LETTERS_PATH),
    image: absoluteUrl(channelLettersMeta.heroImage.src),
    provider: { "@type": "LocalBusiness", "@id": `${SITE_URL}/#organization`, name: "Sunlite Signs" },
    areaServed: "United States",
    audience: { "@type": "BusinessAudience", audienceType: "Sign companies and trade professionals" },
  },
  breadcrumbJsonLd(crumbs),
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: channelLetterFaqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

function SpecList({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className="border-t border-border">
      {rows.map((r) => (
        <div key={r.label} className="grid sm:grid-cols-[9rem_1fr] gap-1 sm:gap-6 py-3.5 border-b border-border">
          <dt className="mono-label text-muted-foreground pt-0.5">{r.label}</dt>
          <dd className="text-sm">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Dedicated, standalone landing page for wholesale channel letters (brief sections 11 and 14): usable as a Google Ads
 * destination, so it introduces Sunlite, shows the primary CTA above the fold and ends in a request for pricing.
 */
export default function ChannelLettersPage() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const timer = setTimeout(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ behavior: "smooth" }), 300);
    return () => clearTimeout(timer);
  }, [hash]);

  const mapped = projectsForProduct("channel-letters");
  const references = mapped.length ? mapped : projectsByIds(channelLetterReferenceIds);
  const photos = illuminationPhotos.flatMap((ph) => projectsByIds([ph.projectId]).map((project) => ({ project, caption: ph.caption })));

  return (
    <>
      <Seo
        title={channelLettersMeta.title}
        description={channelLettersMeta.description}
        path={CHANNEL_LETTERS_PATH}
        image={absoluteUrl(channelLettersMeta.heroImage.src)}
        jsonLd={jsonLd}
      />

      <section className="relative border-b border-border steel-plate">
        <div className="max-w-7xl mx-auto px-6 pt-6 md:pt-8 pb-12 md:pb-16 grid lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-14 items-center">
          <div>
            <Breadcrumbs items={crumbs} className="mb-8 md:mb-10" />
            <p className="mono-label font-bold text-foreground mb-4 md:mb-5">Wholesale sign manufacturer · Trade only</p>
            <h1 className="text-[clamp(1.75rem,8.6vw,2.4rem)] leading-[1.04] sm:text-5xl lg:text-[3.4rem] xl:text-6xl">
              Wholesale Channel Letters<br />
              <span className="text-primary">for Sign Companies.</span>
            </h1>
            <p className="mt-5 md:mt-7 text-base md:text-lg text-foreground/85 max-w-xl">{channelLettersIntro}</p>
            <p className="mt-3 text-sm text-muted-foreground max-w-xl">{channelLettersWho}</p>
            <div className="mt-7 md:mt-9 flex flex-col sm:flex-row gap-3">
              <PrimaryCta />
              <SecondaryCta label={CTA_LINKS.viewSpecs.label} to={CTA_LINKS.viewSpecs.to} />
            </div>
          </div>
          <figure className="corner-marks border border-border bg-card/50">
            <MediaFrame image={channelLettersMeta.heroImage} aspect="aspect-[4/3]" priority />
            <figcaption className="mono-label text-muted-foreground p-3 border-t border-border">Fig. 01 / Illuminated letters on a building facade</figcaption>
          </figure>
        </div>
      </section>

      <TrustStrip />

      <nav aria-label="On this page" className="border-b border-border">
        <ul className="max-w-7xl mx-auto px-6 py-3.5 flex gap-x-6 gap-y-2 overflow-x-auto scrollbar-hide whitespace-nowrap">
          {onThisPage.map(([label, href]) => (
            <li key={href}>
              <a href={href} className="mono-label text-muted-foreground hover:text-primary transition-colors">{label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <section id="illumination" className="py-14 md:py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader eyebrow="Illumination" title="Three ways to light a letter." titleClassName={sectionTitle} />
          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {illuminationTypes.map((t, i) => (
              <DiagramCard
                key={t.id}
                index={`0${i + 1}`}
                title={t.title}
                diagram={<LightingDiagram kind={t.kind} />}
                meta={{ label: "Light goes", value: t.lightGoes }}
              >
                {t.text}
              </DiagramCard>
            ))}
          </div>
          <p className="mono-label text-muted-foreground mt-4">Concept section diagrams, not to scale.</p>

          {photos.length > 0 && (
            <div className="mt-12 md:mt-16">
              <p className="mono-label text-primary mb-4">From recent production</p>
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6">
                {photos.map(({ project, caption }) => (
                  <li key={project.id}>
                    <figure className="border border-border bg-card/50">
                      <MediaFrame image={{ src: project.image, alt: project.alt, width: project.width, height: project.height }} aspect="aspect-[4/3]" />
                      <figcaption className="mono-label text-muted-foreground p-3 border-t border-border">{caption}</figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section id="trim" className="py-14 md:py-24 border-t border-border steel-plate scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader
            eyebrow="Trimmed / trimless"
            title={
              <>
                Trimmed <span className="text-primary">or trimless.</span>
              </>
            }
            titleClassName={sectionTitle}
          />
          <div className="grid md:grid-cols-2 gap-5 md:gap-6">
            {trimOptions.map((t, i) => (
              <DiagramCard key={t.id} index={`0${i + 1}`} title={t.title} diagram={<TrimDiagram kind={t.kind} />}>
                {t.text}
              </DiagramCard>
            ))}
          </div>
          <ArrowLink label={CTA_LINKS.exploreUltraSlim.label} to={ULTRA_SLIM_PATH} className="mt-8 text-sm" />
        </div>
      </section>

      <section id="mounting" className="py-14 md:py-24 border-t border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader eyebrow="Mounting options" title="How the letters are carried." titleClassName={sectionTitle} intro={mountingNote} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {mountingOptions.map((m, i) => (
              <DiagramCard key={m.id} index={`0${i + 1}`} title={m.title} diagram={<MountingDiagram kind={m.kind} />}>
                {m.text}
              </DiagramCard>
            ))}
          </div>
        </div>
      </section>

      <section id="finish" className="py-14 md:py-24 border-t border-border steel-plate scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 md:gap-16">
          <div id="lighting-options" className="scroll-mt-20">
            <p className="mono-label text-primary mb-4">Lighting options</p>
            <h2 className="text-3xl md:text-4xl mb-6">LED, power and certification.</h2>
            <SpecList rows={lightingOptions} />
          </div>
          <div id="color-finish" className="scroll-mt-20">
            <p className="mono-label text-primary mb-4">Color / finish options</p>
            <h2 className="text-3xl md:text-4xl mb-6">Finishes set on your drawings.</h2>
            <SpecList rows={finishOptions} />
            <ArrowLink label="EdgeLuxe letter systems" to="/#light-effects" className="mt-6" />
          </div>
        </div>
      </section>

      <section id="custom-fabrication" className="py-14 md:py-20 border-t border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-16 items-end">
          <div>
            <p className="mono-label text-primary mb-4">Custom fabrication</p>
            <h2 className="text-3xl md:text-5xl">{customFabrication.title}</h2>
          </div>
          <div>
            <p className="text-foreground/85 max-w-xl">{customFabrication.text}</p>
            <div className="mt-6">
              <PrimaryCta />
            </div>
          </div>
        </div>
      </section>

      <section id="specifications" className="py-14 md:py-24 border-t border-border steel-plate scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader eyebrow="Technical specifications" title="The spec sheet." titleClassName={sectionTitle} />
          <dl className="grid lg:grid-cols-2 lg:gap-x-16 border-t border-border">
            {channelLetterSpecs.map((r) => (
              <div key={r.label} className="grid sm:grid-cols-[9rem_1fr] gap-1 sm:gap-6 py-3.5 border-b border-border">
                <dt className="mono-label text-muted-foreground pt-0.5">{r.label}</dt>
                <dd className="text-sm">
                  {r.value}
                  {r.link && (
                    <>
                      {" "}
                      <ArrowLink label={r.link.label} to={r.link.to} className="ml-1" />
                    </>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <PrimaryCta />
            <SecondaryCta label={CTA_SECONDARY.label} to={CTA_SECONDARY.to} />
          </div>
        </div>
      </section>

      <ProcessSteps />

      <section id="projects" className="py-14 md:py-24 border-t border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader
            eyebrow="Reference projects"
            title={mapped.length ? "Channel letter projects." : "Recent production."}
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

      <FAQSection items={channelLetterFaqs} eyebrow="Channel letter FAQ" title="Before you request pricing." titleClassName={sectionTitle} />

      <RelatedLinks
        items={[
          { to: ULTRA_SLIM_PATH, title: "Ultra-slim trimless", text: "A specialized option at 25–30 mm total depth." },
          { to: "/#light-effects", title: "EdgeLuxe letter systems", text: "12 configurations, each with depths, materials and limits." },
          { to: CTA_LINKS.viewProjects.to, title: "Projects", text: "See recent production." },
          { to: CTA_LINKS.viewManufacturing.to, title: "Manufacturing", text: "How drawings become finished signs." },
        ]}
      />

      <FinalCTA />
    </>
  );
}
