import { describe, it, expect } from "vitest";
import type { ProductConfig } from "../types";

function depthLabel(config: ProductConfig): string {
  if (config.product === "trimless-letters") {
    return config.depth;
  }
  return "fixed";
}

describe("ProductConfig discriminated union", () => {
  it("narrows to Trimless fields when product is trimless-letters", () => {
    const config: ProductConfig = {
      product: "trimless-letters",
      illumination: "face-lit",
      depth: "slim",
      faceColor: "white",
      returnColor: "black",
      dayNight: "day",
    };
    expect(depthLabel(config)).toBe("slim");
  });

  it("narrows to Cast Block Acrylic fields when product is cast-block-acrylic", () => {
    const config: ProductConfig = {
      product: "cast-block-acrylic",
      acrylicColor: "clear",
      dayNight: "night",
    };
    expect(depthLabel(config)).toBe("fixed");
  });
});
