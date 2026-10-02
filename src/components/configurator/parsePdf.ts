import * as THREE from "three";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
// Vite resolves this to the bundled worker's URL. The legacy worker must match
// the legacy build imported above. Without it, browsers throw 'No
// "GlobalWorkerOptions.workerSrc" specified'.
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import { ParseError, NoVectorPathsFoundError, TextNotOutlinedError } from "./parseErrors";

// Only configure the worker in a real browser. Under Node (including Vitest,
// where Vite's ?url yields a root-relative path Node can't import) pdf.js
// falls back to its own built-in fake-worker loading, which works — and is why
// the tests never caught the missing workerSrc in the first place.
const isNode = typeof process !== "undefined" && !!process.versions?.node;
if (!isNode) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

const { OPS } = pdfjsLib;

// Operators that paint live text. Glyphs are never turned into shapes here, so
// their presence means letters would silently vanish from the sign.
const TEXT_SHOW_OPS: ReadonlySet<number> = new Set([
  OPS.showText,
  OPS.showSpacedText,
  OPS.nextLineShowText,
  OPS.nextLineSetSpacingShowText,
]);

// pdf.js packs each constructPath operator's drawing commands into a flat
// number array at argsArray[i][1][0], using pdf.js's OWN PRIVATE, UNEXPORTED
// opcode numbering — NOT the public `OPS` enum checked above. These 5 values
// were confirmed by directly decoding real output from the installed
// pdfjs-dist@6.3.289 (see Chunk 1 Task 3's pdfToSvgSpike.test.ts for the same
// kind of version-pinned verification). They are not part of pdf.js's public
// API and are not guaranteed stable across versions — package.json MUST pin
// an exact pdfjs-dist version (no ^ or ~ range) so an automatic dependency
// update can't silently change this encoding. If pdfjs-dist is intentionally
// upgraded later, re-verify these constants against the new version's actual
// output before trusting this file again.
const DRAW_MOVE_TO = 0;
const DRAW_LINE_TO = 1;
const DRAW_CURVE_TO = 2;
const DRAW_QUADRATIC_CURVE_TO = 3;
const DRAW_CLOSE_PATH = 4;

/**
 * Known limitations (this is a deliberately minimal path extractor, not a PDF
 * renderer):
 *  - Counters (the hole in an "O") become separate filled shapes: there is no
 *    hole detection, so they extrude as solid slabs rather than openings.
 *  - Nested cm/q/Q transforms are ignored; only the page viewport transform is
 *    applied, so artwork positioned via content-stream transforms is misplaced.
 *  - Live text is rejected (TextNotOutlinedError), not extruded.
 *  - Anything painted as a path becomes a shape: clip rectangles, stroke-only
 *    paths and full-page background rects are not distinguished from artwork.
 */
export async function parsePdf(data: Uint8Array): Promise<THREE.Shape[]> {
  // Keep the loading task so its worker/transport can be released afterwards.
  // (pdfjs-dist 6.x no longer has an isEvalSupported option — it never uses
  // eval — so there is nothing to disable.)
  const loadingTask = pdfjsLib.getDocument({ data });
  try {
    let page;
    try {
      const doc = await loadingTask.promise;
      page = await doc.getPage(1); // only page 1 is used, per spec
    } catch (cause) {
      throw new ParseError("artwork.pdf", cause);
    }
    return await extractShapes(page);
  } finally {
    await loadingTask.destroy();
  }
}

async function extractShapes(page: pdfjsLib.PDFPageProxy): Promise<THREE.Shape[]> {
  const viewport = page.getViewport({ scale: 1 });
  const [a, b, c, d, e, f] = viewport.transform;
  const transformPoint = (x: number, y: number): [number, number] => [
    a * x + c * y + e,
    b * x + d * y + f,
  ];

  const opList = await page.getOperatorList();
  if (opList.fnArray.some((fn) => TEXT_SHOW_OPS.has(fn))) {
    throw new TextNotOutlinedError();
  }

  const shapes: THREE.Shape[] = [];
  let currentShape: THREE.Shape | null = null;

  for (let i = 0; i < opList.fnArray.length; i++) {
    if (opList.fnArray[i] !== OPS.constructPath) continue;

    // argsArray[i] is [opCode, [flatDrawArray], minMax] for constructPath.
    // Runtime value is actually a Float32Array, not a plain number[] — typed
    // loosely here since only indexed access and .length are used, both of
    // which behave identically on either type.
    const drawArgs = opList.argsArray[i][1] as [ArrayLike<number>];
    const flat = drawArgs[0];
    let j = 0;

    while (j < flat.length) {
      const code = flat[j++];
      switch (code) {
        case DRAW_MOVE_TO: {
          const [x, y] = transformPoint(flat[j], flat[j + 1]);
          j += 2;
          currentShape = new THREE.Shape();
          currentShape.moveTo(x, y);
          shapes.push(currentShape);
          break;
        }
        case DRAW_LINE_TO: {
          const [x, y] = transformPoint(flat[j], flat[j + 1]);
          j += 2;
          currentShape?.lineTo(x, y);
          break;
        }
        case DRAW_CURVE_TO: {
          const [cp1x, cp1y] = transformPoint(flat[j], flat[j + 1]);
          const [cp2x, cp2y] = transformPoint(flat[j + 2], flat[j + 3]);
          const [x, y] = transformPoint(flat[j + 4], flat[j + 5]);
          j += 6;
          currentShape?.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
          break;
        }
        case DRAW_QUADRATIC_CURVE_TO: {
          const [cpx, cpy] = transformPoint(flat[j], flat[j + 1]);
          const [x, y] = transformPoint(flat[j + 2], flat[j + 3]);
          j += 4;
          currentShape?.quadraticCurveTo(cpx, cpy, x, y);
          break;
        }
        case DRAW_CLOSE_PATH: {
          currentShape?.closePath();
          break;
        }
        default:
          // An opcode outside these 5 known values would desync the rest of
          // this constructPath's flat array (we wouldn't know how many
          // numbers it consumes) — bail out of the current path rather than
          // risk misinterpreting subsequent numbers as opcodes. Known v1
          // limitation: a PDF using path features beyond these 5 primitives
          // renders incompletely rather than crashing.
          j = flat.length;
          break;
      }
    }
  }

  if (shapes.length === 0) {
    throw new NoVectorPathsFoundError();
  }

  return shapes;
}
