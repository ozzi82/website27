/**
 * Builds a minimal, valid, uncompressed single-page PDF from a raw content
 * stream, so tests can exercise exact operator sequences (clips, nested cm,
 * Form XObjects, empty-path paints...) without any PDF library. Everything is
 * ASCII, so string length equals byte length for /Length and the xref table.
 */
export interface BuildPdfOptions {
  /** MediaBox as "llx lly urx ury". */
  mediaBox?: string;
  /** Extra entries spliced into the /Page dictionary, e.g. "/Rotate 90". */
  pageExtras?: string;
  /** Page /Resources dictionary body (the part between << and >>). */
  resources?: string;
  /** Extra indirect objects, numbered from 5 (object 4 is the content stream). */
  extraObjects?: Array<string | { dict: string; stream: string }>;
}

export function buildPdf(content: string, opts: BuildPdfOptions = {}): Uint8Array {
  const { mediaBox = "0 0 400 250", pageExtras = "", resources = "", extraObjects = [] } = opts;
  const objects: Array<string | { dict: string; stream: string }> = [
    "<</Type/Catalog/Pages 2 0 R>>",
    "<</Type/Pages/Kids[3 0 R]/Count 1>>",
    `<</Type/Page/Parent 2 0 R/MediaBox[${mediaBox}]/Contents 4 0 R/Resources<<${resources}>>${pageExtras}>>`,
    { dict: "", stream: content },
    ...extraObjects,
  ];

  let out = "%PDF-1.7\n";
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(out.length);
    out +=
      typeof obj === "string"
        ? `${i + 1} 0 obj\n${obj}\nendobj\n`
        : `${i + 1} 0 obj\n<<${obj.dict}/Length ${obj.stream.length}>>\nstream\n${obj.stream}\nendstream\nendobj\n`;
  });
  const xrefAt = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xrefAt}\n%%EOF\n`;
  return Uint8Array.from(out, (ch) => ch.charCodeAt(0));
}
