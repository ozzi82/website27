import { describe, expect, it } from "vitest";
import { SUMMARY_IMAGE_NAME, renderSummaryImage } from "../summaryImage";

describe("renderSummaryImage", () => {
  it("never throws: without a canvas (jsdom) the quote simply goes without the picture", async () => {
    expect(await renderSummaryImage({ rows: [{ label: "Depth", value: "2″ (50 mm)" }], image: null })).toBeNull();
    expect(SUMMARY_IMAGE_NAME).toMatch(/\.jpg$/);
  });
});
