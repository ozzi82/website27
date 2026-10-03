import { COMPANY_TYPES, isCompanyType, type CompanyType } from "../lib/companyType";

interface CompanyTypeSelectProps {
  value: CompanyType | null;
  onChange: (value: CompanyType | null) => void;
}

/**
 * "Company type" for the quote form: a native select (accessible by default, good on phones), optional, with a
 * neutral first option. Sits directly above the HubSpot form; its value is added to the message and, if the form
 * has a `company_type` field, to that field (see ContactForm).
 */
export default function CompanyTypeSelect({ value, onChange }: CompanyTypeSelectProps) {
  return (
    <div className="mb-6">
      <label htmlFor="company-type" className="mono-label text-muted-foreground block mb-2">
        Company type <span className="normal-case tracking-normal">(optional)</span>
      </label>
      <div className="relative">
        <select
          id="company-type"
          name="company-type"
          value={value ?? ""}
          onChange={(e) => onChange(isCompanyType(e.target.value) ? e.target.value : null)}
          className="h-12 w-full appearance-none rounded-md border border-border bg-card px-4 pr-10 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <option value="">Select your company type</option>
          {COMPANY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <svg aria-hidden="true" viewBox="0 0 12 8" className="pointer-events-none absolute right-4 top-1/2 h-2 w-3 -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 1.5 6 6.5 11 1.5" />
        </svg>
      </div>
    </div>
  );
}
