import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Seo from "../components/Seo";
import Breadcrumbs from "../components/Breadcrumbs";
import SectionHeader from "../components/SectionHeader";
import MediaFrame from "../components/MediaFrame";
import ProjectCard from "../components/ProjectCard";
import RelatedLinks from "../components/RelatedLinks";
import BuildYourSign from "../components/BuildYourSign";
import FinalCTA from "../components/FinalCTA";
import DepthComparison from "../components/DepthComparison";
import DiagramCard from "../components/diagrams/DiagramCard";
import { LightingDiagram } from "../components/diagrams/LetterDiagrams";
import { ArrowLink, PrimaryCta, SecondaryCta } from "../components/CtaButton";
import { CHANNEL_LETTERS_PATH, illuminationTypes } from "../data/channelLetters";
import {
  ULTRA_SLIM_ID,
  SIDE_PROFILE_PLACEHOLDER,
  installationPoints,
  relatedSystems,
  sideProfileMedia,
  ultraSlimAttributes,
  ultraSlimIlluminationTitles,
  ultraSlimMeta,
  ultraSlimService,
  ultraSlimSpecs,
  whyDepthMatters,
} from "../data/ultraSlim";
import { projectsForProduct } from "../data/projects";
import { CTA_LINKS } from "../lib/cta";
import { SITE_URL, absoluteUrl, breadcrumbJsonLd, type Crumb } from "../lib/seo";

const PATH = `/services/${ULTRA_SLIM_ID}`;
const crumbs: Crumb[] = [
  { label: "Home", to: "/" },
  { label: "Products", to: "/#products" },
  { label: "Ultra-Slim Trimless", to: PATH },
];
const sectionTitle = "text-3xl sm:text-4xl md:text-5xl lg:text-6xl";

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Product",
    name: ultraSlimService.title,
    description: `${ultraSlimMeta.intro} ${ultraSlimMeta.specialized}`,
    image: absoluteUrl(ultraSlimMeta.heroImage.src),
    url: absoluteUrl(PATH),
    brand: { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "Sunlite Signs" },
    category: "Illuminated signage",
    additionalProperty: ultraSlimService.details.specs.map((s) => ({ "@type": "PropertyValue", name: s.label, value: s.value })),
  },
  breadcrumbJsonLd(crumbs),
];

/** Side-profile photo slot: shows the real image once `sideProfileMedia` is set, an honest placeholder until then. */
function SideProfileCard({ index }: { index: number }) {
  return (
    <article className="flex flex-col border border-border bg-card/50" data-slot="side-profile">
      <MediaFrame
        image={sideProfileMedia}
        aspect="aspect-[4/3]"
        className="border-b border-border"
        placeholder={
          <div aria-hidden="true" className="absolute inset-0 steel-plate bg-secondary/60 p-3">
            <div className="corner-marks h-full flex flex-col items-center justify-center gap-3 border border-border/60 text-center p-4">
              <span className="font-heading text-6xl sm:text-7xl leading-none font-bold text-transparent [-webkit-text-stroke:1.5px_hsl(var(--primary)/0.5)]">
                25–30
              </span>
              <span className="mono-label text-muted-foreground">{SIDE_PROFILE_PLACEHOLDER}</span>
            </div>
          </div>
        }
      />
      <div className="p-3 sm:p-5">
        <p className="mono-label text-muted-foreground">Fig. {String(index + 1).padStart(2, "0")}</p>
        <h3 className="text-lg sm:text-2xl mt-1 leading-tight">Side profile</h3>
      </div>
    </article>
  );
}

