import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Seo from "../components/Seo";
import Breadcrumbs from "../components/Breadcrumbs";
import SectionHeader from "../components/SectionHeader";
import MediaFrame from "../components/MediaFrame";
import ProjectCard from "../components/ProjectCard";
import RelatedLinks from "../components/RelatedLinks";
import BuildYourSign from "../components/BuildYourSign";
import FAQSection from "../components/FAQSection";
import FinalCTA from "../components/FinalCTA";
import SystemCard from "../components/SystemCard";
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
  classicSummary,
  classicSystems,
  constructionRows,
  customFabricationPointer,
  depthOptions,
  filesWeAccept,
  finishOptions,
  illuminationPhotos,
  illuminationTypes,
  lightingOptions,
  mountingNote,
  mountingOptions,
  previewFilesNote,
  trimBenefits,
  trimCapsIntro,
  trimComparison,
  whatArrives,
} from "../data/channelLetters";
import { productCategories } from "../data/products";
import { projectsByIds, projectsForProduct } from "../data/projects";
import { CTA_LINKS, CTA_SECONDARY } from "../lib/cta";
import { SITE_URL, absoluteUrl, breadcrumbJsonLd, type Crumb } from "../lib/seo";

const crumbs: Crumb[] = [
  { label: "Home", to: "/" },
  { label: "Products", to: "/#products" },
  { label: "Classic Trimless Letters", to: CHANNEL_LETTERS_PATH },
];

const sectionTitle = "text-3xl sm:text-4xl md:text-5xl lg:text-6xl";

