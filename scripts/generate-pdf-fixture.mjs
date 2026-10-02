import { PDFDocument, rgb } from "pdf-lib";
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
