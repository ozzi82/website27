import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Seo from "../components/Seo";
import Breadcrumbs from "../components/Breadcrumbs";
import SectionHeader from "../components/SectionHeader";
import MediaFrame from "../components/MediaFrame";
import ProjectCard from "../components/ProjectCard";
import RelatedLinks from "../components/RelatedLinks";
import ULBadge from "../components/ULBadge";
import BuildYourSign from "../components/BuildYourSign";
import BeforeAfterSlider from "../components/BeforeAfterSlider";
import FinalCTA from "../components/FinalCTA";
import SystemCard from "../components/SystemCard";
import DepthComparison from "../components/DepthComparison";
import DiagramCard from "../components/diagrams/DiagramCard";
import { LightingDiagram } from "../components/diagrams/LetterDiagrams";
import ConfigLightDiagram, { StandoffVsFlush } from "../components/diagrams/ConfigLightDiagram";
import { configurations } from "../data/configurations";
import { ArrowLink, PrimaryCta, SecondaryCta } from "../components/CtaButton";
import { CHANNEL_LETTERS_PATH, CUSTOM_FABRICATION_PATH, classicSystems } from "../data/channelLetters";
import {
  ULTRA_SLIM_ID,
  dayNightImages,
  installationPoints,
  lightingCodes,
  lp11Variants,
  ultraSlimAttributes,
  ultraSlimLightingDiagrams,
  ultraSlimMeta,
  ultraSlimOtherLighting,
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
  { label: "Ultra-Slim Letters", to: PATH },
];
const sectionTitle = "text-3xl sm:text-4xl md:text-5xl lg:text-6xl";

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Ultra-slim cast block acrylic letters (EdgeLuxe LP 11 series)",
    description: `${ultraSlimMeta.intro} ${ultraSlimMeta.signature}`,
    image: absoluteUrl(ultraSlimMeta.heroImage.src),
    url: absoluteUrl(PATH),
    brand: { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "Sunlite Signs" },
    category: "Illuminated signage letters",
    additionalProperty: ultraSlimSpecs.map((s) => ({ "@type": "PropertyValue", name: s.label, value: s.value })),
  },
  breadcrumbJsonLd(crumbs),
];

