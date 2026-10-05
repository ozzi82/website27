import * as THREE from "three";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { ParseError, NoVectorPathsFoundError, TextNotOutlinedError } from "./parseErrors";

// pdf.js needs its worker. Its source is bundled INTO this lazy chunk and started as a blob worker, instead of being fetched as a
// separate .mjs file: a separate file depends on how the host serves it (MIME type for .mjs, caching, a stale file after a
// deploy), and any hiccup there made every PDF fail on the live site with a generic error. Under Node (Vitest) pdf.js
// uses its own built-in fake worker, so the browser-only worker is imported lazily and never in tests.
const isNode = typeof process !== "undefined" && !!process.versions?.node;
let workerReady: Promise<void> | null = null;
function ensureWorker(): Promise<void> {
  if (isNode) return Promise.resolve();
  workerReady ??= import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?raw").then(
    ({ default: source }) => {
      // The worker's own source, as text, becomes a blob module worker: nothing about it is fetched from the host.
      const url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
      pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(url, { type: "module" });
    },
    (err) => {
      workerReady = null;
      throw err;
    }
  );
  return workerReady;
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

// Paint operators (the PUBLIC `OPS` enum, carried in constructPath's args[0])
// that fill the path. Strokes and endPath (clip / no-op) are not artwork.
const FILL_OPS: ReadonlySet<number> = new Set([
  OPS.fill,
  OPS.eoFill,
  OPS.fillStroke,
  OPS.eoFillStroke,
  OPS.closeFillStroke,
  OPS.closeEOFillStroke,
]);
// The even-odd members of FILL_OPS: holes are decided by nesting parity, not
// by winding direction.
const EVEN_ODD_OPS: ReadonlySet<number> = new Set([
  OPS.eoFill,
  OPS.eoFillStroke,
  OPS.closeEOFillStroke,
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

// Shapes whose polygon area is below this (PDF points^2) have no extrudable
// face. Real artwork is orders of magnitude larger.
const MIN_AREA = 1e-6;
// A hole-less fill covering at least this fraction of the page is treated as a
// background plate.
const BACKGROUND_PAGE_FRACTION = 0.98;
const SAMPLE_SEGMENTS = 12;

type Matrix = number[];

/**
 * Known limitations (this is a deliberately minimal path extractor, not a PDF
 * renderer):
 *  - Only FILLED paths become shapes. Clip paths (`re W n`) and stroke-only
 *    paths are skipped: a stroked centreline is not a fillable outline, so a
 *    line-art PDF is rejected (NoVectorPathsFoundError) rather than extruded
 *    as slivers. Fill+stroke paths keep their fill.
 *  - A hole-less filled path covering (nearly) the whole page is treated as a
 *    background plate and dropped, unless it is the only artwork.
 *  - Counters are recovered only within ONE compound path (an "O" drawn as an
 *    outer + inner subpath, via three's winding-based ShapePath.toShapes — the
 *    same as the SVG route). A counter painted as a separate white shape on top
 *    of a solid one cannot be told from artwork and extrudes as a solid slab.
 *  - Colours, clipping, transparency and patterns are ignored; only geometry.
 *  - Live text is rejected (TextNotOutlinedError), not extruded. Raster images
 *    are ignored, so an image-only PDF yields NoVectorPathsFoundError.
 *  - Only the first page is read.
 *
 * The current transformation matrix is tracked through q / Q / cm and Form
 * XObject begin/end, starting from the page viewport transform (which already
 * covers /Rotate, a non-zero MediaBox origin and the PDF -> screen Y flip).
 */
export async function parsePdf(data: Uint8Array): Promise<THREE.Shape[]> {
  // Keep the loading task so its worker/transport can be released afterwards.
  // (pdfjs-dist 6.x no longer has an isEvalSupported option — it never uses
  // eval — so there is nothing to disable.)
  let loadingTask: pdfjsLib.PDFDocumentLoadingTask;
  try {
    await ensureWorker();
    loadingTask = pdfjsLib.getDocument({ data });
  } catch (cause) {
    throw new ParseError("artwork.pdf (reader could not start)", cause);
  }
  try {
    let page;
    try {
      const doc = await loadingTask.promise;
      page = await doc.getPage(1); // only page 1 is used, per spec
    } catch (cause) {
      throw new ParseError("artwork.pdf", cause);
    }
    try {
      return await extractShapes(page);
    } catch (cause) {
      // Typed errors already carry user-facing meaning; anything else is an
      // unexpected failure inside the extractor and must not leak out as a raw
      // TypeError (the UI would show the generic "something went wrong").
      if (
        cause instanceof ParseError ||
        cause instanceof TextNotOutlinedError ||
        cause instanceof NoVectorPathsFoundError
      ) {
        throw cause;
      }
      throw new ParseError("artwork.pdf", cause);
    }
  } finally {
    await loadingTask.destroy();
  }
}

async function extractShapes(page: pdfjsLib.PDFPageProxy): Promise<THREE.Shape[]> {
  const viewport = page.getViewport({ scale: 1 });

  const opList = await page.getOperatorList();
  if (opList.fnArray.some((fn) => TEXT_SHOW_OPS.has(fn))) {
    throw new TextNotOutlinedError();
  }

  // The CTM maps the current user space to viewport (screen, Y-down) space.
  let ctm: Matrix = Array.from(viewport.transform);
  const stack: Matrix[] = [];
  const shapes: THREE.Shape[] = [];

  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i];
    const args = opList.argsArray[i] as unknown;

    switch (fn) {
      case OPS.save:
        stack.push(ctm);
        break;
      case OPS.restore:
        // An unbalanced Q from a sloppy producer: keep the current matrix.
        ctm = stack.pop() ?? ctm;
        break;
      case OPS.transform:
        ctm = applyMatrix(ctm, args);
        break;
      case OPS.paintFormXObjectBegin:
        stack.push(ctm);
        ctm = applyMatrix(ctm, Array.isArray(args) ? args[0] : null);
        break;
      case OPS.paintFormXObjectEnd:
        ctm = stack.pop() ?? ctm;
        break;
      case OPS.constructPath: {
        // args = [paintOp, [flatDrawArray | null], minMax | null].
        if (!Array.isArray(args) || !FILL_OPS.has(args[0])) break;
        // Runtime value is a Float32Array; only indexed access and .length are
        // used, which behave identically to number[].
        const flat = Array.isArray(args[1]) ? (args[1][0] as ArrayLike<number> | null) : null;
        shapes.push(...shapesFromFlatPath(flat, ctm, EVEN_ODD_OPS.has(args[0])));
        break;
      }
    }
  }

  return dropBackgroundPlate(shapes, viewport.width * viewport.height);
}

