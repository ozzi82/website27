import ULBadge from "../ULBadge";
import { ArrowLink } from "../CtaButton";
import { CTA_PRIMARY } from "../../lib/cta";

export const TRUST_BADGE = {
  src: "/images/trust-badge.webp",
  src640: "/images/trust-badge-640.webp",
  width: 1134,
  height: 1178,
  alt: "Sunlite Signs wholesale manufacturing credentials — 10,000+ channel letters produced, UL 48 listed, German-engineered, nationwide sign company partner",
} as const;

/**
 * Proof section: the trust badge (an owner-supplied graphic whose wording must not change) beside plain-text
 * copy that carries the same facts for search engines and assistive technology.
 * Mobile order: eyebrow, headline, copy, badge, CTA. Desktop: text and CTA grouped on the left, badge on the right.
 * (On mobile the text wrapper uses `display: contents` so the CTA can be ordered after the badge without duplicating the link.)
 */
export default function TrustBadgeSection() {
  return (
    <section id="trusted" className="py-14 md:py-28 border-t border-border scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6 grid gap-x-16 gap-y-10 lg:grid-cols-[45fr_55fr] items-center">
        <div className="max-lg:contents lg:col-start-1 lg:flex lg:flex-col">
          <div>
            <p className="mono-label text-primary mb-4">Proven production partner</p>
            <h2 className="text-4xl sm:text-5xl lg:text-4xl xl:text-5xl">
              Built for sign companies.
              <br />
              <span className="text-primary">Trusted by sign companies.</span>
            </h2>
            <p className="text-lg text-foreground/80 mt-6 max-w-xl">
              We are a wholesale manufacturer of channel letters and illuminated signage for sign shops across North America
              — German-engineered, UL 48 listed, built to your drawings and shipped ready for installation.
            </p>
            <ULBadge className="mt-5" />
          </div>
          <div className="max-lg:order-last lg:mt-8">
            <ArrowLink label={CTA_PRIMARY.label} to={CTA_PRIMARY.to} className="text-sm" />
          </div>
        </div>

        <figure className="lg:col-start-2 m-0">
          <img
            src={TRUST_BADGE.src}
            srcSet={`${TRUST_BADGE.src640} 640w, ${TRUST_BADGE.src} ${TRUST_BADGE.width}w`}
            sizes="(min-width: 1024px) 360px, 300px"
            width={TRUST_BADGE.width}
            height={TRUST_BADGE.height}
            alt={TRUST_BADGE.alt}
            loading="lazy"
            decoding="async"
            className="block w-full max-w-[300px] lg:max-w-[360px] h-auto mx-auto [filter:drop-shadow(0_18px_36px_rgba(0,0,0,0.35))]"
          />
        </figure>
      </div>
    </section>
  );
}
