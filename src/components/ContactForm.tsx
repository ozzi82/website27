import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { attachFileToInput, clearFileInput, findFileInput, formDocuments, isSameFile } from "./hubspotFile";

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
          onFormSubmitted?: (...args: unknown[]) => void;
        }) => void;
      };
    };
  }
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

/**
 * Where the artwork file stands in the form's file field:
 * none (nothing to attach), waiting (form not ready), attached, detached (the visitor chose or removed a file
 * themselves, so ours is left alone) or failed (the browser or form would not take it).
 */
export type AttachmentStatus = "none" | "waiting" | "attached" | "detached" | "failed";

/** How long to keep looking for the (asynchronously rendered) file field before giving up. */
const ATTACH_GIVE_UP_MS = 20000;
const ATTACH_POLL_MS = 500;

interface HubSpotFormProps {
  /** Text to put in the form's message field (e.g. the sign configuration summary). Null/undefined leaves it alone. */
  prefill?: string | null;
  /** Shown between the intro and the form (the configuration card). */
  aboveForm?: ReactNode;
  /** A file to attach to the form's file field once the form is up (never replaces a file the visitor chose). */
  attachment?: File | null;
  onAttachmentStatus?: (status: AttachmentStatus) => void;
  /** HubSpot reported a successful submission. */
  onSubmitted?: () => void;
}

export default function HubSpotForm({ prefill = null, aboveForm, attachment = null, onAttachmentStatus, onSubmitted }: HubSpotFormProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);
  const prefillRef = useRef(prefill);
  prefillRef.current = prefill;
  // What we last wrote into the field, so we only ever replace our own text and never something the visitor typed.
  const written = useRef<string | null>(null);

  const attachmentRef = useRef(attachment);
  attachmentRef.current = attachment;
  const statusCallback = useRef(onAttachmentStatus);
  statusCallback.current = onAttachmentStatus;
  const submittedCallback = useRef(onSubmitted);
  submittedCallback.current = onSubmitted;
  const status = useRef<AttachmentStatus>("none");
  // Each file field gets one attempt: if the visitor later removes our file it stays removed, while a re-rendered
  // (new) field gets the file again.
  const handled = useRef(new WeakSet<HTMLInputElement>());
  const ours = useRef<{ input: HTMLInputElement; file: File } | null>(null);

  const report = useCallback((next: AttachmentStatus) => {
    if (status.current === next) return;
    status.current = next;
    statusCallback.current?.(next);
  }, []);

  const applyAttachment = useCallback(() => {
    const root = containerRef.current;
    if (!root) return;
    const file = attachmentRef.current;

    if (!file) {
      // Cleared: take our file back out, unless the visitor has replaced it.
      const mine = ours.current;
      ours.current = null;
      if (mine && mine.input.files?.length === 1 && isSameFile(mine.input.files[0], mine.file)) clearFileInput(mine.input);
      report("none");
      return;
    }

    const input = findFileInput(root);
    if (!input) {
      if (status.current !== "failed") report("waiting");
      return;
    }
    if (!handled.current.has(input)) {
      handled.current.add(input);
      if (input.files && input.files.length > 0) {
        report("detached"); // the visitor already picked their own file: never overwrite it
      } else if (attachFileToInput(input, file)) {
        ours.current = { input, file };
        report("attached");
      } else {
        report("failed");
      }
      return;
    }
    if (ours.current?.input === input) {
      report(input.files?.length === 1 && isSameFile(input.files[0], file) ? "attached" : "detached");
    }
  }, [report]);

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
          onFormReady: () => {
            applyPrefill();
            applyAttachment();
          },
          onFormSubmitted: () => submittedCallback.current?.(),
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
  }, [applyPrefill, applyAttachment]);

  // The form renders asynchronously and may re-render: keep trying (poll, then watch for changes) until the file is on.
  useEffect(() => {
    applyAttachment();
    if (!attachment) return;

    const started = Date.now();
    const observer = new MutationObserver(() => applyAttachment());
    const watched = new Set<Node>();
    const onChange = () => applyAttachment(); // the visitor picked or removed a file in the form
    const watch = () => {
      const root = containerRef.current;
      if (!root) return;
      if (!watched.has(root)) {
        watched.add(root);
        observer.observe(root, { childList: true, subtree: true });
      }
      for (const doc of formDocuments(root)) {
        if (doc === root.ownerDocument || watched.has(doc)) continue;
        watched.add(doc);
        observer.observe(doc.documentElement, { childList: true, subtree: true });
        doc.addEventListener("change", onChange, true);
      }
    };
    const tick = () => {
      watch();
      applyAttachment();
      if (Date.now() - started > ATTACH_GIVE_UP_MS) {
        clearInterval(timer);
        if (status.current === "waiting") report("failed");
      }
    };
    const timer = setInterval(tick, ATTACH_POLL_MS);
    watch();

    return () => {
      clearInterval(timer);
      observer.disconnect();
      watched.forEach((n) => n.removeEventListener?.("change", onChange, true));
    };
  }, [attachment, applyAttachment, report]);

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
