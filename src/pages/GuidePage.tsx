import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import Breadcrumbs from "../components/Breadcrumbs";
import RelatedLinks, { type RelatedItem } from "../components/RelatedLinks";
import FinalCTA from "../components/FinalCTA";
import { PrimaryCta } from "../components/CtaButton";
import { CTA_LINKS } from "../lib/cta";
import { absoluteUrl, breadcrumbJsonLd, type Crumb } from "../lib/seo";
import { SELECTION_GUIDE, SELECTION_GUIDE_PATH } from "../data/guides";

/** "Stainless steel or cast acrylic?": a comparison of the two trimless families, from facts already on the product pages. */
export default function GuidePage() {
  const g = SELECTION_GUIDE;
  const crumbs: Crumb[] = [
    { label: "Home", to: "/" },
    { label: g.crumb, to: SELECTION_GUIDE_PATH },
  ];
  const related: RelatedItem[] = [
    { to: CTA_LINKS.viewChannelLetters.to, title: "Classic trimless letters", text: "Fabricated stainless steel: LP 5, LP 3.1 and LP 3.2." },
    { to: CTA_LINKS.exploreUltraSlim.to, title: "Ultra-slim letters", text: "EdgeLuxe LP 11 cast block acrylic, 10–30 mm deep." },
    { to: CTA_LINKS.tryConfigurator.to, title: "Build your sign", text: "See either family in 3D at your size." },
  ];

  return (
    <>
      <Seo title={g.title} description={g.description} path={SELECTION_GUIDE_PATH} jsonLd={breadcrumbJsonLd(crumbs)} />

      <section className="steel-plate border-b border-border">
        <div className="max-w-7xl mx-auto px-6 pt-6 md:pt-8 pb-12 md:pb-16">
          <Breadcrumbs items={crumbs} className="mb-8 md:mb-10" />
          <p className="mono-label text-primary mb-4">Guide</p>
          <h1 className="text-[clamp(1.9rem,8.4vw,2.6rem)] sm:text-5xl lg:text-6xl leading-[1.04] max-w-4xl">{g.h1}</h1>
          <p className="mt-5 md:mt-7 text-base md:text-lg text-foreground/85 max-w-2xl">{g.intro}</p>
          <div className="mt-7 md:mt-9">
            <PrimaryCta />
          </div>
        </div>
      </section>

      <section id="comparison" className="py-12 md:py-20 border-b border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-5xl uppercase mb-8">Side by side</h2>
          <div className="overflow-x-auto border border-border">
            <table className="w-full min-w-[40rem] text-sm text-left">
              <thead>
                <tr className="border-b border-border bg-card/60">
                  <th scope="col" className="p-3 md:p-4 mono-label text-muted-foreground w-40">&nbsp;</th>
                  <th scope="col" className="p-3 md:p-4 font-heading text-xl">
                    <Link to={CTA_LINKS.viewChannelLetters.to} className="hover:text-primary">Fabricated stainless steel</Link>
                    <span className="block mono-label text-muted-foreground font-sans mt-1">LP 5, LP 3.1, LP 3.2</span>
                  </th>
                  <th scope="col" className="p-3 md:p-4 font-heading text-xl">
                    <Link to={CTA_LINKS.exploreUltraSlim.to} className="hover:text-primary">Cast block acrylic</Link>
                    <span className="block mono-label text-muted-foreground font-sans mt-1">LP 11 series</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map((r) => (
                  <tr key={r.label} className="border-b border-border last:border-b-0 align-top">
                    <th scope="row" className="p-3 md:p-4 mono-label text-muted-foreground font-normal">{r.label}</th>
                    <td className="p-3 md:p-4">{r.steel}</td>
                    <td className="p-3 md:p-4">{r.acrylic}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mono-label text-muted-foreground mt-4">Both families are trimless. Sunlite does not build trim-capped letters.</p>
        </div>
      </section>

      <section id="choosing" className="py-12 md:py-20 border-b border-border scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-10 md:gap-16">
          {g.choose.map((c) => (
            <div key={c.title}>
              <h2 className="text-2xl md:text-4xl uppercase">{c.title}</h2>
              <ul className="mt-5 space-y-3 text-foreground/85">
                {c.points.map((p) => (
                  <li key={p} className="flex gap-3">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 bg-primary" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <Link to={c.to} className="mono-label text-primary hover:text-foreground mt-6 inline-block">{c.cta} →</Link>
            </div>
          ))}
        </div>
      </section>

      <RelatedLinks items={related} />
      <FinalCTA />
    </>
  );
}
