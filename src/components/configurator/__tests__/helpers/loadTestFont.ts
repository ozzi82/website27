import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as opentypeNs from "opentype.js";

// Node resolves the CommonJS/UMD build (no named exports); the browser bundle uses the ESM one.
const opentype: typeof opentypeNs = (opentypeNs as unknown as { default?: typeof opentypeNs }).default ?? opentypeNs;

const require = createRequire(import.meta.url);

/** Loads one of the bundled @fontsource WOFF files from node_modules, as the browser would fetch it. */
export function loadTestFont(pkg: string, file: string): opentype.Font {
  const path = require.resolve(`@fontsource/${pkg}/files/${file}`);
  const buf = readFileSync(path);
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

export const loadMontserrat = () => loadTestFont("montserrat", "montserrat-latin-700-normal.woff");
