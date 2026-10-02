import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateTextShapes } from "../textArtwork";
import { TextRenderError } from "../textToShapes";
import { loadFont } from "../fontLoader";
import { loadMontserrat } from "./helpers/loadTestFont";

vi.mock("../fontLoader", () => ({ loadFont: vi.fn() }));

describe("generateTextShapes", () => {
  beforeEach(() => {
    vi.mocked(loadFont).mockReset();
    vi.mocked(loadFont).mockResolvedValue(loadMontserrat());
  });

  it("returns no shapes for empty or whitespace-only text without loading a font", async () => {
    expect(await generateTextShapes("", "montserrat")).toEqual({ shapes: null, skipped: [] });
    expect(await generateTextShapes("  \n ", "montserrat")).toEqual({ shapes: null, skipped: [] });
    expect(loadFont).not.toHaveBeenCalled();
  });

  it("loads the chosen font and returns shapes for real text", async () => {
    const result = await generateTextShapes("Sunlite", "pacifico");
    expect(loadFont).toHaveBeenCalledWith("pacifico");
    expect(result.shapes?.length).toBeGreaterThanOrEqual(7);
    expect(result.skipped).toEqual([]);
  });

  it("reports characters the font could not draw", async () => {
    const result = await generateTextShapes("Ał", "montserrat");
    expect(result.skipped).toEqual(["ł"]);
  });

  it("turns a font loading failure into a TextRenderError", async () => {
    vi.mocked(loadFont).mockRejectedValue(new Error("Font request failed: 404"));
    await expect(generateTextShapes("Hi", "montserrat")).rejects.toBeInstanceOf(TextRenderError);
  });

  it("turns text with no drawable characters into a TextRenderError", async () => {
    await expect(generateTextShapes("\u{1F600}", "montserrat")).rejects.toBeInstanceOf(TextRenderError);
  });
});
