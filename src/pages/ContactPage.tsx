import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Mail, MessageCircle, Phone } from "lucide-react";
import ContactForm, { type AttachmentStatus } from "../components/ContactForm";
import CompanyTypeSelect from "../components/CompanyTypeSelect";
import Breadcrumbs from "../components/Breadcrumbs";
import FAQSection, { faqs } from "../components/FAQSection";
import Seo from "../components/Seo";
import QuoteCard from "../components/configurator/QuoteCard";
import { clearQuote, isQuoteSnapshot, loadQuote, quoteFileId, type QuoteSnapshot } from "../components/configurator/quoteStorage";
import { clearArtworkFile, loadArtworkFile } from "../components/configurator/artworkFileStorage";
import { composePrefill, loadCompanyType, saveCompanyType, type CompanyType } from "../lib/companyType";
import { EMAIL, PHONE_DISPLAY, PHONE_NUMBER, WHATSAPP_URL } from "../lib/contact";
import { CTA_PRIMARY } from "../lib/cta";
import { SITE_URL, absoluteUrl, breadcrumbJsonLd, type Crumb } from "../lib/seo";

const PATH = CTA_PRIMARY.to;
const crumbs: Crumb[] = [
  { label: "Home", to: "/" },
  { label: "Wholesale quote", to: PATH },
];

export const contactIntro = "Send your artwork, dimensions and project details. We'll return a tailored quote within 48 hours.";
export const contactDescription =
  "Send artwork, dimensions and project details for a tailored wholesale quote on channel letters and illuminated signage, within 48 hours. Trade customers only.";

/** What helps us quote fast: every item restates the existing FAQ answer "What files do you need for a quote?". */
const whatToSend = [
  "Logo as a vector file (AI, EPS, PDF)",
  "Dimensions or a dimension sketch",
  "Photos of the facade or installation site",
  "Desired light effect, indoor or outdoor",
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Get your wholesale quote",
    description: contactDescription,
    url: absoluteUrl(PATH),
    about: { "@type": "LocalBusiness", "@id": `${SITE_URL}/#organization`, name: "Sunlite Signs" },
    audience: { "@type": "BusinessAudience", audienceType: "Sign companies and trade professionals" },
  },
  breadcrumbJsonLd(crumbs),
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

export default function ContactPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  // The configurator hands its configuration over in router state (fresh navigation) and sessionStorage (a refresh).
  const location = useLocation();
  const navigate = useNavigate();
  // sessionStorage is read after mount, not in the initial state: the page is prerendered (no storage on the server),
  // and the first client render has to match that HTML.
  const [quote, setQuote] = useState<QuoteSnapshot | null>(() => {
    const fromState = (location.state as { quote?: unknown } | null)?.quote;
    return isQuoteSnapshot(fromState) ? fromState : null;
  });
  useEffect(() => {
    setQuote((current) => current ?? loadQuote());
  }, []);

  // The artwork file that went with the quote (kept in IndexedDB); the form attaches it to its file field.
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [attachStatus, setAttachStatus] = useState<AttachmentStatus>("none");
  const artworkMeta = quote?.artworkFile ?? null;
  const quoteId = quote ? quoteFileId(quote) : null;
  useEffect(() => {
    if (!artworkMeta || !quoteId) {
      setArtworkFile(null);
      return;
    }
    let cancelled = false;
    void loadArtworkFile(quoteId).then((file) => {
      if (!cancelled) setArtworkFile(file);
    });
    return () => {
      cancelled = true;
    };
  }, [artworkMeta, quoteId]);

  // Company type: remembered for this tab (sessionStorage, read after mount like the quote, for the same hydration reason).
  const [companyType, setCompanyType] = useState<CompanyType | null>(null);
  useEffect(() => {
    setCompanyType(loadCompanyType());
  }, []);
  function chooseCompanyType(next: CompanyType | null) {
    setCompanyType(next);
    saveCompanyType(next);
  }
  // The message starts with the company type, then the configurator summary (if any); typed text is never overwritten.
  const prefill = useMemo(() => composePrefill(companyType, quote?.summary), [companyType, quote?.summary]);

  function handleClear() {
    clearQuote();
    void clearArtworkFile();
    setArtworkFile(null);
    setQuote(null);
    navigate(location.pathname, { replace: true, state: null }); // otherwise a refresh would bring it back from history state
  }

  return (
    <>
      <Seo title="Get Your Wholesale Quote: Channel Letters" description={contactDescription} path={PATH} jsonLd={jsonLd} />
      <section className="steel-plate border-b border-border">
        <div className="max-w-7xl mx-auto px-6 pt-6 md:pt-8 pb-12 md:pb-20">
          <Breadcrumbs items={crumbs} className="mb-8 md:mb-10" />
          <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-10 lg:gap-16 items-start">
            <div className="lg:sticky lg:top-24">
              <p className="mono-label text-primary mb-4">Wholesale quote</p>
              <h1 className="text-[clamp(1.9rem,9.4vw,2.7rem)] sm:text-5xl lg:text-[3.4rem] xl:text-6xl uppercase leading-[1.04]">
                Get your{" "}
                <br />
                <span className="text-primary">wholesale quote</span>
              </h1>
              <p className="mt-5 md:mt-7 text-base md:text-lg text-foreground/85 max-w-md">{contactIntro}</p>
              <p className="mt-6 inline-flex border border-primary/60 px-3 py-2 mono-label text-foreground">Trade customers only · No retail sales</p>

              <div className="mt-8 md:mt-10 hidden md:block">
                <p className="mono-label text-muted-foreground mb-3">Helps us quote fast</p>
                <ul className="border-t border-border max-w-md">
                  {whatToSend.map((item) => (
                    <li key={item} className="py-2.5 border-b border-border text-sm text-foreground/85">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-8 md:mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <a href={`mailto:${EMAIL}`} className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
                  <Mail aria-hidden="true" className="w-4 h-4 text-primary" />
                  {EMAIL}
                </a>
                <a href={`tel:${PHONE_NUMBER}`} className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
                  <Phone aria-hidden="true" className="w-4 h-4 text-primary" />
                  {PHONE_DISPLAY}
                </a>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
                  <MessageCircle aria-hidden="true" className="w-4 h-4 text-primary" />
                  WhatsApp
                </a>
              </p>
            </div>

            <ContactForm
              prefill={prefill}
              companyType={companyType}
              attachment={artworkFile}
              onAttachmentStatus={setAttachStatus}
              onSubmitted={handleClear} // sent: nothing of this quote should linger for the next visit
              aboveForm={
                <>
                  {quote && (
                    <QuoteCard
                      quote={quote}
                      onClear={handleClear}
                      artwork={artworkMeta && artworkFile ? { meta: artworkMeta, file: artworkFile, status: attachStatus } : null}
                    />
                  )}
                  <CompanyTypeSelect value={companyType} onChange={chooseCompanyType} />
                </>
              }
            />
          </div>
        </div>
      </section>
      <FAQSection />
    </>
  );
}
