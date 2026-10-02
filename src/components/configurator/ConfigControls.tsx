import {
  TRIMLESS_SWATCHES,
  ACRYLIC_COLORS,
  type ProductConfig,
  type IlluminationStyle,
  type TrimlessDepth,
} from "./types";

interface ConfigControlsProps {
  config: ProductConfig;
  onChange: (config: ProductConfig) => void;
}

export default function ConfigControls({ config, onChange }: ConfigControlsProps) {
  const dayNightToggle = (
    <label className="flex items-center gap-2 text-sm font-medium">
      <input
        type="checkbox"
        checked={config.dayNight === "night"}
        onChange={(e) => onChange({ ...config, dayNight: e.target.checked ? "night" : "day" })}
      />
      Day / Night
    </label>
  );

  if (config.product === "cast-block-acrylic") {
    return (
      <div className="space-y-4">
        <label className="block text-sm font-medium" htmlFor="acrylic-color">
          Acrylic color
        </label>
        <select
          id="acrylic-color"
          value={config.acrylicColor}
          onChange={(e) => onChange({ ...config, acrylicColor: e.target.value as typeof config.acrylicColor })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {ACRYLIC_COLORS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {dayNightToggle}
      </div>
    );
  }

  // config.product === "trimless-letters"
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium" htmlFor="illumination">
        Illumination style
      </label>
      <select
        id="illumination"
        value={config.illumination}
        onChange={(e) => onChange({ ...config, illumination: e.target.value as IlluminationStyle })}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="face-lit">Face-lit</option>
        <option value="halo-lit">Halo-lit</option>
        <option value="dual-lit">Dual-lit</option>
      </select>

      <label className="block text-sm font-medium" htmlFor="depth">
        Depth
      </label>
      <select
        id="depth"
        value={config.depth}
        onChange={(e) => onChange({ ...config, depth: e.target.value as TrimlessDepth })}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="slim">Slim</option>
        <option value="standard">Standard</option>
        <option value="max">Max</option>
      </select>

      <label className="block text-sm font-medium" htmlFor="face-color">
        Face color
      </label>
      <select
        id="face-color"
        value={config.faceColor}
        onChange={(e) => onChange({ ...config, faceColor: e.target.value as typeof config.faceColor })}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        {TRIMLESS_SWATCHES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <label className="block text-sm font-medium" htmlFor="return-color">
        Return color
      </label>
      <select
        id="return-color"
        value={config.returnColor}
        onChange={(e) => onChange({ ...config, returnColor: e.target.value as typeof config.returnColor })}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        {TRIMLESS_SWATCHES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {dayNightToggle}
    </div>
  );
}
