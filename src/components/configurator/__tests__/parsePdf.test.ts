import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as THREE from "three";
import { parsePdf } from "../parsePdf";
import { ParseError, NoVectorPathsFoundError } from "../parseErrors";

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
    // Important: this asserts the LOCAL coordinates actually baked into the
    // flat draw-op array (a 0..100 square), NOT the fixture's nominal page
    // position (x:50..150, y:50..150). pdf-lib's drawRectangle() wraps its
    // path in a content-stream `cm` transform to position it — e.g. a
    // "1 0 0 1 50 50 cm" placing a locally-drawn 0..100 square at page
    // position 50..150 — and parsePdf.ts does NOT track nested `cm`/`q`/`Q`
    // transforms (this is "Known v1 limitation #1" above). So the flat array
    // itself decodes to a square at LOCAL (0,0)-(100,100), and only the
    // page-level viewport transform (not the `cm`) is applied on top of that.
    // For this fixture's 200x200 page, the default viewport flips Y and
    // translates by the page height, turning local y:[0,100] into screen
    // y:[100,200], while x is unaffected (x:[0,100] stays [0,100]). This
    // test's job is narrowly to confirm the opcode-decoding math is correct
    // within that known scope — it is not a claim that the shape ends up in
    // the fixture's intended page position (it doesn't, per the limitation).
    const shapes = await parsePdf(loadFixture("vector-sample.pdf"));
    const points = shapes[0].getPoints();
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    expect(Math.min(...xs)).toBeCloseTo(0, 0);
    expect(Math.max(...xs)).toBeCloseTo(100, 0);
    expect(Math.min(...ys)).toBeCloseTo(100, 0);
    expect(Math.max(...ys)).toBeCloseTo(200, 0);
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
});
