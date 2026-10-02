import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ContactForm from "../components/ContactForm";
import FAQSection, { faqs } from "../components/FAQSection";
import Seo from "../components/Seo";
import QuoteCard from "../components/configurator/QuoteCard";
import { clearQuote, isQuoteSnapshot, loadQuote, type QuoteSnapshot } from "../components/configurator/quoteStorage";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function ContactPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  // The configurator hands its configuration over in router state (fresh navigation) and sessionStorage (a refresh).
  const location = useLocation();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<QuoteSnapshot | null>(() => {
    const fromState = (location.state as { quote?: unknown } | null)?.quote;
    return isQuoteSnapshot(fromState) ? fromState : loadQuote();
  });

  function handleClear() {
    clearQuote();
    setQuote(null);
    navigate(location.pathname, { replace: true, state: null }); // otherwise a refresh would bring it back from history state
  }

  return (
    <>
      <Seo
        title="Get a Quote"
        description="Send your shop drawings, logo and dimensions for a wholesale channel letter or illuminated signage quote — pricing back within 48 hours. Trade only."
        path="/contact"
        jsonLd={jsonLd}
      />
      <section className="pt-24 pb-12 bg-secondary">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Get in Touch</h1>
          <p className="text-muted-foreground text-lg">
            Send your logo and dimensions — we'll get back to you with a quote.
          </p>
        </div>
      </section>
      <ContactForm
        prefill={quote?.summary ?? null}
        aboveForm={quote ? <QuoteCard quote={quote} onClear={handleClear} /> : null}
      />
      <FAQSection />
    </>
  );
}