/** Dedicated page for the signature product: the EdgeLuxe LP 11 series of ultra-slim cast block acrylic letters. */
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
            <p className="mono-label font-bold text-foreground mb-4 md:mb-5">Sunlite Ultra-Slim · EdgeLuxe LP 11</p>
            <h1 className="text-[clamp(1.75rem,8.6vw,2.4rem)] leading-[1.04] sm:text-5xl lg:text-[3.4rem] xl:text-6xl">
              Ultra-Slim Channel Letters.<br />
              <span className="text-primary">Just 10–30 mm Deep.</span>
            </h1>
            <p className="mt-5 md:mt-7 text-base md:text-lg text-foreground/85 max-w-xl">{ultraSlimMeta.intro}</p>
            <p className="mt-3 text-sm text-muted-foreground max-w-xl">{ultraSlimMeta.signature}</p>
            <div className="mt-7 md:mt-9 flex flex-col sm:flex-row gap-3">
              <PrimaryCta />
              <SecondaryCta label="See the 8 variants" to={`${PATH}#variants`} />
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

      <section id="variants" className="py-14 md:py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader
            eyebrow="The LP 11 series"
            title={
              <>
                Eight configurations. <span className="text-primary">One ultra-slim platform.</span>
              </>
            }
            titleClassName={sectionTitle}
            intro="Every LP 11 letter is cast block acrylic with LEDs embedded in the body, epoxy-sealed to IP67. The letters in the name say where the light goes."
          />
          <dl className="grid grid-cols-2 sm:grid-cols-5 gap-x-4 gap-y-5 mb-10 md:mb-12 border-b border-border pb-6" aria-label="Lighting codes">
            {lightingCodes.map((l) => (
              <div key={l.code} className="flex items-baseline gap-3">
                <dt className="font-heading text-4xl font-bold text-primary leading-none">{l.code}</dt>
                <dd className="text-sm">
                  <span className="font-semibold">{l.meaning}</span>
                  <span className="block text-muted-foreground">{l.text}</span>
                </dd>
              </div>
            ))}
          </dl>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-5">
            {lp11Variants.map((v) => (
              <SystemCard
                key={v.id}
                code={v.code}
                title={v.subtitle.replace(/^Block Acrylic /, "")}
                img={v.img}
                alt={`${v.code} ${v.subtitle}: sample letter, lit at night`}
                text={v.lights}
                rows={[
                  { label: "Depth", value: v.depth },
                  { label: "Mounting", value: v.mounting },
                ]}
                links={[
                  { label: "View system", to: v.page },
                  { label: "Preview in 3D", to: v.configurator },
                ]}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="depth" className="py-14 md:py-28 border-t border-border steel-plate scroll-mt-20">
        {/* DOM order is heading, drawing, reasons (so the drawing comes before the list on phones); on lg the drawing sits beside both. */}
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[2fr_3fr] lg:grid-rows-[auto_1fr] gap-x-16 gap-y-8 items-start">
          <SectionHeader eyebrow="Side profile" title="Why 10–30 mm matters." titleClassName={sectionTitle} className="mb-0 pb-0 border-b-0 lg:col-start-1 lg:row-start-1" />
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

      <section id="illumination" className="py-14 md:py-24 border-t border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader eyebrow="Illumination options" title="Face, halo or both." titleClassName={sectionTitle} />
          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {ultraSlimLightingDiagrams.map((t, i) => (
              <DiagramCard
                key={t.code}
                index={`0${i + 1} / ${t.code}`}
                title={t.title}
                diagram={<LightingDiagram kind={t.kind} />}
                meta={{ label: "Light goes", value: t.lightGoes }}
              >
                {t.text}
              </DiagramCard>
            ))}
          </div>
          <p className="mono-label text-muted-foreground mt-4">Concept section diagrams, not to scale.</p>

          <ul className="mt-10 md:mt-14 grid sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-border">
            {ultraSlimOtherLighting.map((o) => {
              const config = configurations.find((c) => c.code === `LP 11-${o.code}`);
              return (
              <li key={o.code} className="border-r border-b border-border p-5 md:p-6">
                {config && (
                  <div className="corner-marks border border-border bg-background/60 p-3 mb-4 max-w-xs">
                    <ConfigLightDiagram config={config} />
                  </div>
                )}
                <p className="font-heading text-4xl font-bold text-primary leading-none">{o.code}</p>
                <h3 className="text-xl md:text-2xl uppercase mt-2">{o.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs">{o.text}</p>
              </li>
              );
            })}
          </ul>

          <div className="mt-10 md:mt-14">
            <p className="mono-label text-primary mb-2">Mounting</p>
            <h3 className="text-2xl md:text-4xl uppercase mb-6">Standoff or flush mount.</h3>
            <StandoffVsFlush />
            <p className="mono-label text-muted-foreground mt-4">Concept section diagrams, not to scale.</p>
          </div>

          <div className="mt-10 md:mt-14 max-w-3xl">
            <p className="mono-label text-primary mb-4">LP 11-F face-lit / day and night</p>
            <BeforeAfterSlider dayImg={dayNightImages.day} nightImg={dayNightImages.night} />
          </div>
        </div>
      </section>

      <section id="specifications" className="py-14 md:py-24 border-t border-border steel-plate scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader eyebrow="Technical details" title="The spec sheet." titleClassName={sectionTitle} />
          <ULBadge label="UL 48 listed · 3-year warranty on LED modules and power supplies" className="mb-6" />
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

      <BuildYourSign configId="lp-11-f-face-lit" />

      <section id="installation" className="py-14 md:py-20 border-t border-border scroll-mt-20">
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

      <section id="projects" className="py-14 md:py-24 border-t border-border steel-plate scroll-mt-20">
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
          </div>
        </div>
      </section>

      <section id="classic" className="py-14 md:py-24 border-t border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader
            eyebrow="Classic trimless letters"
            title="Need a deeper, fabricated letter?"
            titleClassName={sectionTitle}
            intro="Our classic channel letters are trimless fabricated stainless steel in depths from 30 to 100 mm. Ultra-slim LP 11 is the only 10–30 mm line."
            action={<ArrowLink label={CTA_LINKS.viewChannelLetters.label} to={CHANNEL_LETTERS_PATH} />}
          />
          <ul className="grid md:grid-cols-3 gap-5 md:gap-6">
            {classicSystems.map((s) => (
              <li key={s.id}>
                <Link to={s.page} className="group grid grid-cols-[7.5rem_minmax(0,1fr)] h-full border border-border bg-card/50 hover:border-primary/60 transition-colors">
                  <img src={s.img} alt={`${s.code} ${s.subtitle}: sample letter, lit at night`} width={1200} height={900} loading="lazy" decoding="async" className="w-full h-full min-h-[8.5rem] object-cover" />
                  <div className="p-5 border-l border-border flex flex-col min-w-0">
                    <p className="mono-label text-primary">{s.code}</p>
                    <h3 className="text-xl mt-1 leading-tight">{s.subtitle}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{s.lights}. Depths: {s.depths}.</p>
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
          { to: CHANNEL_LETTERS_PATH, title: "Classic trimless letters", text: "Fabricated stainless steel: LP 5, LP 3.1 and LP 3.2, 30 to 100 mm." },
          { to: "/light-effects/lp-1-flat-cutout", title: "Flat cutout letters", text: "Non-illuminated LP 1 letters in wood, metal, acrylic and more." },
          { to: CUSTOM_FABRICATION_PATH, title: "Custom fabrication", text: "Blade signs, push-through cabinet signs and custom projects." },
          { to: CTA_LINKS.tryConfigurator.to, title: "Build Your Sign", text: "See your logo as an LP 11 letter before you request pricing." },
        ]}
      />

      <FinalCTA />
    </>
  );
}
