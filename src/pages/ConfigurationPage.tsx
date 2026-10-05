import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@project/components/ui/button";
import { configurations } from "../data/configurations";
import Seo from "../components/Seo";
import { CTA_PRIMARY } from "../lib/cta";
import { SITE_URL, absoluteUrl } from "../lib/seo";
import { lp1Gallery } from "../data/lp1Gallery";
import SystemImage from "../components/SystemImage";
import { BuildYourSignButton } from "../components/CtaButton";
import ULBadge from "../components/ULBadge";
import BuildYourSign from "../components/BuildYourSign";
import ConfigLightDiagram, { StandoffVsFlush } from "../components/diagrams/ConfigLightDiagram";
import { emitsLight } from "../components/configurator/types";

export default function ConfigurationPage() {
  const { id } = useParams();
  const total = configurations.length;
  const idx = configurations.findIndex((c) => c.id === id);
  useEffect(() => { window.scrollTo(0, 0); }, [id]);
  if (idx < 0) return <Navigate to="/#light-effects" replace />;
  const c = configurations[idx];
  const prev = configurations[(idx + total - 1) % total];
  const next = configurations[(idx + 1) % total];
  const path = `/light-effects/${c.id}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: `${c.title} — ${c.subtitle}`,
      description: c.description,
      image: absoluteUrl(c.img),
      brand: { "@type": "Brand", name: "Sunlite Signs" },
      category: "Illuminated signage letters",
      additionalProperty: c.specs.map((s) => ({ "@type": "PropertyValue", name: s.label, value: s.value })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Letter systems", item: `${SITE_URL}/#light-effects` },
        { "@type": "ListItem", position: 3, name: c.title, item: absoluteUrl(path) },
      ],
    },
  ];

  return (
    <div className="pt-28 pb-24">
      <Seo
        title={`${c.title} — ${c.subtitle}`}
        description={`${c.summary} UL Listed, 3-year warranty, wholesale to the trade.`}
        path={path}
        image={absoluteUrl(c.img)}
        jsonLd={jsonLd}
      />
      <div className="max-w-7xl mx-auto px-6">
        <Link to="/#light-effects" className="mono-label inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8">
          <ArrowLeft className="w-4 h-4" /> All {total} letter systems
        </Link>
        <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-end border-b border-border pb-8 mb-10">
          <div>
            <p className="mono-label text-primary mb-4">{c.code} / {c.family}</p>
            <h1 className="text-5xl md:text-7xl">{c.title}</h1>
            <p className="text-2xl text-foreground/80 mt-3">{c.subtitle}</p>
            <p className="text-muted-foreground mt-4 max-w-xl">{c.summary}</p>
            <ULBadge label="UL Listed · 3-year warranty" className="mt-5" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <BuildYourSignButton size="lg" label="Build in 3D" to={`/configurator?config=${c.id}`} />
            <Button asChild size="lg" className="h-14 px-8 uppercase tracking-wider font-semibold">
              <Link to={CTA_PRIMARY.to}>{CTA_PRIMARY.label}</Link>
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-12">
          <SystemImage config={c} />

          <div>
            <h2 className="text-3xl mb-4">About this system</h2>
            <p className="text-muted-foreground leading-relaxed">{c.description}</p>

            {emitsLight(c) && (
              <figure className="mt-8 border border-border bg-card/50 max-w-md">
                <div className="corner-marks bg-background/60 p-4">
                  <ConfigLightDiagram config={c} />
                </div>
                <figcaption className="px-4 py-2.5 border-t border-border mono-label text-muted-foreground">Where the light goes · concept section, not to scale</figcaption>
              </figure>
            )}

            <h2 className="text-3xl mt-10 mb-4">Specifications</h2>
            <dl className="divide-y divide-border border-y border-border">
              {c.specs.map((s) => (
                <div key={s.label} className="grid sm:grid-cols-[10rem_1fr] gap-1 sm:gap-6 py-3">
                  <dt className="mono-label text-muted-foreground pt-0.5">{s.label}</dt>
                  <dd className="text-sm">{s.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8">
              <BuildYourSign
                variant="inline"
                configId={c.id}
                title="See this system with your logo."
                text={
                  c.family === "Flat cutout"
                    ? "Upload your artwork or type your text and preview it in wood, gold mirror, brushed steel, corten and acrylic finishes."
                    : "Upload your artwork or type your text and preview it in 3D, day and night."
                }
              />
            </div>
          </div>
        </div>

        {c.family === "Flat cutout" && (
          <section className="mt-16" aria-labelledby="lp1-finishes">
            <p className="mono-label text-primary mb-3">Finishes</p>
            <h2 id="lp1-finishes" className="text-3xl md:text-4xl mb-6">Material and finish options.</h2>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {lp1Gallery.map((g) => (
                <li key={g.id} className="border border-border bg-card/50">
                  <img src={g.img} alt={g.alt} width={900} height={675} loading="lazy" decoding="async" className="w-full h-auto block" />
                  <div className="p-4 flex items-center justify-between gap-3">
                    <p className="font-medium">{g.label}</p>
                    <Link to={`/configurator?config=${c.id}&finish=${g.id}`} className="mono-label text-primary hover:text-foreground whitespace-nowrap">Try it</Link>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mono-label text-muted-foreground mt-4">Illustrative renders, placeholders until project photos are added. Solid or fabricated builds; see the configurator.</p>
          </section>
        )}

        {emitsLight(c) && (
          <section className="mt-16" aria-labelledby="mount-explainer">
            <p className="mono-label text-primary mb-3">Mounting</p>
            <h2 id="mount-explainer" className="text-3xl md:text-4xl mb-6">Stand-off or flush mount.</h2>
            <StandoffVsFlush />
            <p className="mono-label text-muted-foreground mt-4">Concept section diagrams, not to scale. {c.code} {c.mounts.length > 1 ? "can be mounted flush or on standoffs" : c.mounts[0] === "standoff" ? "is mounted on standoffs only" : "is mounted flush"}.</p>
          </section>
        )}

        <div className="grid grid-cols-2 border border-border mt-16 rounded-xl overflow-hidden">
          <Link to={`/light-effects/${prev.id}`} className="p-6 hover:bg-card transition-colors">
            <span className="mono-label text-muted-foreground inline-flex items-center gap-2"><ArrowLeft className="w-3 h-3" /> Previous</span>
            <p className="font-heading text-2xl font-bold mt-2">{prev.title}</p>
            <p className="text-sm text-muted-foreground">{prev.subtitle}</p>
          </Link>
          <Link to={`/light-effects/${next.id}`} className="p-6 text-right border-l border-border hover:bg-card transition-colors">
            <span className="mono-label text-muted-foreground inline-flex items-center gap-2">Next <ArrowRight className="w-3 h-3" /></span>
            <p className="font-heading text-2xl font-bold mt-2">{next.title}</p>
            <p className="text-sm text-muted-foreground">{next.subtitle}</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
