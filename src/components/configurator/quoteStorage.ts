export interface SummaryRow {
  label: string;
  value: string;
  /** Hex colour to show as a small chip beside the value. */
  swatch?: string;
}

/** The artwork file that travels with a quote (its bytes live in IndexedDB, see artworkFileStorage.ts). */
export interface ArtworkFileMeta {
  name: string;
  size: number;
  /** True when we made the file (the SVG of typed text) rather than the visitor uploading it. */
  generated: boolean;
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
  /** Set when the artwork file was stored and should be attached to the contact form. */
  artworkFile?: ArtworkFileMeta | null;
}

/** The IndexedDB key of this quote's artwork file. */
export function quoteFileId(quote: Pick<QuoteSnapshot, "savedAt">): string {
  return String(quote.savedAt);
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

function isArtworkFileMeta(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  const m = value as Partial<ArtworkFileMeta>;
  return typeof m === "object" && typeof m.name === "string" && typeof m.size === "number" && typeof m.generated === "boolean";
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
    (q.image === null || typeof q.image === "string") &&
    isArtworkFileMeta(q.artworkFile)
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
