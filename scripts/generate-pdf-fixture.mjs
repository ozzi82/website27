import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { writeFile } from "fs/promises";

const doc = await PDFDocument.create();
const page = doc.addPage([200, 200]);

// A simple filled square with a square hole in the middle — gives the later
// parsing pipeline (Chunk 2) both an outer and an inner path to work with,
// similar in shape to a letter with a counter (e.g. "O").
page.drawRectangle({
  x: 50,
  y: 50,
  width: 100,
  height: 100,
  color: rgb(0.1, 0.1, 0.1),
});
page.drawRectangle({
  x: 80,
  y: 80,
  width: 40,
  height: 40,
  color: rgb(1, 1, 1),
});

const bytes = await doc.save();
await writeFile(
  new URL("../src/components/configurator/__tests__/fixtures/vector-sample.pdf", import.meta.url),
  bytes
);
console.log("Wrote vector-sample.pdf");

const blankDoc = await PDFDocument.create();
blankDoc.addPage([200, 200]); // a page with no drawing operators at all
const blankBytes = await blankDoc.save();
await writeFile(
  new URL("../src/components/configurator/__tests__/fixtures/blank-page.pdf", import.meta.url),
  blankBytes
);
console.log("Wrote blank-page.pdf");

// Live (un-outlined) text: parsePdf must reject this rather than silently drop
// the letters, since text-show operators carry no outlines to extrude.
const textDoc = await PDFDocument.create();
const textPage = textDoc.addPage([200, 200]);
const helvetica = await textDoc.embedFont(StandardFonts.Helvetica);
textPage.drawText("SUN", { x: 40, y: 80, size: 48, font: helvetica, color: rgb(0, 0, 0) });
const textBytes = await textDoc.save();
await writeFile(
  new URL("../src/components/configurator/__tests__/fixtures/live-text.pdf", import.meta.url),
  textBytes
);
console.log("Wrote live-text.pdf");
