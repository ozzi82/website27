import { describe, it, expect, vi, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as THREE from "three";
import { parsePdf } from "../parsePdf";
import { ParseError, NoVectorPathsFoundError, TextNotOutlinedError } from "../parseErrors";
import { buildPdf } from "./helpers/buildPdf";

function loadFixture(name: string): Uint8Array {
  return new Uint8Array(fs.readFileSync(path.join(__dirname, "fixtures", name)));
}

describe("parsePdf", () => {
  it("parses the vector fixture (two nested rectangles) into shapes", async () => {
    const shapes = await parsePdf(loadFixture("vector-sample.pdf"));
    expect(shapes.length).toBeGreaterThan(0);
    for (const shape of shapes) {
      expect(shape).toBeInstanceOf(THREE.Shape);
    }
  });

  it("decodes actual coordinates from the flat draw-op array, not just a non-empty result", async () => {
    // Regression guard: a shapes.length > 0 check alone would still pass even
    // if coordinate extraction were subtly wrong (e.g. only reading every
    // other point).
    //
    // pdf-lib's drawRectangle() wraps its path in a content-stream `cm`
    // ("1 0 0 1 50 50 cm") placing a locally-drawn 0..100 square at page
    // position 50..150. The flat draw-op array only holds the LOCAL 0..100
    // square, so the cm has to be applied on top for the shape to land where
    // the PDF puts it. On this 200x200 page the viewport flips Y, so page
    // y:[50,150] becomes screen y:[50,150] and x stays [50,150].
    const shapes = await parsePdf(loadFixture("vector-sample.pdf"));
    const points = shapes[0].getPoints();
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    expect(Math.min(...xs)).toBeCloseTo(50, 0);
    expect(Math.max(...xs)).toBeCloseTo(150, 0);
    expect(Math.min(...ys)).toBeCloseTo(50, 0);
    expect(Math.max(...ys)).toBeCloseTo(150, 0);
  });

  it("throws ParseError for a corrupt/garbage file", async () => {
    const garbage = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]);
    await expect(parsePdf(garbage)).rejects.toThrow(ParseError);
  });

  it("throws NoVectorPathsFoundError for a PDF with no path content", async () => {
    // A minimal valid PDF with a page but no drawing operators at all.
    const blankPdfFixture = loadFixture("blank-page.pdf");
    await expect(parsePdf(blankPdfFixture)).rejects.toThrow(NoVectorPathsFoundError);
  });

  it("throws TextNotOutlinedError for a PDF containing live (un-outlined) text", async () => {
    // Live text isn't extruded, so fail loudly instead of silently dropping letters.
    await expect(parsePdf(loadFixture("live-text.pdf"))).rejects.toThrow(TextNotOutlinedError);
  });
});

// Regression suite for the generic "Something went wrong reading that file"
// error: each of these streams used to make extraction throw a raw TypeError
// (not one of the typed parse errors), so the UI fell through to the generic
// message instead of the specific guidance.
describe("parsePdf degenerate content streams", () => {
  // A normal filled artwork shape the degenerate operators are mixed with.
  const ART = "0.9 0.1 0.1 rg 50 50 m 200 50 l 200 150 l 50 150 l h f\n";

  afterEach(() => vi.restoreAllMocks());

  it.each([
    ["a stray endPath (n) with no path under construction", ART + "n\n"],
    ["a stray fill (f) with no path", ART + "f\n"],
    ["a stray stroke (S) with no path", ART + "S\n"],
    ["a lone moveTo subpath that never draws anything", "30 30 m 60 60 m\n" + ART],
    ["a moveTo immediately followed by closePath", "20 20 m h\n" + ART],
  ])("still extracts the artwork when the stream has %s", async (_label, content) => {
    const shapes = await parsePdf(buildPdf(content));
    expect(shapes).toHaveLength(1);
    const xs = shapes[0].getPoints().map((p) => p.x);
    expect(Math.min(...xs)).toBeCloseTo(50, 0);
    expect(Math.max(...xs)).toBeCloseTo(200, 0);
  });

  it.each([
    ["only an empty-path paint op", "n\n"],
    ["only a degenerate moveTo+closePath", "20 20 m h f\n"],
  ])("reports NoVectorPathsFoundError (not a TypeError) when the stream has %s", async (_label, content) => {
    await expect(parsePdf(buildPdf(content))).rejects.toThrow(NoVectorPathsFoundError);
  });

  it("surfaces any unexpected extraction failure as a typed ParseError", async () => {
    vi.spyOn(THREE.Path.prototype, "moveTo").mockImplementation(() => {
      throw new TypeError("boom");
    });
    await expect(parsePdf(buildPdf(ART))).rejects.toThrow(ParseError);
  });
});

