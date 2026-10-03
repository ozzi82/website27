import { Mail, Phone } from "lucide-react";
import { ArrowLink, PrimaryCta } from "./CtaButton";
import { CTA_LINKS } from "../lib/cta";
import { EMAIL, PHONE_DISPLAY, PHONE_NUMBER } from "../lib/contact";

/** Closing call to action (brief section 18). Shared by the homepage and the inner pages. */
export default function FinalCTA() {
  return (
    <section id="request-pricing" className="border-t border-border steel-plate bg-card">
      <div className="caution-tape h-1" />
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid lg:grid-cols-[1.3fr_1fr] gap-10 items-end">
        <h2 className="text-4xl sm:text-5xl md:text-7xl uppercase">
          Have drawings ready?
          <br />
          <span className="text-primary">Let's price the job.</span>
        </h2>
        <div>
          <p className="text-lg text-foreground/80 max-w-md">
            Upload your artwork and dimensions and we'll prepare your wholesale quote.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
            <PrimaryCta />
            <ArrowLink label="Or build your sign in 3D first" to={CTA_LINKS.tryConfigurator.to} className="text-sm" />
          </div>
          <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <a href={`mailto:${EMAIL}`} className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
              <Mail aria-hidden="true" className="w-4 h-4 text-primary" />
              {EMAIL}
            </a>
            <a href={`tel:${PHONE_NUMBER}`} className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
              <Phone aria-hidden="true" className="w-4 h-4 text-primary" />
              {PHONE_DISPLAY}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
