/**
 * The "Company type" answer on the quote page (brief section 10). The HubSpot form has no such field (its fields are
 * company name, name, email, message and a file), so the answer travels in the message ("Company type: Sign Company"),
 * and is also written into a form field named `company_type` if the owner adds one in HubSpot.
 */
export const COMPANY_TYPES = ["Sign Company", "Sign Installer", "Agency / Broker", "Architect / Contractor", "Other Trade Professional"] as const;
export type CompanyType = (typeof COMPANY_TYPES)[number];

export const isCompanyType = (value: unknown): value is CompanyType => typeof value === "string" && (COMPANY_TYPES as readonly string[]).includes(value);

/** The name of the HubSpot property/field to fill when the form has one. */
export const COMPANY_TYPE_FIELD_NAME = "company_type";

/** The line added to the message: "Company type: Sign Company". Empty when nothing is chosen. */
export const companyTypeLine = (type: CompanyType | null): string => (type ? `Company type: ${type}` : "");

/** The text the message field is prefilled with: the company-type line, then the configurator summary, if any. */
export function composePrefill(type: CompanyType | null, summary: string | null | undefined): string | null {
  const parts = [companyTypeLine(type), summary?.trim() ?? ""].filter(Boolean);
  return parts.length ? parts.join("\n\n") : null;
}

const KEY = "sls.companyType.v1";

/** Reads the remembered choice (sessionStorage); null when none, invalid or storage is unavailable. */
export function loadCompanyType(): CompanyType | null {
  try {
    const value = sessionStorage.getItem(KEY);
    return isCompanyType(value) ? value : null;
  } catch {
    return null;
  }
}

/** Remembers the choice for this tab; null forgets it. Never throws. */
export function saveCompanyType(type: CompanyType | null): void {
  try {
    if (type) sessionStorage.setItem(KEY, type);
    else sessionStorage.removeItem(KEY);
  } catch {
    // storage unavailable (private mode etc.): the choice simply is not remembered
  }
}
