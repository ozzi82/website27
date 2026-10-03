import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { attachFileToInput, clearFileInput, findFileInput, formDocuments, isSameFile } from "./hubspotFile";
import { CTA_PRIMARY } from "../lib/cta";
import { COMPANY_TYPE_FIELD_NAME } from "../lib/companyType";

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

type CompanyTypeField = HTMLInputElement | HTMLSelectElement;

const isSelect = (f: CompanyTypeField): f is HTMLSelectElement => f.tagName === "SELECT";
const isRadio = (f: CompanyTypeField): f is HTMLInputElement => f.tagName === "INPUT" && (f as HTMLInputElement).type === "radio";
const norm = (s: string) => s.trim().toLowerCase().replace(/s+/g, " ");

/** Fields named `company_type` (a dropdown, text or radio property the owner may add to the HubSpot form later). */
function findCompanyTypeFields(root: HTMLElement): CompanyTypeField[] {
  const found: CompanyTypeField[] = [];
  for (const doc of formDocuments(root)) {
    const scope: ParentNode = doc === root.ownerDocument ? root : doc;
    found.push(...Array.from(scope.querySelectorAll<CompanyTypeField>(`select[name="${COMPANY_TYPE_FIELD_NAME}"], input[name="${COMPANY_TYPE_FIELD_NAME}"]`)));
  }
  return found;
}

/** Sets a select or input the way a visitor choosing it would. */
function setChoiceValue(field: CompanyTypeField, value: string) {
  const win = field.ownerDocument.defaultView ?? window;
  const proto = isSelect(field) ? win.HTMLSelectElement.prototype : win.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(field, value);
  else field.value = value;
  field.dispatchEvent(new win.Event("input", { bubbles: true }));
  field.dispatchEvent(new win.Event("change", { bubbles: true }));
}

/**
 * Writes the company type into every `company_type` field the form has (none today: then this does nothing). Only a
 * field that is empty or still holds what we wrote is touched, so a choice the visitor made in the form itself stays.
 * A dropdown or radio group is only set when one of its options matches the value exactly (ignoring case).
 */
function writeCompanyType(root: HTMLElement, type: string | null, written: { current: string | null }) {
  const fields = findCompanyTypeFields(root);
  const radios = fields.filter(isRadio);
  const others = fields.filter((f) => !isRadio(f));

  for (const field of others) {
    if (field.value !== "" && field.value !== written.current) continue; // the visitor's own answer
    if (isSelect(field)) {
      const wanted = type ? Array.from(field.options).find((o) => norm(o.value) === norm(type) || norm(o.text) === norm(type)) : undefined;
      if (type && !wanted) continue; // no such option in the HubSpot dropdown: leave it alone
      const next = wanted ? wanted.value : "";
      if (field.value !== next) setChoiceValue(field, next);
      written.current = wanted ? wanted.value : null;
    } else {
      const next = type ?? "";
      if (field.value !== next) setChoiceValue(field, next);
      written.current = type;
    }
  }

  if (radios.length && type) {
    const checked = radios.find((r) => r.checked);
    const wanted = radios.find((r) => norm(r.value) === norm(type));
    if (wanted && (!checked || checked.value === written.current) && !wanted.checked) {
      wanted.click(); // a real click, so the form's own handlers run
      written.current = wanted.value;
    }
  }
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
  /** The visitor's company type (see lib/companyType.ts). It is part of `prefill` (the message); this also fills a `company_type` field when the form has one. */
  companyType?: string | null;
  /** Shown above the form (the configuration card, the company-type select). */
  aboveForm?: ReactNode;
  /** A file to attach to the form's file field once the form is up (never replaces a file the visitor chose). */
  attachment?: File | null;
  onAttachmentStatus?: (status: AttachmentStatus) => void;
  /** HubSpot reported a successful submission. */
  onSubmitted?: () => void;
}

export default function HubSpotForm({ prefill = null, companyType = null, aboveForm, attachment = null, onAttachmentStatus, onSubmitted }: HubSpotFormProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);
  const prefillRef = useRef(prefill);
  prefillRef.current = prefill;
  const companyTypeRef = useRef(companyType);
  companyTypeRef.current = companyType;
  const companyWritten = useRef<string | null>(null);
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

  const applyCompanyType = useCallback(() => {
    const root = containerRef.current;
    if (root) writeCompanyType(root, companyTypeRef.current, companyWritten);
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
            applyPrefill();
            applyCompanyType();
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
  }, [applyPrefill, applyCompanyType, applyAttachment]);

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

  // Same for the company type: update a `company_type` field if the form has one.
  useEffect(() => {
    applyCompanyType();
  }, [companyType, applyCompanyType]);

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
