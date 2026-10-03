import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ContactForm, { type AttachmentStatus } from "../components/ContactForm";
import FAQSection, { faqs } from "../components/FAQSection";
import Seo from "../components/Seo";
import QuoteCard from "../components/configurator/QuoteCard";
import { clearQuote, isQuoteSnapshot, loadQuote, quoteFileId, type QuoteSnapshot } from "../components/configurator/quoteStorage";
import { clearArtworkFile, loadArtworkFile } from "../components/configurator/artworkFileStorage";

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

  function handleClear() {
    clearQuote();
    void clearArtworkFile();
    setArtworkFile(null);
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
        attachment={artworkFile}
        onAttachmentStatus={setAttachStatus}
        onSubmitted={handleClear} // sent: nothing of this quote should linger for the next visit
        aboveForm={
          quote ? (
            <QuoteCard
              quote={quote}
              onClear={handleClear}
              artwork={artworkMeta && artworkFile ? { meta: artworkMeta, file: artworkFile, status: attachStatus } : null}
            />
          ) : null
        }
      />
      <FAQSection />
    </>
  );
}