const onThisPage = [
  ["Systems", "#systems"],
  ["Illumination", "#illumination"],
  ["No trim caps", "#trim-caps"],
  ["Construction", "#construction"],
  ["Mounting", "#mounting"],
  ["Finish", "#finish"],
  ["Specifications", "#specifications"],
  ["Files", "#files"],
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
    description: `${channelLettersIntro} ${classicSummary} ${channelLettersWho}`,
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

const ultraSlimCard = productCategories[0];

/**
 * Dedicated, standalone landing page for wholesale channel letters (the classic trimless letters): usable as a Google Ads
 * destination, so it introduces Sunlite, shows the primary CTA above the fold and ends in a request for pricing.
 * Ultra-slim LP 11 is positioned as the signature option; trim caps appear only in the clearly labelled comparison.
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
            <p className="mt-3 text-sm text-muted-foreground max-w-xl">{classicSummary}</p>
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

      <section id="signature" aria-label="Ultra-slim letters" className="border-b border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 py-10 md:py-14 grid md:grid-cols-[0.8fr_1.2fr] gap-6 md:gap-12 items-center">
          <div className="relative overflow-hidden aspect-[16/10] border border-border bg-card">
            <img
              src={ultraSlimCard.image.src}
              alt={ultraSlimCard.image.alt}
              width={ultraSlimCard.image.width}
              height={ultraSlimCard.image.height}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="mono-label text-primary mb-3">Our signature option</p>
            <h2 className="text-3xl md:text-5xl uppercase leading-[1.05]">
              Ultra-slim LP 11.
              <br />
              <span className="text-primary">Cast block acrylic, 25–30 mm.</span>
            </h2>
            <p className="text-sm md:text-base text-foreground/85 mt-4 max-w-xl">
              When the letter has to be as shallow as possible, our ultra-slim letters are the answer: solid cast block acrylic with embedded LEDs, in eight lighting variants.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
              <ArrowLink label={CTA_LINKS.exploreUltraSlim.label} to={ULTRA_SLIM_PATH} />
              <ArrowLink label="Preview in 3D" to="/configurator?config=lp-11-f-face-lit" />
            </div>
          </div>
        </div>
      </section>

      <nav aria-label="On this page" className="border-b border-border">
        <ul className="max-w-7xl mx-auto px-6 py-3.5 flex gap-x-6 gap-y-2 overflow-x-auto scrollbar-hide whitespace-nowrap">
          {onThisPage.map(([label, href]) => (
            <li key={href}>
              <a href={href} className="mono-label text-muted-foreground hover:text-primary transition-colors">{label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <section id="systems" className="py-14 md:py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader
            eyebrow="Classic trimless letters"
            title="Three classic systems."
            titleClassName={sectionTitle}
            intro="Fabricated stainless steel channel letters with no trim cap. Each system is listed with its own depths, materials and limits."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {classicSystems.map((s) => (
              <SystemCard
                key={s.id}
                code={s.code}
                title={s.subtitle}
                img={s.img}
                alt={`${s.code} ${s.subtitle}: sample letter`}
                text={s.text}
                rows={[
                  { label: "Light", value: s.lights },
                  { label: "Mounting", value: s.mounting },
                  { label: "Depth", value: s.depths },
                  { label: "Min. height", value: s.minHeight },
                ]}
                links={[
                  { label: "View system", to: s.page },
                  { label: "Preview in 3D", to: s.configurator },
                ]}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="illumination" className="py-14 md:py-24 border-t border-border steel-plate scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader eyebrow="Illumination" title="Face lit or halo lit." titleClassName={sectionTitle} />
          <div className="grid md:grid-cols-2 gap-5 md:gap-6">
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
          <p className="mono-label text-muted-foreground mt-4">Concept section diagrams, not to scale. LP 3.2 adds a partial side-lit halo from an exposed acrylic band.</p>

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

      <section id="trim-caps" data-comparison="trim-cap" className="py-14 md:py-24 border-t border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader
            eyebrow="Trimless by design"
            title={
              <>
                Why we don't <span className="text-primary">use trim caps.</span>
              </>
            }
            titleClassName={sectionTitle}
            intro={trimCapsIntro}
          />
          <div className="grid md:grid-cols-2 gap-5 md:gap-6">
            {trimComparison.map((t, i) => (
              <DiagramCard key={t.id} index={`0${i + 1}`} title={t.title} diagram={<TrimDiagram kind={t.kind} />} meta={t.status}>
                {t.text}
              </DiagramCard>
            ))}
          </div>
          <p className="mono-label text-muted-foreground mt-4">Concept section diagrams, not to scale. The trim-cap letter is shown for comparison only.</p>
          <ol className="grid md:grid-cols-3 mt-10 md:mt-12 border-t-2 border-primary/50">
            {trimBenefits.map((b, i) => (
              <li key={b.title} className="pt-5 pb-6 md:pr-8 md:pl-8 md:first:pl-0 md:border-l md:first:border-l-0 border-border">
                <span className="mono-label text-primary">0{i + 1}</span>
                <h3 className="text-2xl uppercase mt-1">{b.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs">{b.text}</p>
              </li>
            ))}
          </ol>
          <ArrowLink label={CTA_LINKS.exploreUltraSlim.label} to={ULTRA_SLIM_PATH} className="mt-8 text-sm" />
        </div>
      </section>

      <section id="construction" className="py-14 md:py-24 border-t border-border steel-plate scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 md:gap-16">
          <div>
            <p className="mono-label text-primary mb-4">Construction</p>
            <h2 className="text-3xl md:text-4xl mb-6">What a letter is made of.</h2>
            <SpecList rows={constructionRows} />
          </div>
          <div id="depth-options" className="scroll-mt-20">
            <p className="mono-label text-primary mb-4">Depth options</p>
            <h2 className="text-3xl md:text-4xl mb-6">Depth follows the job.</h2>
            <ul className="border-t border-border">
              {depthOptions.map((d, i) => (
                <li key={d.id} className="py-4 border-b border-border">
                  <p className="mono-label text-muted-foreground">0{i + 1}</p>
                  <h3 className="text-xl md:text-2xl uppercase mt-1">{d.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md">{d.text}</p>
                  {d.link && <ArrowLink label={d.link.label} to={d.link.to} className="mt-3" />}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="mounting" className="py-14 md:py-24 border-t border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader eyebrow="Mounting options" title="Standoff or flush." titleClassName={sectionTitle} intro={mountingNote} />
          <div className="grid sm:grid-cols-2 gap-5 md:gap-6">
            {mountingOptions.map((m, i) => (
              <DiagramCard key={m.id} index={`0${i + 1}`} title={m.title} diagram={<MountingDiagram kind={m.kind} />} meta={{ label: "System", value: m.systems }}>
                {m.text}
              </DiagramCard>
            ))}
          </div>
        </div>
      </section>

      <BuildYourSign configId="lp-5-trimless-face-lit" />

      <section id="finish" className="py-14 md:py-24 border-t border-border steel-plate scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 md:gap-16">
          <div id="lighting-options" className="scroll-mt-20">
            <p className="mono-label text-primary mb-4">Lighting options</p>
            <h2 className="text-3xl md:text-4xl mb-6">LED, power and certification.</h2>
            <SpecList rows={lightingOptions} />
          </div>
          <div id="color-finish" className="scroll-mt-20">
            <p className="mono-label text-primary mb-4">Color / finish options</p>
            <h2 className="text-3xl md:text-4xl mb-6">Any PMS color.</h2>
            <SpecList rows={finishOptions} />
            <ArrowLink label="All 12 EdgeLuxe letter systems" to="/#light-effects" className="mt-6" />
          </div>
        </div>
      </section>

      <section id="custom-fabrication" className="py-14 md:py-20 border-t border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[1fr_1.1fr] gap-8 lg:gap-16 items-end">
          <div>
            <p className="mono-label text-primary mb-4">Custom fabrication</p>
            <h2 className="text-3xl md:text-5xl">{customFabricationPointer.title}</h2>
          </div>
          <div>
            <p className="text-foreground/85 max-w-xl">{customFabricationPointer.text}</p>
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <PrimaryCta />
              <ArrowLink label={customFabricationPointer.link.label} to={customFabricationPointer.link.to} />
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

      <section id="files" className="py-14 md:py-24 border-t border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 md:gap-16">
          <div>
            <p className="mono-label text-primary mb-4">Files we accept</p>
            <h2 className="text-3xl md:text-4xl mb-6">Send vector artwork.</h2>
            <SpecList rows={filesWeAccept} />
            <p className="mono-label text-muted-foreground mt-4">{previewFilesNote}</p>
          </div>
          <div id="what-arrives" className="scroll-mt-20">
            <p className="mono-label text-primary mb-4">What arrives</p>
            <h2 className="text-3xl md:text-4xl mb-6">Ready to install.</h2>
            <SpecList rows={whatArrives} />
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
          { to: ULTRA_SLIM_PATH, title: "Ultra-slim letters", text: "Our signature product: EdgeLuxe LP 11 cast block acrylic, 25–30 mm deep." },
          { to: CTA_LINKS.customFabrication.to, title: "Custom fabrication", text: "Blade signs, push-through cabinet signs and custom projects to your drawings." },
          { to: CTA_LINKS.viewProjects.to, title: "Projects", text: "See recent production." },
          { to: CTA_LINKS.viewManufacturing.to, title: "Manufacturing", text: "How drawings become finished signs." },
        ]}
      />

      <FinalCTA />
    </>
  );
}
