import { useCallback, useEffect, useRef, type ReactNode } from "react";

declare global {
  interface Window {
    hbspt?: {
      forms: {
        create: (opts: {
          portalId: string;
          formId: string;
          region: string;
          target: string;
          onFormReady?: (...args: unknown[]) => void;
        }) => void;
      };
    };
  }
}

/**
 * HubSpot renders this form inside a same-origin iframe, so its fields live in that iframe's own document
 * (a plain querySelector on the page never sees them). Look in the page and in any iframe we may read.
 */
function formDocuments(root: HTMLElement): Document[] {
  const docs: Document[] = [root.ownerDocument];
  for (const frame of Array.from(root.querySelectorAll("iframe"))) {
    try {
      if (frame.contentDocument) docs.push(frame.contentDocument);
    } catch {
      // cross-origin frame (the reCAPTCHA one): nothing to read
    }
  }
  return docs;
}

/** The form's free-text field: a message/comments style textarea if there is one, otherwise the first real textarea. */
function findMessageField(root: HTMLElement): HTMLTextAreaElement | null {
  for (const doc of formDocuments(root)) {
    const scope: ParentNode = doc === root.ownerDocument ? root : doc;
    const areas = Array.from(scope.querySelectorAll<HTMLTextAreaElement>("textarea")).filter(
      (a) => !/recaptcha/i.test(a.name + a.id)
    );
    const field = areas.find((a) => /message|comment|question|detail|note|project|inquiry|enquiry/i.test(a.name)) ?? areas[0];
    if (field) return field;
  }
  return null;
}

/** Sets a value the way a user typing would, so HubSpot's own validation and state pick it up. */
function setFieldValue(field: HTMLTextAreaElement, value: string) {
  const win = field.ownerDocument.defaultView ?? window; // the iframe's own window, whose prototypes the field belongs to
  const setter = Object.getOwnPropertyDescriptor(win.HTMLTextAreaElement.prototype, "value")?.set;
  if (setter) setter.call(field, value);
  else field.value = value;
  field.dispatchEvent(new win.Event("input", { bubbles: true }));
  field.dispatchEvent(new win.Event("change", { bubbles: true }));
}

interface HubSpotFormProps {
  /** Text to put in the form's message field (e.g. the sign configuration summary). Null/undefined leaves it alone. */
  prefill?: string | null;
  /** Shown between the intro and the form (the configuration card). */
  aboveForm?: ReactNode;
}

export default function HubSpotForm({ prefill = null, aboveForm }: HubSpotFormProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);
  const prefillRef = useRef(prefill);
  prefillRef.current = prefill;
  // What we last wrote into the field, so we only ever replace our own text and never something the visitor typed.
  const written = useRef<string | null>(null);

  const applyPrefill = useCallback(() => {
    const root = containerRef.current;
    if (!root) return;
    const field = findMessageField(root);
    if (!field) return;
    const next = prefillRef.current ?? "";
    if (field.value === written.current || field.value === "") {
      if (field.value !== next) setFieldValue(field, next);
      written.current = next || null;
    }
  }, []);

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
          onFormReady: applyPrefill,
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
  }, [applyPrefill]);

  // A later change (the visitor pressed Clear) updates or empties the field if the form is already up.
  useEffect(() => {
    applyPrefill();
  }, [prefill, applyPrefill]);

  return (
    <section id="contact" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 max-w-2xl">
        <h2 className="text-2xl md:text-4xl font-bold text-center mb-3">
          Request a Quote
        </h2>
        <p className="text-muted-foreground text-center mb-10 text-sm md:text-base">
          Send your logo and dimensions — we'll get back to you within 48 hours.
        </p>
        {aboveForm}
        <div
          id="hubspot-form-container"
          ref={containerRef}
          className="hubspot-form-wrapper"
        />
      </div>
    </section>
  );
}
