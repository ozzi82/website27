import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { getAttribution, trackLead } from "../lib/tracking";
import { attachFilesToInput, clearFileInput, findFileInput, formDocuments, holdsFiles } from "./hubspotFile";
import { CTA_PRIMARY } from "../lib/cta";

declare global {
  interface Window {
    hbspt?: {
      forms: {
        create: (opts: {
          portalId: string;
          formId: string;
          region: string;
          target: string;
          /** Overrides the submit button label set in the HubSpot portal (supported by the v2 embed). */
          submitText?: string;
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
  /** Shown above the form (the configuration card). */
  aboveForm?: ReactNode;
  /** Files to attach to the form's file field once the form is up (never replaces files the visitor chose): the artwork first, then the configuration picture. */
  attachments?: File[];
  onAttachmentStatus?: (status: AttachmentStatus) => void;
  /** HubSpot reported a successful submission. */
  onSubmitted?: () => void;
}

const NO_FILES: File[] = [];

export default function HubSpotForm({ prefill = null, aboveForm, attachments = NO_FILES, onAttachmentStatus, onSubmitted }: HubSpotFormProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);
  const prefillRef = useRef(prefill);
  prefillRef.current = prefill;
  // What we last wrote into the field, so we only ever replace our own text and never something the visitor typed.
  const written = useRef<string | null>(null);

  const attachmentRef = useRef(attachments);
  attachmentRef.current = attachments;
  const statusCallback = useRef(onAttachmentStatus);
  statusCallback.current = onAttachmentStatus;
  const submittedCallback = useRef(onSubmitted);
  submittedCallback.current = onSubmitted;
  const status = useRef<AttachmentStatus>("none");
  // Each file field gets one attempt: if the visitor later removes our file it stays removed, while a re-rendered
  // (new) field gets the file again.
  const handled = useRef(new WeakSet<HTMLInputElement>());
  const ours = useRef<{ input: HTMLInputElement; files: File[] } | null>(null);

  const report = useCallback((next: AttachmentStatus) => {
    if (status.current === next) return;
    status.current = next;
    statusCallback.current?.(next);
  }, []);

  const applyAttachment = useCallback(() => {
    const root = containerRef.current;
    if (!root) return;
    const files = attachmentRef.current;

    if (files.length === 0) {
      // Cleared: take our files back out, unless the visitor has replaced them.
      const mine = ours.current;
      ours.current = null;
      if (mine && holdsFiles(mine.input, mine.files)) clearFileInput(mine.input);
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
      } else if (attachFilesToInput(input, files)) {
        ours.current = { input, files };
        report("attached");
      } else {
        report("failed");
      }
      return;
    }
    if (ours.current?.input === input) {
      if (holdsFiles(input, files)) report("attached");
      else if (holdsFiles(input, ours.current.files)) {
        // The list grew or changed (the configuration picture finished after the artwork): swap our earlier set for the new one.
        if (attachFilesToInput(input, files)) {
          ours.current = { input, files };
          report("attached");
        } else report("failed");
      } else report("detached"); // the visitor chose or removed files themselves
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

  /**
   * Hidden form fields named like the ad tags (gclid, utm_source...) get this visit's values, so each lead carries the
   * ad or campaign that brought it. The fields are created in the HubSpot form editor; without them nothing happens.
   */
  const applyAttribution = useCallback(() => {
    const root = containerRef.current;
    if (!root) return;
    for (const [name, value] of Object.entries(getAttribution())) {
      const field = root.querySelector<HTMLInputElement>(`input[name="${name}"]`);
      if (!field || !value) continue;
      field.value = value;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
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
          submitText: CTA_PRIMARY.label, // the primary CTA wording, whatever the HubSpot portal says
          onFormReady: () => {
            applyAttribution();
            applyPrefill();
            applyAttachment();
          },
          onFormSubmitted: () => {
            trackLead({ has_configurator_quote: Boolean(prefillRef.current) });
            submittedCallback.current?.();
          },
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
  }, [applyPrefill, applyAttachment, applyAttribution]);

  // The form renders asynchronously and may re-render: keep trying (poll, then watch for changes) until the file is on.
  useEffect(() => {
    applyAttachment();
    if (attachments.length === 0) return;

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
  }, [attachments, applyAttachment, report]);

  // A later change (the visitor pressed Clear) updates or empties the field if the form is already up.
  useEffect(() => {
    applyPrefill();
  }, [prefill, applyPrefill]);

  return (
    <div id="contact">
      {aboveForm}
      <div
        id="hubspot-form-container"
        ref={containerRef}
        className="hubspot-form-wrapper"
      />
    </div>
  );
}
