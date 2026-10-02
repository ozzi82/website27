import { useEffect, useRef } from "react";

declare global {
  interface Window {
    hbspt?: {
      forms: {
        create: (opts: {
          portalId: string;
          formId: string;
          region: string;
          target: string;
        }) => void;
      };
    };
  }
}

export default function HubSpotForm() {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const createForm = () => {
      if (window.hbspt && containerRef.current) {
        containerRef.current.innerHTML = "";
        window.hbspt.forms.create({
          portalId: "47141522",
          formId: "02a5f813-b959-4141-bd1e-28edc296de68",
          region: "na1",
          target: "#hubspot-form-container",
        });
      }
    };

    if (window.hbspt) {
      createForm();
      return;
    }

    const script = document.createElement("script");
    script.src = "//js.hsforms.net/forms/embed/v2.js";
    script.charset = "utf-8";
    script.async = true;
    script.onload = () => {
      // Small delay for the script to initialize
      setTimeout(createForm, 100);
    };
    document.head.appendChild(script);
  }, []);

  return (
    <section id="contact" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 max-w-2xl">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-3">
          Request a Quote
        </h2>
        <p className="text-muted-foreground text-center mb-10 text-sm md:text-base">
          Send your logo and dimensions — we'll get back to you within 48 hours.
        </p>
        <div
          id="hubspot-form-container"
          ref={containerRef}
          className="hubspot-form-wrapper"
        />
      </div>
    </section>
  );
}
