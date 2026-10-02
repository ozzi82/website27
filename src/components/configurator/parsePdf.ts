import * as THREE from "three";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { ParseError, NoVectorPathsFoundError } from "./parseErrors";

const { OPS } = pdfjsLib;

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

export async function parsePdf(data: Uint8Array): Promise<THREE.Shape[]> {
  let page;
  try {
    const doc = await pdfjsLib.getDocument({ data }).promise;
    page = await doc.getPage(1); // only page 1 is used, per spec
  } catch (cause) {
    throw new ParseError("artwork.pdf", cause);
  }

  const viewport = page.getViewport({ scale: 1 });
  const [a, b, c, d, e, f] = viewport.transform;
  const transformPoint = (x: number, y: number): [number, number] => [
    a * x + c * y + e,
    b * x + d * y + f,
  ];

  const opList = await page.getOperatorList();
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