/**
 * Pre-multiplies `ctm` by a cm / Form XObject matrix. pdf.js hands the cm
 * operands over as a plain array but a Form XObject /Matrix as a Float32Array,
 * so accept any 6-number array-like; anything else leaves the CTM unchanged.
 */
function applyMatrix(ctm: Matrix, value: unknown): Matrix {
  if (!value || typeof value !== "object" || (value as ArrayLike<number>).length !== 6) return ctm;
  const matrix = Array.from(value as ArrayLike<number>);
  return matrix.every((n) => Number.isFinite(n)) ? pdfjsLib.Util.transform(ctm, matrix) : ctm;
}

/**
 * Decodes one pdf.js flat draw array (see DRAW_* above) into filled shapes,
 * with every point mapped through `m`. The subpaths of one path op go into one
 * ShapePath so three can split them into outlines and holes.
 */
function shapesFromFlatPath(
  flat: ArrayLike<number> | null | undefined,
  m: Matrix,
  evenOdd: boolean
): THREE.Shape[] {
  // pdf.js uses [null] when the paint operator had no path (stray n / f / S).
  if (!flat || flat.length === 0 || !m.every((n) => Number.isFinite(n))) return [];
  for (let k = 0; k < flat.length; k++) {
    // A NaN/Infinity coordinate would poison the bounding box and the
    // triangulation downstream; skip the whole path rather than guess.
    if (!Number.isFinite(flat[k])) return [];
  }

  const [a, b, c, d, e, f] = m;
  const pt = (x: number, y: number): [number, number] => [a * x + c * y + e, b * x + d * y + f];

  const shapePath = new THREE.ShapePath();
  let current: THREE.Path | null = null;
  let start: [number, number] | null = null;
  // A segment needs a subpath: begin one lazily at the last moveTo (after a
  // closePath, PDF continues from that same start point).
  const subpath = (): THREE.Path | null => {
    if (!current && start) {
      current = new THREE.Path();
      current.moveTo(start[0], start[1]);
      shapePath.subPaths.push(current);
    }
    return current;
  };

  let j = 0;
  while (j < flat.length) {
    const code = flat[j++];
    switch (code) {
      case DRAW_MOVE_TO:
        start = pt(flat[j], flat[j + 1]);
        j += 2;
        current = null;
        break;
      case DRAW_LINE_TO: {
        const [x, y] = pt(flat[j], flat[j + 1]);
        j += 2;
        subpath()?.lineTo(x, y);
        break;
      }
      case DRAW_CURVE_TO: {
        const [cp1x, cp1y] = pt(flat[j], flat[j + 1]);
        const [cp2x, cp2y] = pt(flat[j + 2], flat[j + 3]);
        const [x, y] = pt(flat[j + 4], flat[j + 5]);
        j += 6;
        subpath()?.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
        break;
      }
      case DRAW_QUADRATIC_CURVE_TO: {
        const [cpx, cpy] = pt(flat[j], flat[j + 1]);
        const [x, y] = pt(flat[j + 2], flat[j + 3]);
        j += 4;
        subpath()?.quadraticCurveTo(cpx, cpy, x, y);
        break;
      }
      case DRAW_CLOSE_PATH:
        // A subpath only exists once it has a segment, so `x y m h` is a no-op
        // (three's closePath() would throw on a segment-less path).
        (current as THREE.Path | null)?.closePath();
        current = null;
        break;
      default:
        // An opcode outside these 5 values would desync the rest of this flat
        // array (we wouldn't know how many numbers it consumes) — keep what was
        // decoded so far and stop reading this path.
        j = flat.length;
        break;
    }
  }

  const shapes = evenOdd ? shapesByNesting(shapePath.subPaths) : shapePath.toShapes();
  return shapes
    .map(cleanShape)
    .filter((shape): shape is THREE.Shape => shape !== null);
}

