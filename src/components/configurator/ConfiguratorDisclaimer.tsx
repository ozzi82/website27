import { DISCLAIMER_TEXT } from "./disclaimer";

/** The standing caveat of the preview, shown beside the quote button: this is for showing purposes, not an orderable design. */
export default function ConfiguratorDisclaimer() {
  return (
    <p role="note" className="text-[11px] leading-snug text-muted-foreground">
      {DISCLAIMER_TEXT}
    </p>
  );
}