// pdf.js hands back path coordinates in each operator's LOCAL space; the CTM
// built from cm / q / Q / Form XObject matrices has to be applied on top of the
// page viewport transform, otherwise Skia (Chrome) and Illustrator-style PDFs,
// which wrap everything in a Y-flipping `cm`, come out mirrored and misplaced.
describe("parsePdf content-stream transforms and paint semantics", () => {
  const square = (x: number, y: number, w: number, h: number) =>
    `${x} ${y} m ${x + w} ${y} l ${x + w} ${y + h} l ${x} ${y + h} l h`;

  function bounds(shape: THREE.Shape) {
    const pts = shape.getPoints();
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  }

  it("applies a Y-flipping cm (Skia/Chrome style) so artwork lands where it was drawn", async () => {
    // Drawn at 100..200 x 50..150 in top-left-origin coordinates inside a flip cm.
    const content = `q 1 0 0 -1 0 250 cm\n0.1 0.1 0.1 rg ${square(100, 50, 100, 100)} f\nQ\n`;
    const [shape] = await parsePdf(buildPdf(content));
    const b = bounds(shape);
    expect(b.x0).toBeCloseTo(100, 0);
    expect(b.x1).toBeCloseTo(200, 0);
    expect(b.y0).toBeCloseTo(50, 0);
    expect(b.y1).toBeCloseTo(150, 0);
  });

  it("composes nested cm operators (later cm applies first)", async () => {
    const content = `q 0.5 0 0 0.5 0 0 cm 1 0 0 1 100 100 cm ${square(0, 0, 100, 100)} f Q\n`;
    const [shape] = await parsePdf(buildPdf(content));
    const b = bounds(shape);
    // translate (100,100) then scale 0.5 => page 50..100; viewport flips Y => 150..200
    expect(b.x0).toBeCloseTo(50, 0);
    expect(b.x1).toBeCloseTo(100, 0);
    expect(b.y0).toBeCloseTo(150, 0);
    expect(b.y1).toBeCloseTo(200, 0);
  });

  it("restores the transform at Q so later artwork is unaffected", async () => {
    const content = `q 2 0 0 2 0 0 cm ${square(10, 10, 20, 20)} f Q\n${square(100, 100, 50, 50)} f\n`;
    const shapes = await parsePdf(buildPdf(content));
    expect(shapes).toHaveLength(2);
    expect(bounds(shapes[0]).x0).toBeCloseTo(20, 0);
    expect(bounds(shapes[0]).x1).toBeCloseTo(60, 0);
    expect(bounds(shapes[1]).x0).toBeCloseTo(100, 0);
    expect(bounds(shapes[1]).x1).toBeCloseTo(150, 0);
  });

  it("applies a Form XObject's /Matrix and the cm it is drawn under", async () => {
    const form = { dict: "/Type/XObject/Subtype/Form/BBox[0 0 300 200]/Matrix[1 0 0 1 10 10]", stream: `0.8 0.1 0.1 rg ${square(0, 0, 50, 50)} f` };
    const pdf = buildPdf("q 1 0 0 1 80 30 cm /Fm0 Do Q\n", {
      resources: "/XObject<</Fm0 5 0 R>>",
      extraObjects: [form],
    });
    const [shape] = await parsePdf(pdf);
    const b = bounds(shape);
    // form-local 0..50 + Matrix(10,10) + cm(80,30) => page x 90..140, y 40..90 => screen y 160..210
    expect(b.x0).toBeCloseTo(90, 0);
    expect(b.x1).toBeCloseTo(140, 0);
    expect(b.y0).toBeCloseTo(160, 0);
    expect(b.y1).toBeCloseTo(210, 0);
  });

  it("handles a transparency-group Form XObject (Illustrator/InDesign style) with a flip cm", async () => {
    const form = {
      dict: "/Type/XObject/Subtype/Form/BBox[0 0 400 250]/Group<</S/Transparency/CS/DeviceRGB>>",
      stream: `0.9 0.5 0.1 rg ${square(80, 40, 100, 100)} f\n`,
    };
    const pdf = buildPdf("q 1 0 0 -1 0 250 cm /Fm0 Do Q\n", {
      resources: "/XObject<</Fm0 5 0 R>>",
      extraObjects: [form],
    });
    const [shape] = await parsePdf(pdf);
    const b = bounds(shape);
    expect(b.x0).toBeCloseTo(80, 0);
    expect(b.x1).toBeCloseTo(180, 0);
    expect(b.y0).toBeCloseTo(40, 0);
    expect(b.y1).toBeCloseTo(140, 0);
  });

  it("places artwork correctly on a /Rotate 90 page with a non-zero MediaBox origin", async () => {
    const pdf = buildPdf(`${square(150, 120, 50, 40)} f\n`, {
      mediaBox: "100 100 300 200",
      pageExtras: "/Rotate 90",
    });
    const [shape] = await parsePdf(pdf);
    const b = bounds(shape);
    // box-relative (50..100, 20..60) rotated 90deg clockwise => screen x 20..60, y 50..100
    expect(b.x0).toBeCloseTo(20, 0);
    expect(b.x1).toBeCloseTo(60, 0);
    expect(b.y0).toBeCloseTo(50, 0);
    expect(b.y1).toBeCloseTo(100, 0);
  });

  it("does not turn clip paths (re W n) into artwork", async () => {
    const content = `q 0 0 400 250 re W n\n0.9 0.1 0.1 rg ${square(50, 50, 100, 100)} f\nQ\n`;
    const shapes = await parsePdf(buildPdf(content));
    expect(shapes).toHaveLength(1);
    expect(bounds(shapes[0]).x1).toBeCloseTo(150, 0);
  });

  it("reports NoVectorPathsFoundError for a stream that only clips and paints an image", async () => {
    await expect(parsePdf(loadFixture("chrome-raster-only.pdf"))).rejects.toThrow(NoVectorPathsFoundError);
  });

  it("ignores stroke-only paths (a centreline is not a fillable outline)", async () => {
    const content = `4 w 50 50 m 200 150 l S\n50 50 100 100 re S\n`;
    await expect(parsePdf(buildPdf(content))).rejects.toThrow(NoVectorPathsFoundError);
  });

  it("keeps the fill of fill+stroke paths", async () => {
    const shapes = await parsePdf(buildPdf(`4 w 50 50 100 100 re B\n`));
    expect(shapes).toHaveLength(1);
  });

  it("drops a page-sized background rectangle when there is other artwork", async () => {
    const content = `0.1 0.2 0.4 rg 0 0 400 250 re f\n0.9 0.1 0.1 rg ${square(50, 50, 100, 100)} f\n`;
    const shapes = await parsePdf(buildPdf(content));
    expect(shapes).toHaveLength(1);
    expect(bounds(shapes[0]).x1).toBeCloseTo(150, 0);
  });

  it("keeps a page-sized rectangle when it is the only artwork", async () => {
    const shapes = await parsePdf(buildPdf(`0.1 0.2 0.4 rg 0 0 400 250 re f\n`));
    expect(shapes).toHaveLength(1);
  });

  it("turns the inner subpath of a compound path (the counter of an O) into a hole", async () => {
    const outer = "100 50 m 300 50 l 300 200 l 100 200 l h";
    const inner = "150 100 m 150 150 l 250 150 l 250 100 l h"; // opposite winding
    const shapes = await parsePdf(buildPdf(`${outer} ${inner} f\n`));
    expect(shapes).toHaveLength(1);
    expect(shapes[0].holes).toHaveLength(1);
  });

  it("splits an even-odd compound path by nesting even when every subpath winds the same way", async () => {
    // Same winding for outer and inner: a winding-based classifier would call
    // the inner one a second solid; even-odd (f*) makes it a counter.
    const outer = "100 50 m 300 50 l 300 200 l 100 200 l h";
    const inner = "150 80 m 250 80 l 250 170 l 150 170 l h";
    const island = "180 110 m 220 110 l 220 140 l 180 140 l h"; // inside the counter => solid again
    const shapes = await parsePdf(buildPdf(`${outer} ${inner} ${island} f*
`));
    expect(shapes).toHaveLength(2);
    const holed = shapes.find((s) => s.holes.length > 0)!;
    expect(holed.holes).toHaveLength(1);
    expect(shapes.filter((s) => s.holes.length === 0)).toHaveLength(1);
  });
});

