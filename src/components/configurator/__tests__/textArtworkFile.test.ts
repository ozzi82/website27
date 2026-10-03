import { describe, it, expect, vi } from "vitest";
import { buildTextArtworkSvg, pathBounds, textArtworkFileName, createTextArtworkFile } from "../textArtworkFile";
import { generateTextArtworkFile } from "../textArtwork";
import { loadFont } from "../fontLoader";
import { parseSvg } from "../parseSvg";
import { loadMontserrat } from "./helpers/loadTestFont";

vi.mock("../fontLoader", () => ({ loadFont: vi.fn() }));

describe("pathBounds", () => {
  it("covers every point of an absolute path (lines, quadratics, cubics)", () => {
    const b = pathBounds("M10 20 L30 5 Q50 60 70 20 C80 -10 90 100 100 40 Z");
    expect(b).toEqual({ minX: 10, minY: -10, maxX: 100, maxY: 100 });
  });

  it("handles decimals, negatives and exponents", () => {
    expect(pathBounds("M-1.5 2.25 L3e1 -4.5Z")).toEqual({ minX: -1.5, minY: -4.5, maxX: 30, maxY: 2.25 });
  });

  it("is null for an empty path", () => {
    expect(pathBounds("")).toBeNull();
    expect(pathBounds("Z")).toBeNull();
  });
});

describe("textArtworkFileName", () => {
  it("is sunlite-text-<slug>.svg", () => {
    expect(textArtworkFileName("Open Late")).toBe("sunlite-text-open-late.svg");
  });

  it("flattens lines, accents and punctuation, and trims the dashes", () => {
    expect(textArtworkFileName("  Café  Ré\nSumé! ")).toBe("sunlite-text-cafe-re-sume.svg");
  });

  it("caps the length and has a fallback when nothing usable remains", () => {
    expect(textArtworkFileName("a".repeat(200)).length).toBeLessThanOrEqual("sunlite-text-.svg".length + 32);
    expect(textArtworkFileName("★★★")).toBe("sunlite-text-text.svg");
  });
});

describe("buildTextArtworkSvg", () => {
  const pathData = "M10 20 L110 20 L110 80 L10 80 Z M30 40 L30 60 L90 60 L90 40 Z";

  it("is a standalone SVG with the path and a viewBox that fits it", () => {
    const svg = buildTextArtworkSvg({ pathData, text: "Hi", fontLabel: "Montserrat" })!;
    expect(svg.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox="10 20 100 60"');
    expect(svg).toContain('width="100" height="60"');
    expect(svg).toContain(`d="${pathData}"`);
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    expect(doc.querySelector("parsererror")).toBeNull();
    expect(doc.documentElement.nodeName).toBe("svg");
  });

  it("escapes the text it quotes in the title and drops control characters", () => {
    const svg = buildTextArtworkSvg({ pathData, text: 'A & B <"x">\nC\u0007', fontLabel: "Montserrat" })!;
    expect(svg).toContain("A &amp; B &lt;&quot;x&quot;&gt; / C");
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    expect(doc.querySelector("parsererror")).toBeNull();
  });

  it("returns null for an empty path", () => {
    expect(buildTextArtworkSvg({ pathData: "", text: "x", fontLabel: "F" })).toBeNull();
  });
});

describe("createTextArtworkFile", () => {
  const font = loadMontserrat();

  it("makes a real SVG file of the text outlines, named after the text", async () => {
    const file = createTextArtworkFile("Sunlite", font, "Montserrat")!;
    expect(file.name).toBe("sunlite-text-sunlite.svg");
    expect(file.type).toBe("image/svg+xml");
    expect(file.size).toBeGreaterThan(500);
    const svg = await file.text();
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    expect(doc.querySelector("parsererror")).toBeNull();
    const [x, y, w, h] = doc.documentElement.getAttribute("viewBox")!.split(" ").map(Number);
    expect(w).toBeGreaterThan(h); // one line of seven letters is wider than tall
    expect([x, y, w, h].every(Number.isFinite)).toBe(true);
  });

  it("round-trips through the configurator's own SVG parser, with the counters kept as holes", async () => {
    const svg = await createTextArtworkFile("O", font, "Montserrat")!.text();
    const shapes = parseSvg(svg);
    expect(shapes.length).toBeGreaterThan(0);
    expect(shapes.some((s) => s.holes.length > 0)).toBe(true);
  });

  it("is null for text with nothing drawable", () => {
    expect(createTextArtworkFile("   ", font, "Montserrat")).toBeNull();
    expect(createTextArtworkFile("\u{1F600}", font, "Montserrat")).toBeNull();
  });
});

describe("generateTextArtworkFile", () => {
  it("loads the chosen font and returns the file", async () => {
    vi.mocked(loadFont).mockResolvedValue(loadMontserrat());
    const file = await generateTextArtworkFile("Open", "pacifico");
    expect(loadFont).toHaveBeenCalledWith("pacifico");
    expect(file?.name).toBe("sunlite-text-open.svg");
  });

  it("is null, never a throw, when the font cannot load", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(loadFont).mockRejectedValue(new Error("offline"));
    expect(await generateTextArtworkFile("Open", "pacifico")).toBeNull();
  });
});
