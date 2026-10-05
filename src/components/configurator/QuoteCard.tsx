import { DISCLAIMER_TEXT } from "./disclaimer";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Copy, Download, Paperclip, X } from "lucide-react";
import type { ArtworkFileMeta, QuoteSnapshot } from "./quoteStorage";

/** Where the artwork file stands in the contact form (see ContactForm's AttachmentStatus). */
export type ArtworkAttachStatus = "none" | "waiting" | "attached" | "detached" | "failed";

interface QuoteCardProps {
  quote: QuoteSnapshot;
  onClear: () => void;
  /** The artwork file that travels with the quote, once loaded, and what became of attaching it to the form. */
  artwork?: { meta: ArtworkFileMeta; file: File; status: ArtworkAttachStatus } | null;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** A link that downloads the artwork file (an object URL, revoked when the card goes away). */
function DownloadLink({ file, className, children }: { file: File; className: string; children: ReactNode }) {
  const [href, setHref] = useState<string | null>(null);
  useEffect(() => {
    if (typeof URL.createObjectURL !== "function") return;
    const url = URL.createObjectURL(file);
    setHref(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  if (!href) return null;
  return (
    <a href={href} download={file.name} className={className}>
      {children}
    </a>
  );
}

/** The artwork file that goes with the quote: attached to the form, or, if that did not work, ready to download. */
function ArtworkFileNotice({ meta, file, status }: NonNullable<QuoteCardProps["artwork"]>) {
  const name = (
    <>
      <strong className="break-words font-medium">{file.name}</strong> <span className="text-muted-foreground">({formatSize(file.size)})</span>
      {meta.generated && <span className="text-muted-foreground"> · made from your text</span>}
    </>
  );
  const link = "inline-flex items-center gap-1.5 font-medium underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";

  if (status === "failed" || status === "detached") {
    return (
      <div role="status" className="mt-4 rounded-lg border border-amber-500/60 bg-amber-500/10 p-3 text-sm">
        <p>
          {status === "failed"
            ? "We couldn’t attach your artwork to the form automatically."
            : "Your artwork isn’t attached, because the form’s file field has a different file."}{" "}
          Your file: {name}
        </p>
        <DownloadLink
          file={file}
          className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Download aria-hidden="true" className="h-4 w-4" />
          Download your artwork file
        </DownloadLink>
        <p className="mt-1.5 text-xs text-muted-foreground">Choose it in the “Upload your file here” field of the form below.</p>
      </div>
    );
  }

  return (
    <div role="status" className="mt-4 text-sm">
      <p className="flex items-start gap-2">
        <Paperclip aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span className="min-w-0">
          {status === "attached" ? "Artwork attached: " : "Artwork ready: "}
          {name}
        </span>
      </p>
      <p className="ml-6 text-xs text-muted-foreground">
        {status === "attached" ? (
          <>
            It will be sent with the form below.{" "}
            <DownloadLink file={file} className={`${link} text-muted-foreground hover:text-foreground`}>
              Download a copy
            </DownloadLink>
          </>
        ) : (
          "Attaching it to the form below…"
        )}
      </p>
    </div>
  );
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fall back for insecure contexts / denied permission.
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** "Your configuration" on the contact page: what the visitor built in the configurator, with a snapshot of it. */
export default function QuoteCard({ quote, onClear, artwork = null }: QuoteCardProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    setStatus((await writeClipboard(quote.summary)) ? "copied" : "failed");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 2500);
  }

  return (
    <section aria-labelledby="quote-card-title" className="mb-10 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 id="quote-card-title" className="text-lg font-semibold">
            Your configuration
          </h2>
          <p className="text-xs text-muted-foreground">From the sign configurator. It is added to your request below, so we can quote it.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        {quote.image && (
          <img
            src={quote.image}
            alt="Preview of your configured sign"
            className="aspect-[4/3] w-full rounded-lg border border-border bg-background object-cover sm:w-56 sm:self-start"
          />
        )}
        <dl className="min-w-0 flex-1 space-y-1.5 text-sm">
          {quote.rows.map((r) => (
            <div key={r.label} className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-3">
              <dt className="text-muted-foreground">{r.label}</dt>
              <dd className="flex min-w-0 items-center gap-2 break-words">
                {r.swatch && (
                  <span aria-hidden="true" className="h-4 w-4 shrink-0 rounded-full border border-border" style={{ backgroundColor: r.swatch }} />
                )}
                <span className="min-w-0">{r.value}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="mt-3 text-[11px] leading-snug text-muted-foreground">{DISCLAIMER_TEXT}</p>

      {artwork && <ArtworkFileNotice {...artwork} />}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          {status === "copied" ? <Check aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
          Copy summary
        </button>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <X aria-hidden="true" className="h-4 w-4" />
          Clear
        </button>
        <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
          {status === "copied" && "Copied to the clipboard."}
          {status === "failed" && "Couldn’t copy automatically. Select the text above and copy it."}
        </p>
      </div>
    </section>
  );
}
