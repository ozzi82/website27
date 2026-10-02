import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as THREE from "three";
import { parseArtwork } from "../parseArtwork";
import { UnsupportedFormatError, FileTooLargeError } from "../parseErrors";

function fixtureFile(name: string, mimeType: string): File {
  const bytes = fs.readFileSync(path.join(__dirname, "fixtures", name));
  return new File([bytes], name, { type: mimeType });
}

describe("parseArtwork", () => {
  it("parses a valid SVG file", async () => {
    const svgText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M1 1 H9 V9 H1 Z" /></svg>`;
    const file = new File([svgText], "logo.svg", { type: "image/svg+xml" });
    const shapes = await parseArtwork(file);
    expect(shapes.length).toBe(1);
  });

  it("returns shapes normalized to the preview coordinate space", async () => {
    const svgText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 120"><rect x="10" y="10" width="260" height="100" /></svg>`;
    const file = new File([svgText], "logo.svg", { type: "image/svg+xml" });
    const shapes = await parseArtwork(file);
    const box = new THREE.Box2().setFromPoints(shapes.flatMap((s) => s.getPoints(12)));
    expect(box.getCenter(new THREE.Vector2()).length()).toBeCloseTo(0, 5);
    expect(box.getSize(new THREE.Vector2()).x).toBeCloseTo(2.4, 5);
  });

  it("parses a valid PDF file", async () => {
    const file = fixtureFile("vector-sample.pdf", "application/pdf");
    const shapes = await parseArtwork(file);
    expect(shapes.length).toBeGreaterThan(0);
  });

  it("rejects an unsupported file extension before attempting to parse", async () => {
    const file = new File(["not a logo"], "logo.png", { type: "image/png" });
    await expect(parseArtwork(file)).rejects.toThrow(UnsupportedFormatError);
  });

  it("rejects a file over the size cap before attempting to parse", async () => {
    const bigContent = new Uint8Array(10 * 1024 * 1024 + 1);
    const file = new File([bigContent], "logo.svg", { type: "image/svg+xml" });
    await expect(parseArtwork(file)).rejects.toThrow(FileTooLargeError);
  });
});
