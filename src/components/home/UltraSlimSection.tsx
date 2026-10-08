import SectionHeader from "../SectionHeader";
import DepthComparison from "../DepthComparison";
import { ArrowLink } from "../CtaButton";
import { CTA_LINKS } from "../../lib/cta";
import { ultraSlimAttributes as attributes } from "../../data/ultraSlim";

/**
 * The homepage hero product: Sunlite Ultra-Slim = the EdgeLuxe LP 11 series (cast block acrylic). Header and depth
 * drawing on top.
 */
export default function UltraSlimSection() {
  return (
    <section id="ultra-slim" className="py-14 md:py-28 border-y border-border steel-plate scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <SectionHeader
              eyebrow="Sunlite Ultra-Slim · EdgeLuxe LP 11"
              title={
                <>
                  10–30 mm.
                  <br />
                  <span className="text-primary">Less depth. More design freedom.</span>
                </>
              }
              className="mb-8 md:mb-10 pb-8"
              titleClassName="text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
            />
            <p className="text-lg text-foreground/80 max-w-xl">
              Cast block acrylic letters with embedded LEDs, epoxy-sealed to IP67 and engineered for projects where conventional channel-letter returns are simply too bulky.
            </p>
            <ul className="mt-8 grid sm:grid-cols-3 border-t border-border">
              {attributes.map((a, i) => (
                <li key={a} className="py-4 sm:px-4 sm:first:pl-0 sm:border-l sm:first:border-l-0 border-border border-b sm:border-b-0">
                  <span className="mono-label text-primary">0{i + 1}</span>
                  <p className="font-heading text-xl uppercase mt-1 leading-tight">{a}</p>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              <ArrowLink label={CTA_LINKS.exploreUltraSlim.label} to={CTA_LINKS.exploreUltraSlim.to} className="text-sm" />
              <ArrowLink label={CTA_LINKS.tryConfigurator.label} to="/configurator?config=lp-11-f-face-lit" className="text-sm" />
            </div>
          </div>
          <div className="corner-marks border border-border bg-background/60 p-3 sm:p-8">
            <DepthComparison />
          </div>
        </div>
      </div>
    </section>
  );
}
