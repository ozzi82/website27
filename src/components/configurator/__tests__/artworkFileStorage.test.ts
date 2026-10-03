import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import {
  clearArtworkFile,
  loadArtworkFile,
  saveArtworkFile,
  MAX_ARTWORK_BYTES,
  ARTWORK_TTL_MS,
} from "../artworkFileStorage";

const svg = () =>
  new File(['<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0L1 1Z"/></svg>'], "logo.svg", {
    type: "image/svg+xml",
  });

let factory: IDBFactory;
beforeEach(() => {
  factory = new IDBFactory();
});
afterEach(() => vi.useRealTimers());

describe("artwork file storage", () => {
  it("round-trips a file: same name, type, size and bytes", async () => {
    const original = svg();
    expect(await saveArtworkFile(original, "q1", factory)).toBe(true);
    const loaded = await loadArtworkFile("q1", factory);
    expect(loaded).not.toBeNull();
    expect(loaded!.name).toBe("logo.svg");
    expect(loaded!.type).toBe("image/svg+xml");
    expect(loaded!.size).toBe(original.size);
    expect(await loaded!.text()).toBe(await original.text());
  });

  it("round-trips binary data (a PDF) untouched", async () => {
    const bytes = new Uint8Array([37, 80, 68, 70, 0, 255, 128, 10]);
    await saveArtworkFile(new File([bytes], "art.pdf", { type: "application/pdf" }), "q1", factory);
    const loaded = await loadArtworkFile("q1", factory);
    expect(new Uint8Array(await loaded!.arrayBuffer())).toEqual(bytes);
  });

  it("returns null when nothing was saved", async () => {
    expect(await loadArtworkFile("q1", factory)).toBeNull();
  });

  it("only returns the file that belongs to the quote asked for", async () => {
    await saveArtworkFile(svg(), "q1", factory);
    expect(await loadArtworkFile("q2", factory)).toBeNull();
    expect(await loadArtworkFile("q1", factory)).not.toBeNull();
  });

  it("keeps one file: saving again replaces it", async () => {
    await saveArtworkFile(svg(), "q1", factory);
    await saveArtworkFile(new File(["x"], "second.svg", { type: "image/svg+xml" }), "q2", factory);
    expect(await loadArtworkFile("q1", factory)).toBeNull();
    expect((await loadArtworkFile("q2", factory))!.name).toBe("second.svg");
  });

  it("clear removes it", async () => {
    await saveArtworkFile(svg(), "q1", factory);
    await clearArtworkFile(factory);
    expect(await loadArtworkFile("q1", factory)).toBeNull();
  });

  it("refuses a file over the 10 MB cap and stores nothing", async () => {
    const big = new File([new Uint8Array(MAX_ARTWORK_BYTES + 1)], "huge.pdf", { type: "application/pdf" });
    expect(await saveArtworkFile(big, "q2", factory)).toBe(false);
    expect(await loadArtworkFile("q2", factory)).toBeNull();
  });

  it("accepts a file of exactly 10 MB", async () => {
    const edge = new File([new Uint8Array(MAX_ARTWORK_BYTES)], "edge.pdf", { type: "application/pdf" });
    expect(await saveArtworkFile(edge, "q1", factory)).toBe(true);
  });

  it("forgets files older than the time limit", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-01T10:00:00Z"));
    await saveArtworkFile(svg(), "q1", factory);
    vi.setSystemTime(Date.now() + ARTWORK_TTL_MS - 1000);
    expect(await loadArtworkFile("q1", factory)).not.toBeNull();
    vi.setSystemTime(Date.now() + 2000);
    expect(await loadArtworkFile("q1", factory)).toBeNull();
  });

  describe("fails quietly (the quote still works without a file)", () => {
    it("when IndexedDB does not exist", async () => {
      expect(await saveArtworkFile(svg(), "q1", null)).toBe(false);
      expect(await loadArtworkFile("q1", null)).toBeNull();
      await expect(clearArtworkFile(null)).resolves.toBeUndefined();
    });

    it("when opening the database throws", async () => {
      const broken = {
        open: () => {
          throw new DOMException("denied", "SecurityError");
        },
      } as unknown as IDBFactory;
      expect(await saveArtworkFile(svg(), "q1", broken)).toBe(false);
      expect(await loadArtworkFile("q1", broken)).toBeNull();
      await expect(clearArtworkFile(broken)).resolves.toBeUndefined();
    });

    it("when opening the database reports an error", async () => {
      const failing = {
        open: () => {
          const req = {} as { onerror?: (e: Event) => void };
          queueMicrotask(() => req.onerror?.(new Event("error")));
          return req;
        },
      } as unknown as IDBFactory;
      expect(await saveArtworkFile(svg(), "q1", failing)).toBe(false);
      expect(await loadArtworkFile("q1", failing)).toBeNull();
    });

    it("when the database never answers (gives up after a moment)", async () => {
      vi.useFakeTimers();
      const hanging = { open: () => ({}) as IDBOpenDBRequest } as unknown as IDBFactory;
      const saved = saveArtworkFile(svg(), "q1", hanging);
      await vi.advanceTimersByTimeAsync(5000);
      expect(await saved).toBe(false);
      const loaded = loadArtworkFile("q1", hanging);
      await vi.advanceTimersByTimeAsync(5000);
      expect(await loaded).toBeNull();
    });

    it("when the file cannot be read", async () => {
      const unreadable = svg();
      unreadable.arrayBuffer = () => Promise.reject(new Error("gone"));
      expect(await saveArtworkFile(unreadable, "q1", factory)).toBe(false);
    });
  });
});
