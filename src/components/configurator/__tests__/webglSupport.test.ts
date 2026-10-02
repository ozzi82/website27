import { describe, it, expect, vi, afterEach } from "vitest";
import { isWebglSupported } from "../webglSupport";

describe("isWebglSupported", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when the canvas can get a webgl context", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as RenderingContext);
    expect(isWebglSupported()).toBe(true);
  });

  it("returns false when the canvas cannot get any webgl context", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    expect(isWebglSupported()).toBe(false);
  });

  it("returns false if getContext throws", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => {
      throw new Error("no webgl");
    });
    expect(isWebglSupported()).toBe(false);
  });
});
