import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@project/components/ui/button";
import { configurations } from "../data/configurations";
import BeforeAfterSlider from "../components/BeforeAfterSlider";
import Seo from "../components/Seo";

export default function ConfigurationPage() {
  const { id } = useParams();
  const total = configurations.length;
  const idx = configurations.findIndex((c) => c.id === id);
  useEffect(() => { window.scrollTo(0, 0); }, [id]);
  if (idx < 0) return <Navigate to="/#light-effects" replace />;
  const c = configurations[idx];
  const prev = configurations[(idx + total - 1) % total];
  const next = configurations[(idx + 1) % total];

  return (
    <div className="pt-28 pb-24">
      <Seo
        title={`${c.title} Light Effect`}
        description={c.summary}
        path={`/light-effects/${c.id}`}
        noindex
      />
      <div className="max-w-7xl mx-auto px-6">
        <Link to="/#light-effects" className="mono-label inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8">
          <ArrowLeft className="w-4 h-4" /> All {total} configurations
        </Link>
        <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-end border-b border-border pb-8 mb-10">
          <div>
            <p className="mono-label text-primary mb-4">{c.code} / Light configuration</p>
            <h1 className="text-5xl md:text-7xl">{c.title}</h1>
            <p className="text-muted-foreground mt-4 max-w-xl">{c.summary}</p>
          </div>
          <Button asChild size="lg" className="h-14 px-8 uppercase tracking-wider font-semibold">
            <Link to="/contact">Quote this configuration</Link>
          </Button>
        </div>

        <div className="rounded-xl overflow-hidden border border-border">
          <BeforeAfterSlider dayImg={c.dayImg} nightImg={c.nightImg} />
        </div>
        <p className="mono-label text-muted-foreground mt-3">Drag to compare day vs. night</p>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 mt-16">
          <div>
            <h2 className="text-3xl mb-4">How it works</h2>
            <p className="text-muted-foreground leading-relaxed">{c.description}</p>
          </div>
          <dl className="grid grid-cols-2 border-t border-l border-border rounded-xl overflow-hidden">
            {c.specs.map((s) => (
              <div key={s.label} className="border-r border-b border-border p-5">
                <dt className="mono-label text-muted-foreground">{s.label}</dt>
                <dd className="font-heading text-2xl font-semibold mt-1">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="grid grid-cols-2 border border-border mt-16 rounded-xl overflow-hidden">
          <Link to={`/light-effects/${prev.id}`} className="p-6 hover:bg-card transition-colors">
            <span className="mono-label text-muted-foreground inline-flex items-center gap-2"><ArrowLeft className="w-3 h-3" /> Previous</span>
            <p className="font-heading text-2xl uppercase font-bold mt-2">{prev.title}</p>
          </Link>
          <Link to={`/light-effects/${next.id}`} className="p-6 text-right border-l border-border hover:bg-card transition-colors">
            <span className="mono-label text-muted-foreground inline-flex items-center gap-2">Next <ArrowRight className="w-3 h-3" /></span>
            <p className="font-heading text-2xl uppercase font-bold mt-2">{next.title}</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