describe("parsePdf on a real Chrome (Skia) printToPDF logo", () => {
  // Fixture: an inline SVG logo (rect background, an "O" with a counter, an
  // "S" with curves, an "L" and a "U") printed with Page.printToPDF. Skia wraps
  // the page in a flipping cm and emits clip rectangles and nested transforms.
  it("extracts the four letters upright and in left-to-right order, without the background", async () => {
    const shapes = await parsePdf(loadFixture("chrome-logo.pdf"));
    expect(shapes).toHaveLength(4);
    const cx = shapes.map((s) => {
      const b = new THREE.Box2().setFromPoints(s.getPoints());
      return b.getCenter(new THREE.Vector2()).x;
    });
    expect(cx).toEqual([...cx].sort((p, q) => p - q));
    expect(shapes[0].holes).toHaveLength(1); // the O's counter

    // L (third shape): a tall stem with a foot along the BOTTOM. In top-left
    // screen coordinates (y down) the bottom is the larger y.
    const pts = shapes[2].getPoints();
    const ys = pts.map((p) => p.y);
    const [top, bottom] = [Math.min(...ys), Math.max(...ys)];
    const spanAt = (y: number) => {
      const xs = pts.filter((p) => Math.abs(p.y - y) < (bottom - top) * 0.1).map((p) => p.x);
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(spanAt(bottom)).toBeGreaterThan(spanAt(top) * 2);
  });
});
