import { BlendFunction, Effect } from "postprocessing";
import { Uniform } from "three";

// Same maths as three's ACESFilmicToneMapping and NeutralToneMapping (exposure 1), under
// private names so they cannot clash with another effect in the pass. postprocessing's own
// ToneMappingEffect can't be used twice in one pass (both define the same functions), and a
// single one can't blend two operators, so this effect holds both.
const FRAGMENT = /* glsl */ `
uniform float uNight;

vec3 dnAces(vec3 color) {
  const mat3 inMat = mat3(
    vec3(0.59719, 0.07600, 0.02840),
    vec3(0.35458, 0.90834, 0.13383),
    vec3(0.04823, 0.01566, 0.83777)
  );
  const mat3 outMat = mat3(
    vec3( 1.60475, -0.10208, -0.00327),
    vec3(-0.53108,  1.10813, -0.07276),
    vec3(-0.07367, -0.00605,  1.07602)
  );
  color *= 1.0 / 0.6;
  color = inMat * color;
  vec3 a = color * (color + 0.0245786) - 0.000090537;
  vec3 b = color * (0.983729 * color + 0.4329510) + 0.238081;
  color = outMat * (a / b);
  return clamp(color, 0.0, 1.0);
}

vec3 dnNeutral(vec3 color) {
  const float startCompression = 0.8 - 0.04;
  const float desaturation = 0.06;
  float x = min(color.r, min(color.g, color.b));
  float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  color -= offset;
  float peak = max(color.r, max(color.g, color.b));
  if (peak < startCompression) return color;
  float d = 1. - startCompression;
  float newPeak = 1. - d * d / (peak + d - startCompression);
  color *= newPeak / peak;
  float g = 1. - 1. / (desaturation * (peak - newPeak) + 1.);
  return mix(color, vec3(newPeak), g);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  outputColor = vec4(mix(dnAces(inputColor.rgb), dnNeutral(inputColor.rgb), uNight), inputColor.a);
}
`;

/**
 * Tone mapping that crossfades from ACES (day, the look the scene was tuned for) to Khronos
 * neutral (night; ACES pulls saturated glows toward white). `night` is 0..1.
 */
export class DayNightToneMapping extends Effect {
  constructor() {
    super("DayNightToneMapping", FRAGMENT, {
      blendFunction: BlendFunction.SRC,
      uniforms: new Map([["uNight", new Uniform(0)]]),
    });
  }

  get night(): number {
    return this.uniforms.get("uNight")!.value as number;
  }

  set night(value: number) {
    this.uniforms.get("uNight")!.value = value;
  }
}