/** Dedicated page for the ultra-slim differentiator (brief section 12): 25-30 mm as a specialized option. */
export default function UltraSlimPage() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const timer = setTimeout(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ behavior: "smooth" }), 300);
    return () => clearTimeout(timer);
  }, [hash]);

  // The hero already shows one of the mapped photos; the grid shows the rest.
  const photos = projectsForProduct(ULTRA_SLIM_ID).filter((p) => p.image !== ultraSlimMeta.heroImage.src);

  return (
    <>
      <Seo title={ultraSlimMeta.title} exactTitle description={ultraSlimMeta.description} path={PATH} image={absoluteUrl(ultraSlimMeta.heroImage.src)} jsonLd={jsonLd} />

      <section className="relative border-b border-border steel-plate">
        <div className="max-w-7xl mx-auto px-6 pt-6 md:pt-8 pb-12 md:pb-16 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">
          <div>
            <Breadcrumbs items={crumbs} className="mb-8 md:mb-10" />
            <p className="mono-label font-bold text-foreground mb-4 md:mb-5">Sunlite Ultra-Slim</p>
            <h1 className="text-[clamp(1.75rem,8.6vw,2.4rem)] leading-[1.04] sm:text-5xl lg:text-[3.4rem] xl:text-6xl">
              Ultra-Slim Channel Letters.<br />
              <span className="text-primary">Just 25–30 mm Deep.</span>
            </h1>
            <p className="mt-5 md:mt-7 text-base md:text-lg text-foreground/85 max-w-xl">{ultraSlimMeta.intro}</p>
            <p className="mt-3 text-sm text-muted-foreground max-w-xl">{ultraSlimMeta.specialized}</p>
            <div className="mt-7 md:mt-9 flex flex-col sm:flex-row gap-3">
              <PrimaryCta />
              <SecondaryCta label="View Specs" to={`${PATH}#specifications`} />
            </div>
          </div>
          <figure className="corner-marks border border-border bg-card/50">
            <MediaFrame image={ultraSlimMeta.heroImage} aspect="aspect-[4/3]" priority />
            <figcaption className="mono-label text-muted-foreground p-3 border-t border-border">Fig. 01 / Project photography</figcaption>
          </figure>
        </div>
        <div className="max-w-7xl mx-auto px-6">
          <ul className="grid sm:grid-cols-3 border-t border-border">
            {ultraSlimAttributes.map((a, i) => (
              <li key={a} className="py-5 sm:px-6 sm:first:pl-0 sm:border-l sm:first:border-l-0 border-border border-b sm:border-b-0 last:border-b-0">
                <span className="mono-label text-primary">0{i + 1}</span>
                <p className="font-heading text-2xl uppercase mt-1 leading-tight">{a}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="depth" className="py-14 md:py-28 scroll-mt-20">
        {/* DOM order is heading, drawing, reasons (so the drawing comes before the list on phones); on lg the drawing sits beside both. */}
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[2fr_3fr] lg:grid-rows-[auto_1fr] gap-x-16 gap-y-8 items-start">
          <SectionHeader eyebrow="Side profile" title="Why 25–30 mm matters." titleClassName={sectionTitle} className="mb-0 pb-0 border-b-0 lg:col-start-1 lg:row-start-1" />
          <div className="corner-marks border border-border bg-background/60 p-3 sm:p-8 lg:p-10 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <DepthComparison size="lg" />
          </div>
          <ol className="border-t border-border lg:col-start-1 lg:row-start-2">
            {whyDepthMatters.map((w, i) => (
              <li key={w.title} className="py-5 border-b border-border">
                <span className="mono-label text-primary">0{i + 1}</span>
                <h3 className="text-2xl uppercase mt-1">{w.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-md">{w.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="illumination" className="py-14 md:py-24 border-t border-border steel-plate scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader eyebrow="Illumination options" title="Face, halo or dual lit." titleClassName={sectionTitle} />
          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {illuminationTypes.map((t, i) => (
              <DiagramCard
                key={t.id}
                index={`0${i + 1}`}
                title={ultraSlimIlluminationTitles[t.kind]}
                diagram={<LightingDiagram kind={t.kind} />}
                meta={{ label: "Light goes", value: t.lightGoes }}
              >
                {t.text}
              </DiagramCard>
            ))}
          </div>
          <p className="mono-label text-muted-foreground mt-4">Concept section diagrams, not to scale.</p>
        </div>
      </section>

      <section id="specifications" className="py-14 md:py-24 border-t border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader eyebrow="Technical details" title="The spec sheet." titleClassName={sectionTitle} />
          <dl className="grid lg:grid-cols-2 lg:gap-x-16 border-t border-border">
            {ultraSlimSpecs.map((r) => (
              <div key={r.label} className="grid sm:grid-cols-[9rem_1fr] gap-1 sm:gap-6 py-3.5 border-b border-border">
                <dt className="mono-label text-muted-foreground pt-0.5">{r.label}</dt>
                <dd className="text-sm">{r.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <BuildYourSign configId="lp-5-trimless-face-lit" />

      <section id="installation" className="py-14 md:py-20 border-t border-border steel-plate scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[1fr_1.4fr] gap-8 lg:gap-16 items-start">
          <div>
            <p className="mono-label text-primary mb-4">Installation / mounting</p>
            <h2 className="text-3xl md:text-5xl">Ready to install.</h2>
          </div>
          <dl className="border-t border-border">
            {installationPoints.map((p) => (
              <div key={p.label} className="grid sm:grid-cols-[10rem_1fr] gap-1 sm:gap-6 py-3.5 border-b border-border">
                <dt className="mono-label text-muted-foreground pt-0.5">{p.label}</dt>
                <dd className="text-sm">
                  {p.value}
                  {p.link && (
                    <>
                      {" "}
                      <ArrowLink label={p.link.label} to={p.link.to} className="ml-1" />
                    </>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="projects" className="py-14 md:py-24 border-t border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader
            eyebrow="Project photography"
            title="On the wall."
            titleClassName={sectionTitle}
            action={<ArrowLink label={CTA_LINKS.viewAllProjects.label} to={CTA_LINKS.viewAllProjects.to} />}
          />
          <div className="grid sm:grid-cols-2 gap-5 md:gap-6">
            {photos.map((p, i) => (
              <ProjectCard key={p.id} project={p} index={i} />
            ))}
            <SideProfileCard index={photos.length} />
          </div>
        </div>
      </section>

      <section id="related-systems" className="py-14 md:py-24 border-t border-border steel-plate scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader
            eyebrow="Related letter systems"
            title="Depths differ by system."
            titleClassName={sectionTitle}
            intro="These EdgeLuxe systems are listed with their own depths, materials and limits."
          />
          <ul className="grid md:grid-cols-2 gap-5 md:gap-6">
            {relatedSystems.map((s) => (
              <li key={s.id}>
                <Link to={`/light-effects/${s.id}`} className="group grid grid-cols-[7.5rem_1fr] sm:grid-cols-[11rem_1fr] h-full border border-border bg-card/50 hover:border-primary/60 transition-colors">
                  <img src={s.img} alt={`${s.code} ${s.subtitle}`} width={400} height={300} loading="lazy" decoding="async" className="w-full h-full min-h-[8.5rem] object-cover" />
                  <div className="p-5 border-l border-border flex flex-col">
                    <p className="mono-label text-primary">{s.code}</p>
                    <h3 className="text-2xl mt-1">{s.subtitle}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{s.depthText}.</p>
                    <span className="mono-label mt-auto pt-4 text-primary group-hover:text-foreground transition-colors">View system</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <RelatedLinks
        items={[
          { to: CHANNEL_LETTERS_PATH, title: "All channel letters", text: "Front, halo and front + back lit, trimmed or trimless." },
          { to: CTA_LINKS.viewProjects.to, title: "Projects", text: "See recent production." },
          { to: CTA_LINKS.viewManufacturing.to, title: "Manufacturing", text: "How drawings become finished signs." },
          { to: CTA_LINKS.tryConfigurator.to, title: "Build Your Sign", text: "See your logo as a letter system before you request pricing." },
        ]}
      />

      <FinalCTA />
    </>
  );
}
