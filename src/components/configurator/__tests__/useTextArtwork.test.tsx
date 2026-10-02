import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as THREE from "three";
import { useTextArtwork, TEXT_DEBOUNCE_MS } from "../useTextArtwork";
import { generateTextShapes } from "../textArtwork";
import { TextRenderError } from "../textToShapes";
import { TEXT_RENDER_MESSAGE } from "../errorMessages";

vi.mock("../textArtwork", () => ({ generateTextShapes: vi.fn() }));

const shape = new THREE.Shape();

describe("useTextArtwork", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(generateTextShapes).mockReset();
    vi.mocked(generateTextShapes).mockResolvedValue({ shapes: [shape], skipped: [] });
  });
  afterEach(() => vi.useRealTimers());

  async function settle() {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(TEXT_DEBOUNCE_MS + 10);
    });
  }

  it("does nothing while disabled", async () => {
    renderHook(() => useTextArtwork("Hello", "montserrat", false));
    await settle();
    expect(generateTextShapes).not.toHaveBeenCalled();
  });

  it("debounces typing: only the last text is generated, after the delay", async () => {
    const { result, rerender } = renderHook(({ text }) => useTextArtwork(text, "montserrat", true), {
      initialProps: { text: "S" },
    });
    rerender({ text: "Su" });
    rerender({ text: "Sun" });
    expect(generateTextShapes).not.toHaveBeenCalled();
    await settle();
    expect(generateTextShapes).toHaveBeenCalledTimes(1);
    expect(generateTextShapes).toHaveBeenCalledWith("Sun", "montserrat");
    expect(result.current.shapes).toEqual([shape]);
    expect(result.current.error).toBeNull();
  });

  it("regenerates when only the font changes", async () => {
    const { rerender } = renderHook(({ font }) => useTextArtwork("Hi", font, true), {
      initialProps: { font: "montserrat" },
    });
    await settle();
    rerender({ font: "pacifico" });
    await settle();
    expect(generateTextShapes).toHaveBeenLastCalledWith("Hi", "pacifico");
  });

  it("clears the shapes at once for empty or whitespace-only text, without an error", async () => {
    const { result, rerender } = renderHook(({ text }) => useTextArtwork(text, "montserrat", true), {
      initialProps: { text: "Hi" },
    });
    await settle();
    expect(result.current.shapes).not.toBeNull();
    rerender({ text: "   " });
    expect(result.current.shapes).toBeNull();
    expect(result.current.error).toBeNull();
    await settle();
    expect(generateTextShapes).toHaveBeenCalledTimes(1); // nothing was asked for the blank text
  });

  it("shows the friendly message and no shapes when generation fails, then recovers", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(generateTextShapes).mockRejectedValueOnce(new TextRenderError("nope"));
    const { result, rerender } = renderHook(({ text }) => useTextArtwork(text, "montserrat", true), {
      initialProps: { text: "\u{1F600}" },
    });
    await settle();
    expect(result.current.error).toBe(TEXT_RENDER_MESSAGE);
    expect(result.current.shapes).toBeNull();
    rerender({ text: "OK" });
    await settle();
    expect(result.current.error).toBeNull();
    expect(result.current.shapes).toEqual([shape]);
  });

  it("ignores a slow, stale result that arrives after newer text", async () => {
    let resolveFirst!: (v: { shapes: THREE.Shape[]; skipped: string[] }) => void;
    const first = new Promise<{ shapes: THREE.Shape[]; skipped: string[] }>((r) => (resolveFirst = r));
    const second = new THREE.Shape();
    vi.mocked(generateTextShapes).mockReturnValueOnce(first).mockResolvedValueOnce({ shapes: [second], skipped: [] });
    const { result, rerender } = renderHook(({ text }) => useTextArtwork(text, "montserrat", true), {
      initialProps: { text: "A" },
    });
    await settle(); // first request is now in flight
    rerender({ text: "AB" });
    await settle();
    expect(result.current.shapes).toEqual([second]);
    await act(async () => resolveFirst({ shapes: [shape], skipped: [] }));
    expect(result.current.shapes).toEqual([second]);
  });

  it("announces 'Preview updated' politely once new shapes are ready and reports skipped characters", async () => {
    vi.mocked(generateTextShapes).mockResolvedValue({ shapes: [shape], skipped: ["ł"] });
    const { result } = renderHook(() => useTextArtwork("Ał", "montserrat", true));
    expect(result.current.announcement).toBe("");
    await settle();
    expect(result.current.announcement).toBe("Preview updated");
    expect(result.current.skipped).toEqual(["ł"]);
    expect(result.current.busy).toBe(false);
  });
});
