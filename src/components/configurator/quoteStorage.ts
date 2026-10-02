export interface SummaryRow {
  label: string;
  value: string;
  /** Hex colour to show as a small chip beside the value. */
  swatch?: string;
}

/** What "Get a Quote" hands to the contact page. */
export interface QuoteSnapshot {
  v: 1;
  /** Plain-text summary (what is copied and what prefills the form). */
  summary: string;
  rows: SummaryRow[];
  /** Small JPEG snapshot of the 3D preview, or null when it could not be captured. */
  image: string | null;
  savedAt: number;
}

const KEY = "sls.quote.v1";

/** Saved in sessionStorage as well as router state, so a refresh of /contact keeps the card. Never throws. */
export function saveQuote(quote: QuoteSnapshot): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(quote));
    return;
  } catch {
    // Most likely the image pushed it over the quota: keep the text, drop the picture.
  }
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...quote, image: null }));
  } catch {
    // Storage is unavailable (private mode etc.); router state still carries the quote for this visit.
  }
}

export function isQuoteSnapshot(value: unknown): value is QuoteSnapshot {
  const q = value as Partial<QuoteSnapshot> | null;
  return (
    !!q &&
    typeof q === "object" &&
    q.v === 1 &&
    typeof q.summary === "string" &&
    Array.isArray(q.rows) &&
    q.rows.every((r) => r && typeof r.label === "string" && typeof r.value === "string") &&
    (q.image === null || typeof q.image === "string")
  );
}

export function loadQuote(): QuoteSnapshot | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isQuoteSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearQuote(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}
