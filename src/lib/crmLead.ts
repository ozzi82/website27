import { getConsent } from "./consent";
/**
 * Sends a submitted configurator quote to the CRM as a lead, next to the HubSpot form it was sent with. The CRM
 * takes the visitor's contact details, the configuration summary and up to three files (the artwork and the
 * picture of the preview). Best effort: the HubSpot submission has already succeeded, so a failure here is never
 * shown to the visitor.
 */
import { formDocuments } from "../components/hubspotFile";

/** Where quote requests go: the CRM's public intake. Empty turns the hand-over off (e.g. a preview build). */
export const CRM_LEAD_URL: string = (import.meta.env.VITE_CRM_LEAD_URL as string | undefined) ?? "https://crm.sunlitesigns.com/quote/submit";

/** What the visitor typed into the form, by field name (file fields, buttons and the captcha are left out). */
export function readFormValues(root: HTMLElement): Record<string, string> {
  const values: Record<string, string> = {};
  for (const doc of formDocuments(root)) {
    const scope: ParentNode = doc === root.ownerDocument ? root : doc;
    for (const field of Array.from(scope.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select"))) {
      const type = (field as HTMLInputElement).type ?? "";
      if (!field.name || /^(file|submit|button|password)$/i.test(type) || /recaptcha|hs_context/i.test(field.name)) continue;
      if ((type === "checkbox" || type === "radio") && !(field as HTMLInputElement).checked) continue;
      const value = field.value.trim();
      if (value && !(field.name in values)) values[field.name] = value;
    }
  }
  return values;
}

export interface LeadFields {
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  /** What the visitor typed themselves (the configuration summary taken back out). */
  message?: string;
  configuration: string;
}

const pick = (values: Record<string, string>, test: RegExp) => Object.entries(values).find(([name]) => test.test(name))?.[1];

/**
 * The CRM's fields from the HubSpot form's values (HubSpot names: email, firstname, lastname, company, phone and a
 * message field). Null without an email address: there is nobody to answer.
 */
export function leadFields(values: Record<string, string>, configuration: string): LeadFields | null {
  const email = pick(values, /^email$/i) ?? pick(values, /e-?mail/i);
  if (!email) return null;
  const name = [pick(values, /^first_?name$/i), pick(values, /^last_?name$/i)].filter(Boolean).join(" ") || pick(values, /^(full_?)?name$/i);
  const typed = pick(values, /message|comment|question|detail|note|project|inquiry|enquiry/i) ?? "";
  // The message field starts with the summary we put there: only what the visitor added is their message.
  const message = typed.replace(configuration.trim(), "").trim();
  return {
    email,
    ...(name ? { name } : {}),
    ...(pick(values, /company/i) ? { company: pick(values, /company/i)! } : {}),
    ...(pick(values, /phone|mobile/i) ? { phone: pick(values, /phone|mobile/i)! } : {}),
    ...(message ? { message } : {}),
    configuration: configuration.trim(),
  };
}

/** The multipart body the CRM's intake reads. */
export function leadFormData(fields: LeadFields, files: File[], attribution: Record<string, string | undefined> = {}): FormData {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) if (value) body.set(key, value);
  body.set("source", "configurator");
  if (typeof window !== "undefined") body.set("referer", window.location.href);
  for (const key of ["gclid", "gbraid", "wbraid", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) if (attribution[key]) body.set(key, attribution[key]!);
  // The cookie choice travels with the lead: the CRM reports the email to Google Ads (hashed) only after "accepted".
  const consent = getConsent();
  if (consent) body.set("ad_consent", consent);
  for (const file of files.slice(0, 3)) body.append("file", file, file.name);
  return body;
}

/** Posts the lead. Resolves true when the CRM took it; never throws. */
export async function sendLeadToCrm(fields: LeadFields, files: File[], attribution: Record<string, string | undefined> = {}, url: string = CRM_LEAD_URL): Promise<boolean> {
  if (!url) return false;
  try {
    const res = await fetch(url, { method: "POST", body: leadFormData(fields, files, attribution), mode: "cors", credentials: "omit" });
    return res.ok;
  } catch {
    return false;
  }
}
