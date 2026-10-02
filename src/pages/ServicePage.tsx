import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Button } from "@project/components/ui/button";
import { services } from "../data/services";
import BeforeAfterSlider from "../components/BeforeAfterSlider";
import Seo from "../components/Seo";
import { SITE_URL, absoluteUrl } from "../lib/seo";

// The configurator works in terms of the 12 EdgeLuxe configurations; these two
// products map onto their closest one.
const CONFIGURATOR_CONFIG: Record<string, string> = {
  "trimless-letters": "lp-5-trimless-face-lit",
  "cast-block-acrylic": "lp-11-f-face-lit",
};

export default function ServicePage() {
  const { id } = useParams();
  const service = services.find((s) => s.id === id);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  if (!service) return <Navigate to="/" replace />;
  const { details } = service;
  const others = services.filter((s) => s.id !== service.id);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: service.title,
      description: details.description,
      image: absoluteUrl(service.img),
      brand: { "@type": "Organization", name: "Sunlite Signs" },
      category: "Illuminated signage",
      additionalProperty: details.specs.map((s) => ({
        "@type": "PropertyValue",
        name: s.label,
        value: s.value,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Product Lines", item: `${SITE_URL}/#products` },
        { "@type": "ListItem", position: 3, name: service.title, item: absoluteUrl(`/services/${service.id}`) },
      ],
    },
  ];

  return (
    <>
      <Seo
        title={service.title}
        description={`${details.subtitle} ${service.desc}`.trim()}
        path={`/services/${service.id}`}
        image={absoluteUrl(service.img)}
        jsonLd={jsonLd}
      />
      <section className="relative h-[45vh] min-h-[320px] overflow-hidden">
        <img src={service.img} alt={service.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-end pb-10">
          <Link to="/#products" className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white mb-4 w-fit">
            <ArrowLeft className="w-4 h-4" /> All products
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{service.title}</h1>
          <p className="text-white/80 md:text-lg">{details.subtitle}</p>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-5xl py-12 md:py-16 space-y-14">
        <p className="text-muted-foreground leading-relaxed md:text-lg max-w-3xl">{details.description}</p>

        <section>
          <h2 className="text-xl md:text-2xl font-bold mb-5">Technical Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {details.specs.map((spec) => (
              <div key={spec.label} className="bg-card border border-border rounded-lg p-4 space-y-1">
                <div className="flex items-center gap-2 text-primary">
                  <spec.icon className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">{spec.label}</span>
                </div>
                <p className="text-sm font-semibold">{spec.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl md:text-2xl font-bold mb-5">Day & Night Effect</h2>
          <BeforeAfterSlider dayImg={details.dayImg} nightImg={details.nightImg} />
        </section>

        <section>
          <h2 className="text-xl md:text-2xl font-bold mb-5">Reference Projects</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {details.gallery.map((src, i) => (
              <div key={i} className="rounded-xl overflow-hidden aspect-[4/3] bg-muted">
                <img src={src} alt={`${service.title} reference ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col md:flex-row md:items-center gap-4 p-6 rounded-xl bg-card border border-border">
          <div className="flex-1">
            <p className="font-semibold text-lg">Interested in {service.title}?</p>
            <p className="text-sm text-muted-foreground">Send us your project files – we'll quote within 48 hours.</p>
          </div>
          <Button size="lg" asChild><Link to="/contact">Get a Quote</Link></Button>
        </section>

        {service.id in CONFIGURATOR_CONFIG && (
          <Link
            to={`/configurator?config=${CONFIGURATOR_CONFIG[service.id]}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            See it on your sign <ArrowUpRight className="w-4 h-4" />
          </Link>
        )}

        <section>
          <h2 className="text-xl font-bold mb-5">Other Products</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {others.map((s) => (
              <Link key={s.id} to={`/services/${s.id}`} className="group flex items-center gap-4 p-3 rounded-xl bg-card border border-border hover:border-primary transition-colors">
                <img src={s.img} alt={s.title} className="w-20 h-20 rounded-lg object-cover" />
                <div>
                  <p className="font-semibold group-hover:text-primary transition-colors">{s.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{s.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
