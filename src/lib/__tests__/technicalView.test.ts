import { describe, expect, it } from "vitest";
import { configurations } from "../../data/configurations";
import { drawingUrl, technicalSlug, technicalViewUrl } from "../technicalView";

describe("technical view and drawings from the CRM", () => {
  it("names every product the way the CRM does", () => {
    expect(configurations.map((c) => technicalSlug(c.code))).toEqual(["lp1", "lp3-1", "lp3-2", "lp5", "lp11-f", "lp11-b", "lp11-fb", "lp11-bs", "lp11-fs", "lp11-s", "lp11-n", "lp11-c"]);
    expect(technicalSlug("LP 5+3.1")).toBe("lp5");
  });

  it("builds the view and drawing addresses, and none when switched off", () => {
    expect(technicalViewUrl("LP 11-FS", undefined, "https://crm.test")).toBe("https://crm.test/edgeluxe/lp11-fs/embed?theme=site&explode=100&play=0");
    expect(technicalViewUrl("LP 11-FS", 20, "https://crm.test")).toBe("https://crm.test/edgeluxe/lp11-fs/embed?theme=site&explode=100&play=0&depth=20");
    expect(drawingUrl("LP 3.1", "dxf", 50, "https://crm.test")).toBe("https://crm.test/edgeluxe/lp3-1/drawing?format=dxf&depth=50");
    expect(drawingUrl("LP 1", "pdf", undefined, "https://crm.test")).toBe("https://crm.test/edgeluxe/lp1/drawing?format=pdf");
    expect(technicalViewUrl("LP 1", 10, "")).toBe("");
    expect(drawingUrl("LP 1", "pdf", 10, "")).toBe("");
  });
});
