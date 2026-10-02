import { describe, it, expect, beforeEach, vi } from "vitest";
import { clearQuote, loadQuote, saveQuote, type QuoteSnapshot } from "../quoteStorage";

const quote: QuoteSnapshot = {
  v: 1,
  summary: "Sign configuration\nDepth: 2″ (50 mm)",
  rows: [{ label: "Depth", value: "2″ (50 mm)" }],
  image: "data:image/jpeg;base64,AAAA",
  savedAt: 1,
};

beforeEach(() => sessionStorage.clear());

describe("quote storage", () => {
  it("round-trips a snapshot through sessionStorage", () => {
    saveQuote(quote);
    expect(loadQuote()).toEqual(quote);
  });

  it("returns null when nothing is stored, after clearing, and for corrupt or foreign data", () => {
    expect(loadQuote()).toBeNull();
    saveQuote(quote);
    clearQuote();
    expect(loadQuote()).toBeNull();
    sessionStorage.setItem("sls.quote.v1", "{not json");
    expect(loadQuote()).toBeNull();
    sessionStorage.setItem("sls.quote.v1", JSON.stringify({ v: 2, summary: "x" }));
    expect(loadQuote()).toBeNull();
    sessionStorage.setItem("sls.quote.v1", JSON.stringify({ v: 1, summary: 5, rows: [] }));
    expect(loadQuote()).toBeNull();
  });

  it("keeps the text when the preview image does not fit in storage", () => {
    const real = Storage.prototype.setItem;
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k, v) {
      if (String(v).includes("data:image")) throw new DOMException("full", "QuotaExceededError");
      return real.call(this, k, v);
    });
    saveQuote(quote);
    expect(loadQuote()).toEqual({ ...quote, image: null });
    spy.mockRestore();
  });

  it("never throws when storage is unavailable", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => saveQuote(quote)).not.toThrow();
    spy.mockRestore();
  });
});