function pointInPolygon(p: THREE.Vector2, polygon: THREE.Vector2[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Even-odd classification: a subpath enclosed by an odd number of others is a
 * hole of its innermost enclosing solid; an even number makes it a solid. This
 * does not depend on winding direction (three's toShapes does, and so mis-reads
 * same-direction compound paths such as those exported with fill-rule evenodd).
 */
function shapesByNesting(subPaths: THREE.Path[]): THREE.Shape[] {
  const polygons = subPaths.map((p) => p.getPoints(SAMPLE_SEGMENTS));
  const areas = polygons.map(areaOf);
  // Bounding boxes reject most non-enclosing candidates before the O(n) test.
  const boxes = polygons.map((polygon) => new THREE.Box2().setFromPoints(polygon));
  // Indices of the subpaths that enclose subpath i (only larger ones can).
  const enclosing = polygons.map((polygon, i) =>
    polygon.length === 0
      ? []
      : polygons
          .map((_, j) => j)
          .filter(
            (j) =>
              j !== i &&
              areas[j] > areas[i] &&
              boxes[j].containsPoint(polygon[0]) &&
              pointInPolygon(polygon[0], polygons[j])
          )
  );

  const shapes = new Map<number, THREE.Shape>();
  subPaths.forEach((path, i) => {
    if (enclosing[i].length % 2 === 0) {
      const shape = new THREE.Shape();
      shape.curves = path.curves;
      shapes.set(i, shape);
    }
  });
  subPaths.forEach((path, i) => {
    if (enclosing[i].length % 2 === 1) {
      // Innermost enclosing solid = the enclosing subpath with the smallest area.
      const parent = enclosing[i].reduce((best, j) => (areas[j] < areas[best] ? j : best));
      shapes.get(parent)?.holes.push(path);
    }
  });
  return [...shapes.values()];
}

function areaOf(points: THREE.Vector2[]): number {
  return Math.abs(THREE.ShapeUtils.area(points));
}

/** Drops the shape (or any of its holes) if it has no area to extrude. */
function cleanShape(shape: THREE.Shape): THREE.Shape | null {
  if (areaOf(shape.getPoints(SAMPLE_SEGMENTS)) < MIN_AREA) return null;
  shape.holes = shape.holes.filter((hole) => areaOf(hole.getPoints(SAMPLE_SEGMENTS)) >= MIN_AREA);
  return shape;
}

/**
 * Removes hole-less, page-sized fills (a background rectangle) as long as
 * something else remains, so the logo isn't buried in a slab the size of the
 * artboard. A page-sized shape WITH holes is the artwork (a plate with
 * cut-outs) and is kept.
 */
function dropBackgroundPlate(shapes: THREE.Shape[], pageArea: number): THREE.Shape[] {
  if (shapes.length === 0) throw new NoVectorPathsFoundError();
  const isBackground = (shape: THREE.Shape) =>
    shape.holes.length === 0 &&
    areaOf(shape.getPoints(SAMPLE_SEGMENTS)) >= pageArea * BACKGROUND_PAGE_FRACTION;
  const artwork = shapes.filter((shape) => !isBackground(shape));
  return artwork.length > 0 ? artwork : shapes;
}
