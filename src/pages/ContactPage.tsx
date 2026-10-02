import { useEffect } from "react";
import ContactForm from "../components/ContactForm";
import FAQSection, { faqs } from "../components/FAQSection";
import Seo from "../components/Seo";

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
      <ContactForm />
      <FAQSection />
    </>
  );
}
