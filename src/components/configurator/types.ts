export type Product = "trimless-letters" | "cast-block-acrylic";

export type DayNight = "day" | "night";

/** Paint/vinyl swatches Sunlite can actually fabricate for Trimless Letters' face/return. */
export const TRIMLESS_SWATCHES = [
  "white",
  "black",
  "red",
  "blue",
  "custom",
] as const;
export type TrimlessSwatch = (typeof TRIMLESS_SWATCHES)[number];

/** Cast Block Acrylic's real color options, per src/data/services.ts. */
export const ACRYLIC_COLORS = ["clear", "opal", "custom"] as const;
export type AcrylicColor = (typeof ACRYLIC_COLORS)[number];

export type IlluminationStyle = "face-lit" | "halo-lit" | "dual-lit";

/** 3 discrete depth presets for Trimless Letters — see the spec's "Trimless depth presets"
 *  section: exact inch values are a placeholder pending confirmation against real fabrication
 *  limits, so this type only encodes the preset names, not specific measurements. */
export type TrimlessDepth = "slim" | "standard" | "max";

export interface TrimlessConfig {
  product: "trimless-letters";
  illumination: IlluminationStyle;
  depth: TrimlessDepth;
  faceColor: TrimlessSwatch;
  returnColor: TrimlessSwatch;
  dayNight: DayNight;
}

export interface CastBlockAcrylicConfig {
  product: "cast-block-acrylic";
  acrylicColor: AcrylicColor;
  dayNight: DayNight;
}

export type ProductConfig = TrimlessConfig | CastBlockAcrylicConfig;

export function defaultConfigFor(product: Product): ProductConfig {
  if (product === "trimless-letters") {
    return {
      product: "trimless-letters",
      illumination: "face-lit",
      depth: "standard",
      faceColor: "white",
      returnColor: "black",
      dayNight: "day",
    };
  }
  return {
    product: "cast-block-acrylic",
    acrylicColor: "clear",
    dayNight: "day",
  };
}
