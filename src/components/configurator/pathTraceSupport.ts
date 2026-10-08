/** Path tracing needs WebGL 2 with float render targets (a graphics card, not a software fallback). */
export function canPathTrace(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    return Boolean(gl.getExtension("EXT_color_buffer_float"));
  } catch {
    return false;
  }
}

/** Samples the render refines to before it stops by itself. */
export const TARGET_SAMPLES = 320;
