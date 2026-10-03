import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@project/components/ui/button";
import { configurations } from "../data/configurations";
import Seo from "../components/Seo";
import { CTA_PRIMARY } from "../lib/cta";
import { SITE_URL, absoluteUrl } from "../lib/seo";

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
          </div>
          <Button asChild size="lg" className="h-14 px-8 uppercase tracking-wider font-semibold">
            <Link to={CTA_PRIMARY.to}>{CTA_PRIMARY.label}</Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-12">
          <figure className="rounded-xl overflow-hidden border border-border bg-card">
            <img
              src={c.img}
              alt={`${c.title} ${c.subtitle} — sample letter`}
              className="w-full h-auto object-cover"
              loading="eager"
            />
          </figure>

          <div>
            <h2 className="text-3xl mb-4">About this system</h2>
            <p className="text-muted-foreground leading-relaxed">{c.description}</p>

            <h2 className="text-3xl mt-10 mb-4">Specifications</h2>
            <dl className="divide-y divide-border border-y border-border">
              {c.specs.map((s) => (
                <div key={s.label} className="grid sm:grid-cols-[10rem_1fr] gap-1 sm:gap-6 py-3">
                  <dt className="mono-label text-muted-foreground pt-0.5">{s.label}</dt>
                  <dd className="text-sm">{s.value}</dd>
                </div>
              ))}
            </dl>

            <Button asChild variant="outline" size="lg" className="mt-8">
              <Link to={`/configurator?config=${c.id}`}>See it with your logo</Link>
            </Button>
          </div>
        </div>

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
