import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// Confirmed against pdfjs-dist@6.3.289: SVGGraphics is not exported. The spec's
// named fallback (parse via getOperatorList() instead of an SVG intermediate
// step) is what Chunk 2's real PDF parsing is built on. This test exists so a
// future pdfjs-dist upgrade that silently restores SVGGraphics gets caught —
// if this test starts failing, SVGGraphics is back and the pipeline could be
// simplified.
//
// No worker setup needed below: pdf.js detects it's running under Node (via
// `typeof process === "object"`) and automatically disables the Web Worker,
// falling back to an in-process "fake worker" — this is pdf.js's own built-in
// behavior, not something this test configures.
describe("pdf.js PDF-parsing feasibility", () => {
  it("does not export SVGGraphics in the installed version", () => {
    expect((pdfjsLib as unknown as Record<string, unknown>).SVGGraphics).toBeUndefined();
  });

  it("can load a real PDF and read its operator list", async () => {
    const fixturePath = path.join(__dirname, "fixtures", "vector-sample.pdf");
    const data = new Uint8Array(fs.readFileSync(fixturePath));

    const doc = await pdfjsLib.getDocument({ data }).promise;
    const page = await doc.getPage(1);
    const opList = await page.getOperatorList();

    expect(opList.fnArray.length).toBeGreaterThan(0);
    // OPS.constructPath is the operator Chunk 2's real parser will look for
    // to extract path geometry — confirm at least one is present in our
    // two-rectangle fixture.
    expect(opList.fnArray).toContain(pdfjsLib.OPS.constructPath);
  });
});
