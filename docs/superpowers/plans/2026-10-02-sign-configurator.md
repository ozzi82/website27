# Sign Configurator Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-side `/configurator` page where a prospect uploads an SVG or PDF logo and sees it rendered as a photoreal 3D channel-letter sign (Trimless Letters or Cast Block Acrylic), with a day/night toggle and a small set of real configuration options, entirely in the browser with no backend.

**Architecture:** A pure-function parsing module (`parseArtwork.ts`) turns an uploaded file into `THREE.Shape[]`, independent of which product is being previewed. A `react-three-fiber` scene (`SignPreview.tsx`) extrudes those shapes and renders them per-product (Trimless Letters gets the full face/return/illumination-style model; Cast Block Acrylic gets a reduced single-material model). `ConfigControls.tsx` and a product chooser drive the config state that `SignPreview` renders. Everything lives under a single lazy-loaded route so the rest of the site's bundle is unaffected.

**Tech Stack:** React + TypeScript + Vite (existing), `three` + `@react-three/fiber` + `@react-three/drei` + `@react-three/postprocessing` (new), `pdfjs-dist` (new), Vitest + jsdom (new, for unit testing `parseArtwork.ts`).

**Spec:** `docs/superpowers/specs/2026-10-01-sign-configurator-design.md` — read this first for the *why* behind every decision below. This plan implements it task-by-task; it doesn't re-explain the reasoning.

---

## Chunk 1: Project setup, types, and route scaffolding

Gets the project able to run tests, adds all new dependencies, defines the shared types the rest of the feature is built on, and wires up a (currently empty) `/configurator` route so routing/nav work can be verified independently of the parsing/rendering logic.

### Task 1: Add Vitest and a first passing test

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (add `test` script and devDependencies)
- Test: `src/lib/__tests__/sanity.test.ts`

The project currently has no test runner. Vitest is the natural choice for a Vite project (shares config, no separate transform setup).

- [ ] **Step 1: Install Vitest and jsdom**

Run: `npm install -D vitest jsdom`

- [ ] **Step 2: Create the Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@project": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
```

(This mirrors the `@project` alias already set up in `vite.config.ts:9` so test files can use the same imports as app code.)

- [ ] **Step 3: Add the `test` script**

Modify `package.json` — add to `"scripts"`:

```json
"test": "vitest run"
```

- [ ] **Step 4: Write a sanity test**

Create `src/lib/__tests__/sanity.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("test setup", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run it**

Run: `npm test`
Expected: `1 passed`, exit code 0.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts package.json package-lock.json src/lib/__tests__/sanity.test.ts
git commit -m "test: add Vitest test runner"
```

---

### Task 2: Install the 3D and PDF dependencies

**Files:**
- Modify: `package.json`

No code yet — just getting every new dependency installed in one step so later tasks aren't blocked on npm installs mid-feature.

**Version note, verified by actually attempting the install against this project's real `package.json`:** this project pins React 18 (`"react": "^18.3.1"`). The current latest major versions of `@react-three/fiber` (9.x) and `@react-three/drei` (10.x) require React 19 as a peer dependency and fail to install against React 18 without forcing past a real peer-dependency conflict. Install the React-18-compatible major versions explicitly instead of taking whatever "latest" resolves to:

- [ ] **Step 1: Install the rendering stack, pinned to React-18-compatible majors**

Run: `npm install three @react-three/fiber@^8 @react-three/drei@^9 @react-three/postprocessing@^2 postprocessing`

- [ ] **Step 2: Install three's TypeScript types and pdf.js**

Run: `npm install -D @types/three` then `npm install pdfjs-dist`

**Confirm the resolved `@types/three` version actually matches the installed `three` version** (`npm list three @types/three`) before relying on anything in this plan that depends on a specific `three` API shape (e.g. Chunk 2's `path.toShapes()` taking no arguments — a `@types/three` version behind `three`'s actual runtime version can disagree with it and produce a misleading type error that looks like a code defect but is really just a types/runtime mismatch). If they're out of sync, pin `@types/three` explicitly to the matching version rather than installing it unpinned.

- [ ] **Step 3: Verify the project still builds**

Run: `npm run build`
Expected: builds successfully (these packages aren't imported anywhere yet, so this just confirms nothing conflicts).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add three.js, react-three-fiber, and pdfjs-dist dependencies"
```

---

### Task 3: PDF-to-SVG feasibility spike

**Files:**
- Create: `scripts/generate-pdf-fixture.mjs`
- Create: `src/components/configurator/__tests__/fixtures/vector-sample.pdf` (generated, committed binary)
- Test: `src/components/configurator/__tests__/pdfToSvgSpike.test.ts`
- Modify: `package.json` (temporary devDependency for fixture generation)

Per the spec's "PDF-to-SVG feasibility risk" section, this must happen **before** any PDF parsing pipeline is built on top of it. **This has already been checked against the actual currently-published `pdfjs-dist` (6.3.289, what Task 2's plain `npm install pdfjs-dist` installs): `SVGGraphics` is confirmed absent from both its runtime (`legacy/build/pdf.mjs`) and its type declarations.** So this task is not an open-ended spike with an unknown outcome — it's building the regression-guard test that documents and locks in that already-known finding, and confirming the fallback path (`getOperatorList()`) actually works against a real PDF. Chunk 2's PDF parsing will be built on `getOperatorList()` from the start, not `SVGGraphics`.

- [ ] **Step 1: Generate a known-good vector PDF fixture programmatically**

A hand-authored or GUI-exported PDF risks being invalid in a way that produces a false negative later (failing because the fixture is malformed, not because of a real parsing limit) and isn't reproducible by someone without a GUI design tool. Generate it with a small script instead:

Run: `npm install -D pdf-lib`

Create `scripts/generate-pdf-fixture.mjs`:

```js
import { PDFDocument, rgb } from "pdf-lib";
import { writeFile } from "fs/promises";

const doc = await PDFDocument.create();
const page = doc.addPage([200, 200]);

// A simple filled square with a square hole in the middle — gives the later
// parsing pipeline (Chunk 2) both an outer and an inner path to work with,
// similar in shape to a letter with a counter (e.g. "O").
page.drawRectangle({
  x: 50,
  y: 50,
  width: 100,
  height: 100,
  color: rgb(0.1, 0.1, 0.1),
});
page.drawRectangle({
  x: 80,
  y: 80,
  width: 40,
  height: 40,
  color: rgb(1, 1, 1),
});

const bytes = await doc.save();
await writeFile(
  new URL("../src/components/configurator/__tests__/fixtures/vector-sample.pdf", import.meta.url),
  bytes
);
console.log("Wrote vector-sample.pdf");
```

Run: `node scripts/generate-pdf-fixture.mjs`
Expected: `Wrote vector-sample.pdf`, and the file exists at `src/components/configurator/__tests__/fixtures/vector-sample.pdf`. Open it in any PDF viewer to confirm it shows a dark square with a white square cut out of its center before proceeding.

- [ ] **Step 2: Write the test confirming `SVGGraphics` is absent and `getOperatorList()` works**

Create `src/components/configurator/__tests__/pdfToSvgSpike.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// Confirmed against pdfjs-dist@6.3.289: SVGGraphics is not exported. The spec's
// named fallback (parse via getOperatorList() instead of an SVG intermediate
// step) is what Chunk 2's real PDF parsing is built on. This test exists so a
// future pdfjs-dist upgrade that silently restores SVGGraphics gets caught —
// if this test starts failing, SVGGraphics is back and the pipeline could be
// simplified.
//
// No worker setup needed below: pdf.js detects it's running under Node (via
// `typeof process === "object"`) and automatically disables the Web Worker,
// falling back to an in-process "fake worker" — this is pdf.js's own built-in
// behavior, not something this test configures.
describe("pdf.js PDF-parsing feasibility", () => {
  it("does not export SVGGraphics in the installed version", () => {
    expect((pdfjsLib as unknown as Record<string, unknown>).SVGGraphics).toBeUndefined();
  });

  it("can load a real PDF and read its operator list", async () => {
    const fixturePath = path.join(__dirname, "fixtures", "vector-sample.pdf");
    const data = new Uint8Array(fs.readFileSync(fixturePath));

    const doc = await pdfjsLib.getDocument({ data }).promise;
    const page = await doc.getPage(1);
    const opList = await page.getOperatorList();

    expect(opList.fnArray.length).toBeGreaterThan(0);
    // OPS.constructPath is the operator Chunk 2's real parser will look for
    // to extract path geometry — confirm at least one is present in our
    // two-rectangle fixture.
    expect(opList.fnArray).toContain(pdfjsLib.OPS.constructPath);
  });
});
```

- [ ] **Step 3: Run it**

Run: `npm test -- pdfToSvgSpike.test.ts`
Expected: `2 passed`. If either test fails, stop and re-examine before continuing — a failure here means either the fixture is bad (re-check Step 1) or a `pdfjs-dist` version mismatch from what this task assumed (re-run `npm list pdfjs-dist` and compare against 6.3.289; if it's materially different, re-verify the `SVGGraphics`-absence claim against the actual installed version's source before proceeding to Chunk 2).

- [ ] **Step 4: Remove the fixture-generation devDependency**

`pdf-lib` was only needed to generate the committed fixture file, not at test-run time or app runtime.

Run: `npm uninstall pdf-lib`

Confirm the fixture file and generator script are still present (uninstalling the package doesn't remove either), and re-run `npm test -- pdfToSvgSpike.test.ts` to confirm it still passes without `pdf-lib` installed (it only reads the already-generated binary fixture, so it should be unaffected).

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-pdf-fixture.mjs src/components/configurator/__tests__/fixtures/vector-sample.pdf src/components/configurator/__tests__/pdfToSvgSpike.test.ts package.json package-lock.json
git commit -m "spike: confirm pdfjs-dist SVGGraphics absence, verify getOperatorList() fallback works"
```

---

### Task 4: Define the shared config types

**Files:**
- Create: `src/components/configurator/types.ts`
- Test: `src/components/configurator/__tests__/types.test.ts`

This is the discriminated union the rest of the feature keys off of (per the spec's "Face/return materials" section: Trimless and Cast Block Acrylic have genuinely different config shapes). Writing it first, with a test that exercises the discrimination, catches type mistakes before any UI or rendering code depends on it.

- [ ] **Step 1: Write the test first**

Create `src/components/configurator/__tests__/types.test.ts`:

```ts
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
```

- [ ] **Step 2: Run it to confirm it fails (the module doesn't exist yet)**

Run: `npm test -- types.test.ts`
Expected: FAIL with a module-not-found error for `../types`.

- [ ] **Step 3: Write `types.ts`**

Create `src/components/configurator/types.ts`:

```ts
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
```

- [ ] **Step 4: Run the test again to confirm it passes**

Run: `npm test -- types.test.ts`
Expected: `2 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/components/configurator/types.ts src/components/configurator/__tests__/types.test.ts
git commit -m "feat(configurator): add ProductConfig discriminated union types"
```

---

### Task 5: Scaffold the (empty) ConfiguratorPage and wire up the route

**Files:**
- Create: `src/pages/ConfiguratorPage.tsx`
- Modify: `src/App.tsx:1-9` (imports), `src/App.tsx:40-47` (routes)

This intentionally does nothing but render a placeholder — the goal of this task is purely to prove the lazy-loaded route, nav entry, and code-splitting work before any real logic exists, so later tasks can focus on one thing at a time.

- [ ] **Step 1: Create the placeholder page**

Create `src/pages/ConfiguratorPage.tsx`:

```tsx
import Seo from "../components/Seo";

export default function ConfiguratorPage() {
  return (
    <div className="pt-28 pb-24 max-w-7xl mx-auto px-6">
      <Seo
        title="Sign Configurator"
        description="Upload your logo and see it rendered as a 3D channel-letter sign before you request a quote."
        path="/configurator"
      />
      <h1 className="text-5xl md:text-7xl mb-4">Sign Configurator</h1>
      <p className="text-muted-foreground max-w-xl">Coming soon.</p>
    </div>
  );
}
```

- [ ] **Step 2: Wire up the lazy-loaded route in `App.tsx`**

Modify `src/App.tsx` — replace the top-of-file imports (lines 1-9):

```tsx
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ServicePage from "./pages/ServicePage";
import GalleryPage from "./pages/GalleryPage";
import ContactPage from "./pages/ContactPage";
import ConfigurationPage from "./pages/ConfigurationPage";

const ConfiguratorPage = lazy(() => import("./pages/ConfiguratorPage"));
```

Then modify the `<Routes>` block (currently `src/App.tsx:40-47`) to add the new route:

```tsx
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/services/:id" element={<ServicePage />} />
            <Route path="/light-effects/:id" element={<ConfigurationPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route
              path="/configurator"
              element={
                <Suspense fallback={<div className="pt-28 pb-24 text-center text-muted-foreground">Loading…</div>}>
                  <ConfiguratorPage />
                </Suspense>
              }
            />
          </Routes>
```

- [ ] **Step 3: Verify the route renders and is code-split**

Run: `npm run build`
Expected: build succeeds, and a separate chunk file appears in the output for `ConfiguratorPage` (its own `dist/assets/ConfiguratorPage-*.js`, not bundled into the main `index-*.js`) — confirms the lazy import actually splits.

Run: `npm run dev`, then open `http://localhost:5173/configurator` in a browser and confirm the placeholder heading renders.

- [ ] **Step 4: Commit**

```bash
git add src/pages/ConfiguratorPage.tsx src/App.tsx
git commit -m "feat(configurator): add lazy-loaded /configurator route with placeholder page"
```

---

### Task 6: Add the nav entry and product-page links

**Files:**
- Modify: `src/components/Header.tsx:20-24` (navLinks), desktop nav (`Header.tsx:97-101` area), mobile menu (`Header.tsx:135-139` area)
- Modify: `src/pages/ServicePage.tsx` (add "See it on your sign" link, Trimless/Cast Block Acrylic only)

Per the spec's "Product selection" section: a plain nav entry (no product pre-selected) plus per-product links that pre-select a product.

- [ ] **Step 1: Add "Configurator" to `navLinks`**

Modify `src/components/Header.tsx:20-24`:

```tsx
const navLinks = [
  { label: "Configurator", href: "/configurator" },
  { label: "About", href: "/about" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
];
```

This automatically appears in both the desktop nav (`navLinks.map` at `Header.tsx:97`) and the mobile menu (`navLinks.map` at `Header.tsx:135`) — no further changes needed there since both already iterate over this array.

- [ ] **Step 2: Add the product-specific link to `ServicePage.tsx`**

Read `src/pages/ServicePage.tsx` in full before editing (it was last modified in an earlier SEO pass and its exact current line numbers should be re-checked rather than assumed). Add this inside the page, after the existing "Interested in {service.title}?" CTA block, but only for the two configurator-eligible products:

```tsx
{(service.id === "trimless-letters" || service.id === "cast-block-acrylic") && (
  <Link
    to={`/configurator?product=${service.id}`}
    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
  >
    See it on your sign <ArrowUpRight className="w-4 h-4" />
  </Link>
)}
```

`ServicePage.tsx`'s only existing `lucide-react` import is `import { ArrowLeft } from "lucide-react";` — add `ArrowUpRight` to it:

```tsx
import { ArrowLeft, ArrowUpRight } from "lucide-react";
```

- [ ] **Step 3: Manually verify**

Run `npm run dev`, visit `/services/trimless-letters` and `/services/cast-block-acrylic` and confirm the new link appears on both; visit `/services/cabinet-signs` and confirm it does **not** appear there (Cabinet Signs is out of scope per the spec).

- [ ] **Step 4: Commit**

```bash
git add src/components/Header.tsx src/pages/ServicePage.tsx
git commit -m "feat(configurator): add nav entry and product-page links to the configurator"
```

---

**End of Chunk 1.** At this point: tests run, all dependencies are installed, shared types exist and are tested, `/configurator` is reachable from the nav and from the two eligible product pages (with the product pre-selection passed via query param), and the page itself is still just a placeholder.

---

## Chunk 2: Artwork parsing pipeline

Builds `parseArtwork.ts` — the pure-function core of the whole feature per the spec's "Architecture" and "Parse error taxonomy" sections: `File -> THREE.Shape[]` or one of 5 typed errors, with no dependency on React, three.js rendering, or which product is selected. This is the one part of the feature practical to fully unit test, so it gets real TDD treatment. Everything in this chunk runs in Node/jsdom via Vitest — no browser needed.

### Task 1: Error classes

**Files:**
- Create: `src/components/configurator/parseErrors.ts`

The 5 typed errors from the spec's "Parse error taxonomy," as real `Error` subclasses so calling code can `instanceof`-check them.

- [ ] **Step 1: Write `parseErrors.ts`**

Create `src/components/configurator/parseErrors.ts`:

```ts
export class UnsupportedFormatError extends Error {
  constructor(fileName: string) {
    super(`Unsupported file type: ${fileName}. Only SVG and PDF are supported.`);
    this.name = "UnsupportedFormatError";
  }
}

export class FileTooLargeError extends Error {
  constructor(sizeBytes: number, maxBytes: number) {
    super(`File is ${sizeBytes} bytes, which exceeds the ${maxBytes}-byte limit.`);
    this.name = "FileTooLargeError";
  }
}

export class ParseError extends Error {
  constructor(fileName: string, cause: unknown) {
    super(`Failed to parse ${fileName}: ${cause instanceof Error ? cause.message : String(cause)}`);
    this.name = "ParseError";
  }
}

export class TextNotOutlinedError extends Error {
  constructor() {
    super(
      "This file has text that hasn't been converted to outlines. In most design tools this is " +
        "called 'Create Outlines' or 'Convert to Path' — re-export and try again."
    );
    this.name = "TextNotOutlinedError";
  }
}

export class NoVectorPathsFoundError extends Error {
  constructor() {
    super("We couldn't find a clean outline in this file. Please send us a vector file instead.");
    this.name = "NoVectorPathsFoundError";
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/configurator/parseErrors.ts
git commit -m "feat(configurator): add typed parse errors"
```

---

### Task 2: SVG parsing

**Files:**
- Create: `src/components/configurator/parseSvg.ts`
- Test: `src/components/configurator/__tests__/parseSvg.test.ts`

Uses three.js's bundled `SVGLoader`. Three technical details that make this more than "just call SVGLoader":
1. `SVGLoader.parse()` uses `DOMParser` internally and does **not** throw on malformed XML — `DOMParser` instead returns a document containing a `<parsererror>` element, so malformed input has to be detected explicitly.
2. `SVGLoader` silently ignores `<text>` elements (only reads path-like shape elements) — detected by checking the parsed XML for `<text>` nodes before trusting an empty shape result to mean "truly no vector content."
3. Converting `SVGLoader`'s output (`ShapePath[]`) to usable `THREE.Shape[]` requires calling `.toShapes()` on each and flattening — this is also where SVG's hole support (via path winding) comes from, for free, via three.js's own logic. (Older three.js versions took an `isCCW` boolean argument here; the currently-installed version's `toShapes()` takes no arguments at all — verified against the real installed `@types/three`, not assumed from older docs.)

- [ ] **Step 1: Write the failing tests**

Create `src/components/configurator/__tests__/parseSvg.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import * as THREE from "three";
import { parseSvg } from "../parseSvg";
import { ParseError, TextNotOutlinedError, NoVectorPathsFoundError } from "../parseErrors";

const SIMPLE_SQUARE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M10 10 H90 V90 H10 Z" />
</svg>`;

const SQUARE_WITH_HOLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M10 10 H90 V90 H10 Z M30 30 H70 V70 H30 Z" fill-rule="evenodd" />
</svg>`;

const MULTI_SHAPE_MULTI_COLOR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M10 10 H40 V40 H10 Z" fill="red" />
  <path d="M60 60 H90 V90 H60 Z" fill="blue" />
</svg>`;

const LIVE_TEXT_ONLY = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 30">
  <text x="10" y="20">Logo</text>
</svg>`;

const MIXED_SHAPE_AND_TEXT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M10 10 H40 V40 H10 Z" />
  <text x="50" y="50">Logo</text>
</svg>`;

const RASTER_ONLY = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <image href="data:image/png;base64,iVBORw0KGgo=" width="100" height="100" />
</svg>`;

const CORRUPT = `<svg xmlns="http://www.w3.org/2000/svg"><path d="M10 10 L`; // truncated, unclosed tags

describe("parseSvg", () => {
  it("parses a single clean path into one shape", () => {
    const shapes = parseSvg(SIMPLE_SQUARE);
    expect(shapes.length).toBe(1);
    expect(shapes[0]).toBeInstanceOf(THREE.Shape);
  });

  it("parses a path with a hole (correct winding) with the hole intact", () => {
    const shapes = parseSvg(SQUARE_WITH_HOLE);
    expect(shapes.length).toBe(1);
    expect(shapes[0].holes.length).toBe(1);
  });

  it("parses multiple separate shapes regardless of color", () => {
    const shapes = parseSvg(MULTI_SHAPE_MULTI_COLOR);
    expect(shapes.length).toBe(2);
  });

  it("throws TextNotOutlinedError for an SVG with only live text", () => {
    expect(() => parseSvg(LIVE_TEXT_ONLY)).toThrow(TextNotOutlinedError);
  });

  it("throws TextNotOutlinedError even when outlined shapes are also present", () => {
    expect(() => parseSvg(MIXED_SHAPE_AND_TEXT)).toThrow(TextNotOutlinedError);
  });

  it("throws NoVectorPathsFoundError for an SVG with only a raster image", () => {
    expect(() => parseSvg(RASTER_ONLY)).toThrow(NoVectorPathsFoundError);
  });

  it("throws ParseError for malformed/truncated SVG markup", () => {
    expect(() => parseSvg(CORRUPT)).toThrow(ParseError);
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npm test -- parseSvg.test.ts`
Expected: FAIL — `../parseSvg` doesn't exist yet.

- [ ] **Step 3: Write `parseSvg.ts`**

Create `src/components/configurator/parseSvg.ts`:

```ts
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { ParseError, TextNotOutlinedError, NoVectorPathsFoundError } from "./parseErrors";

export function parseSvg(svgText: string): THREE.Shape[] {
  const xmlDoc = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const parserError = xmlDoc.getElementsByTagName("parsererror")[0];
  if (parserError) {
    throw new ParseError("artwork.svg", new Error(parserError.textContent ?? "invalid SVG markup"));
  }

  if (xmlDoc.getElementsByTagName("text").length > 0) {
    throw new TextNotOutlinedError();
  }

  let paths: ReturnType<SVGLoader["parse"]>["paths"];
  try {
    paths = new SVGLoader().parse(svgText).paths;
  } catch (cause) {
    throw new ParseError("artwork.svg", cause);
  }

  const shapes: THREE.Shape[] = [];
  for (const path of paths) {
    shapes.push(...path.toShapes());
  }

  if (shapes.length === 0) {
    throw new NoVectorPathsFoundError();
  }

  return shapes;
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npm test -- parseSvg.test.ts`
Expected: `7 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/components/configurator/parseSvg.ts src/components/configurator/__tests__/parseSvg.test.ts
git commit -m "feat(configurator): add SVG parsing with error taxonomy"
```

---

### Task 3: Known v1 limitation fixture — malformed path winding

**Files:**
- Modify: `src/components/configurator/__tests__/parseSvg.test.ts`

Per the spec's Testing section: a letter with correct hole winding (already covered by Task 2's `SQUARE_WITH_HOLE` case) must render with its hole intact, but malformed/inconsistent winding is an **accepted v1 limitation, not a detected error** — reliably distinguishing "malformed winding" from "intentional solid shape" isn't practical without deep geometry analysis. This task adds the fixture that documents and locks in that accepted behavior, so it's a deliberate, visible decision in the test suite rather than an untested gap.

- [ ] **Step 1: Add the fixture and test**

Add to `src/components/configurator/__tests__/parseSvg.test.ts`, alongside the other SVG fixture constants:

```ts
// Both sub-paths wound the same direction (clockwise) — a correctly-authored
// hole needs opposite winding between the outer and inner path. This fixture
// represents a real-world malformed export, not a crafted edge case.
const SAME_WINDING_NO_HOLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <path d="M10 10 H90 V90 H10 Z M30 30 V70 H70 V30 Z" />
</svg>`;
```

And a new test in the `describe("parseSvg", ...)` block:

```ts
  it("accepted v1 limitation: malformed winding produces a shape without the intended hole, not a crash or error", () => {
    const shapes = parseSvg(SAME_WINDING_NO_HOLE);
    expect(shapes.length).toBeGreaterThan(0);
    // Intentionally not asserting holes.length === 0 or === 1 here — the point
    // of this test is that parsing completes without throwing, documenting
    // the known limitation rather than pinning its exact (unreliable) output.
  });
```

- [ ] **Step 2: Run it**

Run: `npm test -- parseSvg.test.ts`
Expected: `8 passed`.

- [ ] **Step 3: Commit**

```bash
git add src/components/configurator/__tests__/parseSvg.test.ts
git commit -m "test(configurator): document accepted v1 limitation for malformed SVG path winding"
```

---

### Task 4: PDF parsing — operator list walker

**Files:**
- Create: `src/components/configurator/parsePdf.ts`
- Test: `src/components/configurator/__tests__/parsePdf.test.ts`

Per Chunk 1 Task 3's confirmed finding, this does **not** use `SVGGraphics` (unavailable in the installed `pdfjs-dist`). Instead it walks `page.getOperatorList()` directly.

**Important, verified-by-testing detail that changes the obvious approach:** `pdf.js`'s public `OPS` enum only identifies *that* an operator is `OPS.constructPath` — it does **not** describe the sub-commands inside one. Those sub-commands are packed into a single flat number array at `argsArray[i][1][0]`, using `pdf.js`'s own **private, unexported** opcode numbering (confirmed by directly decoding real output from the installed `pdfjs-dist@6.3.289`): `0` = moveTo, `1` = lineTo, `2` = curveTo (6 coordinate numbers follow: two control points + endpoint), `3` = quadraticCurveTo (4 coordinate numbers follow: one control point + endpoint), `4` = closePath (no coordinates follow). The array is read as one continuous scan: read a number, it's an opcode, consume however many following numbers that opcode takes, repeat. For example `[0,0,0, 1,0,100, 1,100,100, 1,100,0, 4]` decodes to `moveTo(0,0) -> lineTo(0,100) -> lineTo(100,100) -> lineTo(100,0) -> closePath()`.

**This is a real fragility risk, not just a known limitation — flag it as such.** These 5 numbers are undocumented internal implementation details of `pdf.js`, not part of its public API, and are not guaranteed stable across versions (unlike the public `OPS` enum, which pdf.js does treat as stable API surface). **`package.json`'s `pdfjs-dist` entry must be pinned to an exact version (no `^` or `~` range)** so an automatic dependency update can't silently change this encoding out from under the parser. If `pdfjs-dist` is ever intentionally upgraded in the future, this file's decoding must be re-verified against the new version's actual output before trusting it again — the same way Chunk 1 Task 3 verified it for 6.3.289. This is a materially bigger fragility risk than the other two limitations below, which are permanent, version-independent simplifications rather than a dependency on an implementation detail that could silently change.

**Known v1 limitations, stated explicitly (not silently):**
1. This walker applies the page's overall `viewport.transform` to normalize coordinates, but does **not** track nested in-content transforms (`cm`/`q`/`Q` operators inside the content stream itself). Most simple single-drawing vector exports (the common case this tool targets) don't need nested transforms to render correctly; a PDF that does rely on them may produce a visually distorted shape.
2. Unlike `parseSvg`, this walker does not attempt hole detection — every `moveTo` starts a new independent `THREE.Shape` rather than being evaluated as a potential hole of a previous shape (correctly detecting holes would require implementing the PDF fill-rule/winding evaluation, which is a meaningfully larger task than this feature's scope). A PDF-sourced logo with letter counters (e.g. "O") will render as a solid shape rather than a ring in v1 — this is the one capability gap between the SVG and PDF upload paths, and should be called out in user-facing help text if this becomes a common complaint post-launch.

- [ ] **Step 1: Write the failing tests**

Create `src/components/configurator/__tests__/parsePdf.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as THREE from "three";
import { parsePdf } from "../parsePdf";
import { ParseError, NoVectorPathsFoundError } from "../parseErrors";

function loadFixture(name: string): Uint8Array {
  return new Uint8Array(fs.readFileSync(path.join(__dirname, "fixtures", name)));
}

describe("parsePdf", () => {
  it("parses the vector fixture (two nested rectangles) into shapes", async () => {
    const shapes = await parsePdf(loadFixture("vector-sample.pdf"));
    expect(shapes.length).toBeGreaterThan(0);
    for (const shape of shapes) {
      expect(shape).toBeInstanceOf(THREE.Shape);
    }
  });

  it("decodes actual coordinates from the flat draw-op array, not just a non-empty result", async () => {
    // Regression guard: a shapes.length > 0 check alone would still pass even
    // if coordinate extraction were subtly wrong (e.g. only reading every
    // other point).
    //
    // Important: this asserts the LOCAL coordinates actually baked into the
    // flat draw-op array (a 0..100 square), NOT the fixture's nominal page
    // position (x:50..150, y:50..150). pdf-lib's drawRectangle() wraps its
    // path in a content-stream `cm` transform to position it — e.g. a
    // "1 0 0 1 50 50 cm" placing a locally-drawn 0..100 square at page
    // position 50..150 — and parsePdf.ts does NOT track nested `cm`/`q`/`Q`
    // transforms (this is "Known v1 limitation #1" above). So the flat array
    // itself decodes to a square at LOCAL (0,0)-(100,100), and only the
    // page-level viewport transform (not the `cm`) is applied on top of that.
    // For this fixture's 200x200 page, the default viewport flips Y and
    // translates by the page height, turning local y:[0,100] into screen
    // y:[100,200], while x is unaffected (x:[0,100] stays [0,100]). This
    // test's job is narrowly to confirm the opcode-decoding math is correct
    // within that known scope — it is not a claim that the shape ends up in
    // the fixture's intended page position (it doesn't, per the limitation).
    const shapes = await parsePdf(loadFixture("vector-sample.pdf"));
    const points = shapes[0].getPoints();
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    expect(Math.min(...xs)).toBeCloseTo(0, 0);
    expect(Math.max(...xs)).toBeCloseTo(100, 0);
    expect(Math.min(...ys)).toBeCloseTo(100, 0);
    expect(Math.max(...ys)).toBeCloseTo(200, 0);
  });

  it("throws ParseError for a corrupt/garbage file", async () => {
    const garbage = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]);
    await expect(parsePdf(garbage)).rejects.toThrow(ParseError);
  });

  it("throws NoVectorPathsFoundError for a PDF with no path content", async () => {
    // A minimal valid PDF with a page but no drawing operators at all.
    const blankPdfFixture = loadFixture("blank-page.pdf");
    await expect(parsePdf(blankPdfFixture)).rejects.toThrow(NoVectorPathsFoundError);
  });
});
```

- [ ] **Step 2: Generate the second fixture (a blank page with no vector content)**

Modify `scripts/generate-pdf-fixture.mjs` (from Chunk 1 Task 3) to also emit this second fixture. Reinstall `pdf-lib` temporarily since it was uninstalled at the end of that task:

Run: `npm install -D pdf-lib`

Add to `scripts/generate-pdf-fixture.mjs`, after the existing `vector-sample.pdf` generation:

```js
const blankDoc = await PDFDocument.create();
blankDoc.addPage([200, 200]); // a page with no drawing operators at all
const blankBytes = await blankDoc.save();
await writeFile(
  new URL("../src/components/configurator/__tests__/fixtures/blank-page.pdf", import.meta.url),
  blankBytes
);
console.log("Wrote blank-page.pdf");
```

Run: `node scripts/generate-pdf-fixture.mjs`
Expected: both `Wrote vector-sample.pdf` and `Wrote blank-page.pdf` print, and both files exist.

Run: `npm uninstall pdf-lib` again (same reasoning as Chunk 1 Task 3 — it's a fixture-generation-time tool, not a runtime or test-time dependency).

- [ ] **Step 3: Run the tests to confirm they fail**

Run: `npm test -- parsePdf.test.ts`
Expected: FAIL — `../parsePdf` doesn't exist yet.

- [ ] **Step 4: Write `parsePdf.ts`**

Create `src/components/configurator/parsePdf.ts`:

```ts
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
```

- [ ] **Step 4b: Pin the exact `pdfjs-dist` version in `package.json`**

Per the fragility note above — modify `package.json` to remove the `^` (or `~`) prefix from the `pdfjs-dist` dependency entry, e.g. `"pdfjs-dist": "6.3.289"` instead of `"pdfjs-dist": "^6.3.289"` (use whatever version `npm list pdfjs-dist` actually shows as installed, which should be 6.3.289 if Task 2 installed it today, but confirm rather than assume).

- [ ] **Step 5: Run the tests to confirm they pass**

Run: `npm test -- parsePdf.test.ts`
Expected: `4 passed`.

- [ ] **Step 6: Commit**

```bash
git add src/components/configurator/parsePdf.ts src/components/configurator/__tests__/parsePdf.test.ts src/components/configurator/__tests__/fixtures/blank-page.pdf scripts/generate-pdf-fixture.mjs package.json package-lock.json
git commit -m "feat(configurator): add PDF parsing via pdf.js operator list (no SVGGraphics dependency)"
```

---

### Task 5: `parseArtwork` orchestrator

**Files:**
- Create: `src/components/configurator/parseArtwork.ts`
- Test: `src/components/configurator/__tests__/parseArtwork.test.ts`

The single public entry point `UploadDropzone` (Chunk 4) will call — dispatches to `parseSvg`/`parsePdf` by extension and enforces the format/size checks described in Chunk 1 Task 6 (independently of whatever pre-check the dropzone UI does, per that task's "defense in depth" note).

- [ ] **Step 1: Write the failing tests**

Create `src/components/configurator/__tests__/parseArtwork.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { parseArtwork } from "../parseArtwork";
import { UnsupportedFormatError, FileTooLargeError } from "../parseErrors";

function fixtureFile(name: string, mimeType: string): File {
  const bytes = fs.readFileSync(path.join(__dirname, "fixtures", name));
  return new File([bytes], name, { type: mimeType });
}

describe("parseArtwork", () => {
  it("parses a valid SVG file", async () => {
    const svgText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M1 1 H9 V9 H1 Z" /></svg>`;
    const file = new File([svgText], "logo.svg", { type: "image/svg+xml" });
    const shapes = await parseArtwork(file);
    expect(shapes.length).toBe(1);
  });

  it("parses a valid PDF file", async () => {
    const file = fixtureFile("vector-sample.pdf", "application/pdf");
    const shapes = await parseArtwork(file);
    expect(shapes.length).toBeGreaterThan(0);
  });

  it("rejects an unsupported file extension before attempting to parse", async () => {
    const file = new File(["not a logo"], "logo.png", { type: "image/png" });
    await expect(parseArtwork(file)).rejects.toThrow(UnsupportedFormatError);
  });

  it("rejects a file over the size cap before attempting to parse", async () => {
    const bigContent = new Uint8Array(10 * 1024 * 1024 + 1);
    const file = new File([bigContent], "logo.svg", { type: "image/svg+xml" });
    await expect(parseArtwork(file)).rejects.toThrow(FileTooLargeError);
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npm test -- parseArtwork.test.ts`
Expected: FAIL — `../parseArtwork` doesn't exist yet.

- [ ] **Step 3: Write `parseArtwork.ts`**

Create `src/components/configurator/parseArtwork.ts`:

```ts
import * as THREE from "three";
import { parseSvg } from "./parseSvg";
import { parsePdf } from "./parsePdf";
import { UnsupportedFormatError, FileTooLargeError } from "./parseErrors";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export async function parseArtwork(file: File): Promise<THREE.Shape[]> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new FileTooLargeError(file.size, MAX_FILE_SIZE_BYTES);
  }

  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "svg") {
    const text = await file.text();
    return parseSvg(text);
  }

  if (extension === "pdf") {
    const data = new Uint8Array(await file.arrayBuffer());
    return parsePdf(data);
  }

  throw new UnsupportedFormatError(file.name);
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npm test -- parseArtwork.test.ts`
Expected: `4 passed`.

- [ ] **Step 5: Run the full test suite to confirm nothing else broke**

Run: `npm test`
Expected: all tests across every file pass (sanity, types, parseSvg, parsePdf, parseArtwork, pdfToSvgSpike).

- [ ] **Step 5b: Verify TypeScript compiles cleanly**

`npm test` (Vitest) does **not** type-check — it transpiles and runs, so a type error can pass every test in this chunk while still breaking the real build. This chunk is the first to use real third-party type declarations (`three`, `pdfjs-dist`) beyond what Chunk 1's placeholder page needed, so confirm the build separately:

Run: `npm run build`
Expected: builds successfully with no TypeScript errors. If this fails, fix the type error before continuing — don't rely on `npm test` alone to validate this chunk's code going forward from here.

- [ ] **Step 6: Commit**

```bash
git add src/components/configurator/parseArtwork.ts src/components/configurator/__tests__/parseArtwork.test.ts
git commit -m "feat(configurator): add parseArtwork orchestrator dispatching by file extension"
```

---

**End of Chunk 2.** At this point: `parseArtwork(file)` is a fully unit-tested pure function covering every case in the spec's error taxonomy, for both SVG and PDF input, with known v1 limitations (malformed SVG winding, PDF hole detection, nested PDF transforms) explicitly documented in both code comments and tests rather than silently present. Nothing in this chunk touches React, three.js rendering, or the UI — it's pure parsing logic, ready for Chunk 3 (`SignPreview.tsx`) to consume.

---

## Chunk 3: 3D rendering — Trimless Letters

Builds the `react-three-fiber` scene for the Trimless Letters product: extrude the parsed shapes, apply two independent materials (face/return per the spec's "Face/return materials" section), implement the three illumination styles and the day/night toggle (per "Illumination model"), and render it through a fixed camera with an environment map for the photoreal reflections the design calls for.

**A note on testing in this chunk, up front:** per the spec's own Testing section, 3D rendering output isn't practical to unit test meaningfully — there's no automated assertion for "does this look like a photoreal channel letter." Every task below is verified by running the dev server and looking at it, not by a passing/failing test. This is a deliberate difference from Chunks 1-2, not an oversight — don't try to force unit tests onto this chunk's visual output.

### Task 1: HDRI environment asset

**Files:**
- Create: `public/configurator/studio.hdr` (binary asset, not code)

Per the spec's "Dependencies & performance" section: a small CC0 HDRI for the PBR reflections, low-resolution since it's for lighting/reflections only, not a visible background.

- [ ] **Step 1: Download and place the HDRI**

Go to polyhaven.com/hdris, pick a small neutral studio/indoor HDRI (e.g. search "studio small"), download the **1k resolution `.hdr`** file (not 2k/4k/8k — 1k is plenty for reflections-only use and keeps the lazy-loaded chunk small per the spec). Save it as `public/configurator/studio.hdr`.

Run: `ls -la public/configurator/studio.hdr` and confirm the file size is roughly in the 100KB-300KB range the spec targets. If the downloaded file is much larger, look for a smaller/more compressed variant on the same Poly Haven page before proceeding.

- [ ] **Step 2: Commit**

```bash
git add public/configurator/studio.hdr
git commit -m "chore(configurator): add HDRI environment asset for PBR reflections"
```

---

### Task 2: Shapes-to-geometry conversion with face/return material groups

**Files:**
- Create: `src/components/configurator/useSignGeometry.ts`

A small hook that takes the parsed `THREE.Shape[]` and a depth value, and produces one `THREE.ExtrudeGeometry` with two material groups — group 0 for the extruded side walls (the returns), group 1 for the front/back caps (the face) — per the spec's "Face/return materials" section. Pulled out of `SignPreview.tsx` into its own file because geometry construction (pure three.js, framework-agnostic) and scene/lighting composition (react-three-fiber JSX) are different concerns that change for different reasons.

- [ ] **Step 1: Write `useSignGeometry.ts`**

Create `src/components/configurator/useSignGeometry.ts`:

```ts
import { useMemo } from "react";
import * as THREE from "three";

/**
 * Builds one ExtrudeGeometry from the parsed artwork shapes, with two material
 * groups: index 0 = the extruded side walls (the "returns"), index 1 = the
 * front and back caps (the "face"). Depth is expressed as a fraction of the
 * combined shapes' bounding-box height, not an absolute unit — this keeps the
 * sign's proportions sensible regardless of the uploaded artwork's own scale,
 * since real-world inch values for Trimless's depth presets are still
 * unconfirmed (see the spec's "Trimless depth presets" section).
 */
export function useSignGeometry(shapes: THREE.Shape[], depthRatio: number): THREE.ExtrudeGeometry {
  return useMemo(() => {
    const combined = new THREE.ShapeGeometry(shapes);
    combined.computeBoundingBox();
    const bbox = combined.boundingBox!;
    const height = bbox.max.y - bbox.min.y || 1;
    combined.dispose();

    const depth = height * depthRatio;
    // Deliberately NOT calling clearGroups()/addGroup() here. ExtrudeGeometry
    // already assigns its own material groups when built from one or more
    // Shapes with bevelEnabled: false — materialIndex 0 for the front/back
    // caps, materialIndex 1 for the extruded side walls — and, critically for
    // multi-shape artwork (the normal case from parseArtwork), it emits one
    // cap+side GROUP PAIR PER SHAPE, not one global boundary for the whole
    // geometry. An earlier version of this hook tried to recompute that
    // boundary manually and was verified (by actually rendering it) to
    // produce a single pair of fully-overlapping groups covering the entire
    // geometry — i.e. no face/return split at all, for every shape count.
    // Trusting the built-in default groups, confirmed by live rendering to
    // already do this correctly, is both simpler and the thing that actually
    // works.
    const geometry = new THREE.ExtrudeGeometry(shapes, {
      depth,
      bevelEnabled: false,
      curveSegments: 12,
    });

    return geometry;
  }, [shapes, depthRatio]);
}
```

**Flag for whoever implements this task:** material index 0 is the caps (face), material index 1 is the sides (returns) — opposite of this file's first draft, which assumed sides=0/caps=1 before being corrected by actually rendering it (see `SignPreview.tsx` below, where `attach="material-0"` is the face material and `attach="material-1"` is the return material). If a future three.js upgrade changes this default convention, Task 3's visual check (now covering both single- and multi-shape test cases) is what would catch it — don't reintroduce manual group computation to "future-proof" this without re-verifying by actually rendering it, since that's exactly what broke the first time.

- [ ] **Step 2: Manual verification (no automated test — see chunk note above)**

There's no meaningful assertion to unit test here (the output is a GPU geometry buffer, not a value with an obvious expected shape). Verification happens visually in Task 3, once this hook is actually rendered.

- [ ] **Step 3: Commit**

```bash
git add src/components/configurator/useSignGeometry.ts
git commit -m "feat(configurator): add sign geometry hook with face/return material groups"
```

---

### Task 3: `SignPreview` scene — Trimless Letters

**Files:**
- Create: `src/components/configurator/SignPreview.tsx`

The `react-three-fiber` `<Canvas>` scene. Implements, for Trimless Letters specifically (Cast Block Acrylic is Chunk 4):
- Fixed camera, one 3/4-front angle (per spec: no orbit/zoom controls)
- `Environment` (drei) using Task 1's HDRI, for PBR reflections
- Face material (front/back caps) and return material (side walls), colors driven by config
- Illumination model per the spec:
  - face-lit: face material emissive at night, no backdrop plane
  - halo-lit: face never emissive, backdrop plane present (day and night), a light behind the shape turns on at night
  - dual-lit: both of the above together
- Bloom post-processing active only when something is emissive at night

- [ ] **Step 1: Write `SignPreview.tsx`**

Create `src/components/configurator/SignPreview.tsx`:

```tsx
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useSignGeometry } from "./useSignGeometry";
import type { TrimlessConfig } from "./types";

const DEPTH_RATIOS: Record<TrimlessConfig["depth"], number> = {
  slim: 0.08,
  standard: 0.15,
  max: 0.22,
};

// Placeholder hex values for the curated swatch names — real fabricable paint
// codes should replace these before launch (see spec: "a curated swatch list
// of colors Sunlite can actually fabricate," not a free picker — these
// specific hex values are this plan's placeholder, not confirmed brand colors).
const SWATCH_HEX: Record<string, string> = {
  white: "#f2f2f2",
  black: "#1a1a1a",
  red: "#b4332a",
  blue: "#2b4c8c",
  custom: "#999999",
};

interface TrimlessSceneProps {
  shapes: THREE.Shape[];
  config: TrimlessConfig;
}

function TrimlessScene({ shapes, config }: TrimlessSceneProps) {
  const geometry = useSignGeometry(shapes, DEPTH_RATIOS[config.depth]);
  const isNight = config.dayNight === "night";
  const showBacking = config.illumination === "halo-lit" || config.illumination === "dual-lit";
  const faceGlows = isNight && (config.illumination === "face-lit" || config.illumination === "dual-lit");
  const haloGlows = isNight && showBacking;
  const bloomActive = faceGlows || haloGlows;

  // material-0 = front/back caps = the face; material-1 = extruded sides =
  // the returns — this mapping is ExtrudeGeometry's own default group
  // convention (see useSignGeometry.ts), confirmed by actually rendering it.
  const faceMaterial = (
    <meshPhysicalMaterial
      attach="material-0"
      color={SWATCH_HEX[config.faceColor]}
      metalness={0.1}
      roughness={0.3}
      emissive={faceGlows ? SWATCH_HEX[config.faceColor] : "#000000"}
      emissiveIntensity={faceGlows ? 1.5 : 0}
    />
  );

  const returnMaterial = (
    <meshPhysicalMaterial
      attach="material-1"
      color={SWATCH_HEX[config.returnColor]}
      metalness={0.6}
      roughness={0.4}
    />
  );

  return (
    <>
      <mesh geometry={geometry}>
        {returnMaterial}
        {faceMaterial}
      </mesh>

      {showBacking && (
        <mesh position={[0, 0, -0.5]}>
          <planeGeometry args={[4, 4]} />
          <meshStandardMaterial color="#e8e8e8" />
        </mesh>
      )}

      {haloGlows && (
        <pointLight position={[0, 0, -0.3]} intensity={3} distance={3} color="#fff4e0" />
      )}

      {bloomActive && (
        <EffectComposer>
          <Bloom intensity={0.8} luminanceThreshold={0.4} luminanceSmoothing={0.2} />
        </EffectComposer>
      )}
    </>
  );
}

interface SignPreviewProps {
  shapes: THREE.Shape[];
  config: TrimlessConfig;
}

export default function SignPreview({ shapes, config }: SignPreviewProps) {
  const isNight = config.dayNight === "night";

  return (
    <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-border bg-card">
      <Canvas camera={{ position: [2.2, 1.2, 4], fov: 35 }}>
        <ambientLight intensity={isNight ? 0.15 : 0.6} />
        <directionalLight position={[3, 5, 2]} intensity={isNight ? 0.3 : 1} />
        <Environment files="/configurator/studio.hdr" />
        <TrimlessScene shapes={shapes} config={config} />
      </Canvas>
    </div>
  );
}
```

**Flag for whoever implements this task:** the specific numeric values (camera position, light intensities, bloom parameters, material roughness/metalness) are starting points, not tuned final values — the spec explicitly calls for a photoreal result, and getting there is iterative visual tuning by eye, not something determinable from documentation alone. Expect to adjust every number in this file while doing Step 2 below.

- [ ] **Step 2: Wire it into the placeholder page temporarily and visually verify**

This component isn't connected to real file upload yet (that's Chunk 5) — temporarily hardcode test shapes to verify the scene renders at all before Chunk 5 wires up the real upload flow. Use **two disjoint shapes**, not one — a single-shape test would not have caught the earlier (now-fixed) multi-shape material-grouping bug, since `ExtrudeGeometry` produces one cap+side group pair *per shape*, and a one-shape test can't distinguish "grouping works" from "grouping works for exactly one shape." Modify `src/pages/ConfiguratorPage.tsx` (from Chunk 1 Task 5) to temporarily render it with two hand-built test shapes, modeling a simple two-letter logo:

```tsx
import * as THREE from "three";
import Seo from "../components/Seo";
import SignPreview from "../components/configurator/SignPreview";

function makeSquare(offsetX: number): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(offsetX - 0.8, -1);
  shape.lineTo(offsetX + 0.8, -1);
  shape.lineTo(offsetX + 0.8, 1);
  shape.lineTo(offsetX - 0.8, 1);
  shape.closePath();
  return shape;
}

const testShapes = [makeSquare(-1.2), makeSquare(1.2)];

export default function ConfiguratorPage() {
  return (
    <div className="pt-28 pb-24 max-w-7xl mx-auto px-6">
      <Seo
        title="Sign Configurator"
        description="Upload your logo and see it rendered as a 3D channel-letter sign before you request a quote."
        path="/configurator"
      />
      <h1 className="text-5xl md:text-7xl mb-4">Sign Configurator</h1>
      <SignPreview
        shapes={testShapes}
        config={{
          product: "trimless-letters",
          illumination: "face-lit",
          depth: "standard",
          faceColor: "white",
          returnColor: "black",
          dayNight: "day",
        }}
      />
    </div>
  );
}
```

Run `npm run dev`, visit `/configurator`, and confirm:
- Two separate 3D extruded squares render side by side (not a blank canvas, not a console error)
- **Both** squares have visually distinct side (dark/black) and front-face (light/white) coloring — check both, not just one, since the bug this test is specifically designed to catch would show correct coloring on a single shape while still being broken for additional shapes
- Manually edit the hardcoded `config` object in this test wiring to cycle through all 3 illumination styles × both day/night states, confirming: face-lit glows only the face at night, halo-lit shows the backdrop plane in both day and night but only glows it at night, dual-lit does both

Revert this temporary wiring once verified — Chunk 5 replaces it with the real upload-driven flow. Leave a one-line comment marking it as temporary so Chunk 5's starting point is obvious:

```tsx
// TEMPORARY test wiring for Chunk 3's visual verification — replaced in Chunk 5.
```

- [ ] **Step 3: Verify the build still succeeds**

Run: `npm run build`
Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/configurator/SignPreview.tsx src/pages/ConfiguratorPage.tsx
git commit -m "feat(configurator): add SignPreview 3D scene for Trimless Letters"
```

---

**End of Chunk 3.** At this point: uploading a shape and rendering it as a photoreal-ish 3D Trimless Letters sign works, with all 3 illumination styles and the day/night toggle functioning (even though the exact visual tuning is provisional, per this chunk's flagged notes). `ConfiguratorPage.tsx` currently renders this via temporary hardcoded test data — Chunk 4 adds Cast Block Acrylic's reduced model and the real `ConfigControls` UI, and Chunk 5 replaces the temporary wiring with the real upload flow.

---

## Chunk 4: Cast Block Acrylic model, ConfigControls, and product selection

Adds the second product's reduced rendering model (per the spec's "Face/return materials" section: one material, no illumination-style selector, no backdrop), the UI controls that drive config state for both products, and the chooser that picks which product is being configured. Same testing approach as Chunk 3: visual/manual verification for rendering, since there's nothing meaningful to unit-test about 3D output — but `ConfigControls` is plain React/DOM, so it gets real component tests.

### Task 1: Extract `TrimlessScene` into its own file

**Files:**
- Create: `src/components/configurator/TrimlessScene.tsx`
- Modify: `src/components/configurator/SignPreview.tsx`

Chunk 3 defined `TrimlessScene` inline inside `SignPreview.tsx` because it was the only scene that existed. Now that a second product scene is being added, `SignPreview.tsx` should be a thin dispatcher (shared `<Canvas>`, lighting, and environment, picking which scene to render by product) rather than a file containing one product's entire rendering logic — splitting by responsibility (each product's rendering concerns) rather than by layer, per this plan's file-structure guidance.

- [ ] **Step 1: Move `TrimlessScene` to its own file**

Create `src/components/configurator/TrimlessScene.tsx` containing exactly the `DEPTH_RATIOS` constant, `SWATCH_HEX` constant, `TrimlessSceneProps` interface, and `TrimlessScene` function that Chunk 3 Task 3 put inline in `SignPreview.tsx` (copy them verbatim from that file), plus the necessary imports (`THREE`, `useSignGeometry`, `TrimlessConfig`, `EffectComposer`/`Bloom`). Export `TrimlessScene` as the default export.

- [ ] **Step 2: Reduce `SignPreview.tsx` to a dispatcher**

Modify `src/components/configurator/SignPreview.tsx` to remove everything now living in `TrimlessScene.tsx`, keeping only the `<Canvas>` wrapper, shared lighting/environment, and a product-based dispatch:

```tsx
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import TrimlessScene from "./TrimlessScene";
import type { ProductConfig } from "./types";

interface SignPreviewProps {
  shapes: THREE.Shape[];
  config: ProductConfig;
}

export default function SignPreview({ shapes, config }: SignPreviewProps) {
  const isNight = config.dayNight === "night";

  return (
    <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-border bg-card">
      <Canvas camera={{ position: [2.2, 1.2, 4], fov: 35 }}>
        <ambientLight intensity={isNight ? 0.15 : 0.6} />
        <directionalLight position={[3, 5, 2]} intensity={isNight ? 0.3 : 1} />
        <Environment files="/configurator/studio.hdr" />
        {config.product === "trimless-letters" ? (
          <TrimlessScene shapes={shapes} config={config} />
        ) : (
          <AcrylicScene shapes={shapes} config={config} />
        )}
      </Canvas>
    </div>
  );
}
```

This references `AcrylicScene`, which doesn't exist yet — Task 2 creates it. Add the import once that file exists (next task); this file won't compile until then, which is expected and fixed within this same chunk.

- [ ] **Step 3: Commit** (deferred to the end of Task 2, once the file compiles again — see that task's commit step, which includes both files together)

---

### Task 2: `AcrylicScene` — Cast Block Acrylic's reduced model

**Files:**
- Create: `src/components/configurator/AcrylicScene.tsx`
- Modify: `src/components/configurator/SignPreview.tsx` (add the import now that this file exists)

Per the spec: one material (no face/return split), a translucency/color choice from Clear/Opal/Custom, no illumination-style selector (it glows evenly from within, not via a chosen style), no backdrop plane, a single fixed thickness (no depth control).

- [ ] **Step 1: Write `AcrylicScene.tsx`**

Create `src/components/configurator/AcrylicScene.tsx`:

```tsx
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useSignGeometry } from "./useSignGeometry";
import type { CastBlockAcrylicConfig } from "./types";

// Per the spec's "Face/return materials" section: services.ts publishes no
// real depth/thickness spec for this product, so this is a placeholder
// needing confirmation against real fabrication limits before launch — same
// caveat as Trimless's depth presets in TrimlessScene.tsx.
const ACRYLIC_DEPTH_RATIO = 0.1;

// Placeholder hex/physical values for Cast Block Acrylic's real color options
// (Clear / Opal / Custom per services.ts) — not confirmed material specs.
const ACRYLIC_APPEARANCE: Record<CastBlockAcrylicConfig["acrylicColor"], { color: string; transmission: number }> = {
  clear: { color: "#ffffff", transmission: 0.85 },
  opal: { color: "#f2ede1", transmission: 0.5 },
  custom: { color: "#cfcfcf", transmission: 0.3 },
};

interface AcrylicSceneProps {
  shapes: THREE.Shape[];
  config: CastBlockAcrylicConfig;
}

export default function AcrylicScene({ shapes, config }: AcrylicSceneProps) {
  const geometry = useSignGeometry(shapes, ACRYLIC_DEPTH_RATIO);
  const isNight = config.dayNight === "night";
  const appearance = ACRYLIC_APPEARANCE[config.acrylicColor];

  return (
    <>
      {/* One material for the whole mesh — no face/return split, per the
          spec: a solid cast block has no face/return distinction. Passing a
          single material (not an array) applies it across every group
          ExtrudeGeometry generated, regardless of the multi-shape grouping
          behavior documented in useSignGeometry.ts. */}
      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          color={appearance.color}
          transmission={appearance.transmission}
          roughness={0.15}
          thickness={0.5}
          emissive={isNight ? appearance.color : "#000000"}
          emissiveIntensity={isNight ? 1.2 : 0}
        />
      </mesh>

      {isNight && (
        <EffectComposer>
          <Bloom intensity={0.6} luminanceThreshold={0.4} luminanceSmoothing={0.2} />
        </EffectComposer>
      )}
    </>
  );
}
```

**Flag for whoever implements this task:** same as `TrimlessScene.tsx` — the numeric material values are starting points for visual tuning, not final. `transmission` on `meshPhysicalMaterial` requires the renderer to support transmission rendering (an extra off-screen render pass); if it doesn't visually read as translucent in Step 2's check below, confirm `Canvas`'s default renderer settings support it before spending time tuning other numbers — this is an all-or-nothing rendering capability, not a tuning knob.

- [ ] **Step 2: Fix the `SignPreview.tsx` import now that `AcrylicScene` exists**

Modify `src/components/configurator/SignPreview.tsx` — add the import:

```tsx
import AcrylicScene from "./AcrylicScene";
```

- [ ] **Step 3: Visually verify both products render, using the same temporary test wiring from Chunk 3**

Run `npm run dev`, visit `/configurator`. Temporarily edit `src/pages/ConfiguratorPage.tsx`'s hardcoded `config` object (the one marked `// TEMPORARY test wiring...` from Chunk 3 Task 3 Step 2) to `product: "cast-block-acrylic"` with `acrylicColor: "clear"` instead of the Trimless fields, and confirm:
- The two test squares render as one translucent-looking material (not metal/painted like Trimless). **If translucency looks subtle or ambiguous in plain daylight against the default HDRI** (it's a real effect but can be hard to eyeball against this scene's default background), temporarily place a bright/colored plane a short distance behind the mesh — if its color visibly bleeds through, transmission is working correctly and it's just a lighting-contrast issue with the default test scene, not a broken renderer. Remove the test plane afterward.
- No face/return color distinction is visible (both squares are the same single material)
- Toggling `dayNight` to `"night"` makes it glow evenly, with no backdrop plane appearing (there should be none — Cast Block Acrylic never shows one)

Revert the config back to the Trimless test values afterward (or leave it on whichever product, since Chunk 5 replaces this whole temporary block anyway — just don't lose track of which state it's in before Chunk 5 starts).

- [ ] **Step 4: Verify the build succeeds**

Run: `npm run build`
Expected: no TypeScript errors (this confirms Task 1's dispatcher and Task 2's new scene compile together correctly).

- [ ] **Step 5: Commit** (covers both Task 1 and Task 2, since `SignPreview.tsx` wasn't in a compiling state between them)

```bash
git add src/components/configurator/TrimlessScene.tsx src/components/configurator/AcrylicScene.tsx src/components/configurator/SignPreview.tsx src/pages/ConfiguratorPage.tsx
git commit -m "feat(configurator): add Cast Block Acrylic rendering and split SignPreview by product"
```

---

### Task 3: `ConfigControls`

**Files:**
- Create: `src/components/configurator/ConfigControls.tsx`
- Test: `src/components/configurator/__tests__/ConfigControls.test.tsx`
- Modify: `vitest.config.ts` (add jsdom's React Testing Library setup)

The config-state UI, branching per product per the spec: Trimless gets illumination style, depth, face color, return color, day/night; Cast Block Acrylic gets just acrylic color and day/night. Unlike the 3D rendering chunks, this is plain React/DOM and genuinely unit-testable with React Testing Library.

- [ ] **Step 1: Add React Testing Library**

Run: `npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event`

Modify `vitest.config.ts` to add the jest-dom matchers (extends `expect` with things like `toBeInTheDocument`):

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@project": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

Create `vitest.setup.ts` (project root):

```ts
import "@testing-library/jest-dom/vitest";
```

**This alone is not enough for `npm run build` to type-check cleanly.** `vitest.setup.ts` registers jest-dom's matchers (`toBeInTheDocument`, etc.) at test-run time via Vitest's `setupFiles` — a separate mechanism from what `tsc -b` type-checks. This project's `tsconfig.app.json` only includes `src`, and neither `tsconfig.app.json` nor `tsconfig.node.json` includes a root-level `vitest.setup.ts` — so without a further step, every test file using a jest-dom matcher type-checks fine under Vitest but fails `tsc -b`/`npm run build` with `TS2339: Property 'toBeInTheDocument' does not exist...`. Add the type augmentation separately, under `src` where it's already included:

Create `src/vitest-env.d.ts`:

```ts
/// <reference types="@testing-library/jest-dom/vitest" />
```

- [ ] **Step 2: Write the failing tests**

Create `src/components/configurator/__tests__/ConfigControls.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfigControls from "../ConfigControls";
import { defaultConfigFor } from "../types";
import type { ProductConfig } from "../types";

describe("ConfigControls", () => {
  it("shows Trimless-only controls when configuring Trimless Letters", () => {
    render(<ConfigControls config={defaultConfigFor("trimless-letters")} onChange={vi.fn()} />);
    expect(screen.getByLabelText(/illumination/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/depth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/face color/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/return color/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/day.*night|night.*day/i)).toBeInTheDocument();
  });

  it("shows only acrylic color and day/night for Cast Block Acrylic, no illumination/depth/return controls", () => {
    render(<ConfigControls config={defaultConfigFor("cast-block-acrylic")} onChange={vi.fn()} />);
    expect(screen.getByLabelText(/acrylic color/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/day.*night|night.*day/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/illumination/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^depth/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/return color/i)).not.toBeInTheDocument();
  });

  it("calls onChange with an updated config when the day/night toggle is used", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const config = defaultConfigFor("trimless-letters");
    render(<ConfigControls config={config} onChange={onChange} />);

    await user.click(screen.getByLabelText(/day.*night|night.*day/i));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ dayNight: "night" })
    );
  });

  it("calls onChange with an updated illumination style for Trimless", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const config = defaultConfigFor("trimless-letters");
    render(<ConfigControls config={config} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText(/illumination/i), "halo-lit");

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ illumination: "halo-lit" })
    );
  });
});
```

- [ ] **Step 3: Run the tests to confirm they fail**

Run: `npm test -- ConfigControls.test.tsx`
Expected: FAIL — `../ConfigControls` doesn't exist yet.

- [ ] **Step 4: Write `ConfigControls.tsx`**

Create `src/components/configurator/ConfigControls.tsx`:

```tsx
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
```

- [ ] **Step 5: Run the tests to confirm they pass**

Run: `npm test -- ConfigControls.test.tsx`
Expected: `4 passed`.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts vitest.setup.ts src/vitest-env.d.ts package.json package-lock.json src/components/configurator/ConfigControls.tsx src/components/configurator/__tests__/ConfigControls.test.tsx
git commit -m "feat(configurator): add ConfigControls with per-product control sets"
```

---

### Task 4: Product chooser

**Files:**
- Create: `src/components/configurator/ProductChooser.tsx`
- Test: `src/components/configurator/__tests__/ProductChooser.test.tsx`

Per the spec's "Product selection" section: shown when no product is pre-selected (arriving from the plain `/configurator` nav entry); skipped when arriving from a product page's link (Chunk 5 handles reading the query param and conditionally skipping this).

- [ ] **Step 1: Write the failing tests**

Create `src/components/configurator/__tests__/ProductChooser.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductChooser from "../ProductChooser";

describe("ProductChooser", () => {
  it("renders both product options", () => {
    render(<ProductChooser onSelect={vi.fn()} />);
    expect(screen.getByText(/trimless letters/i)).toBeInTheDocument();
    expect(screen.getByText(/cast block acrylic/i)).toBeInTheDocument();
  });

  it("calls onSelect with 'trimless-letters' when that option is chosen", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ProductChooser onSelect={onSelect} />);
    await user.click(screen.getByText(/trimless letters/i));
    expect(onSelect).toHaveBeenCalledWith("trimless-letters");
  });

  it("calls onSelect with 'cast-block-acrylic' when that option is chosen", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ProductChooser onSelect={onSelect} />);
    await user.click(screen.getByText(/cast block acrylic/i));
    expect(onSelect).toHaveBeenCalledWith("cast-block-acrylic");
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npm test -- ProductChooser.test.tsx`
Expected: FAIL — `../ProductChooser` doesn't exist yet.

- [ ] **Step 3: Write `ProductChooser.tsx`**

Create `src/components/configurator/ProductChooser.tsx`:

```tsx
import type { Product } from "./types";

interface ProductChooserProps {
  onSelect: (product: Product) => void;
}

export default function ProductChooser({ onSelect }: ProductChooserProps) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <button
        onClick={() => onSelect("trimless-letters")}
        className="text-left p-6 rounded-xl border border-border bg-card hover:border-primary/60 transition-colors"
      >
        <h3 className="text-xl font-semibold mb-1">Trimless Letters</h3>
        <p className="text-sm text-muted-foreground">
          Ultra-slim channel letters — face-lit, halo-lit, or dual-lit.
        </p>
      </button>
      <button
        onClick={() => onSelect("cast-block-acrylic")}
        className="text-left p-6 rounded-xl border border-border bg-card hover:border-primary/60 transition-colors"
      >
        <h3 className="text-xl font-semibold mb-1">Cast Block Acrylic</h3>
        <p className="text-sm text-muted-foreground">
          Solid cast acrylic letters with even internal glow.
        </p>
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npm test -- ProductChooser.test.tsx`
Expected: `3 passed`.

- [ ] **Step 5: Run the full test suite and build to confirm nothing else broke**

Run: `npm test`
Expected: all tests pass across every file.

Run: `npm run build`
Expected: no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/configurator/ProductChooser.tsx src/components/configurator/__tests__/ProductChooser.test.tsx
git commit -m "feat(configurator): add ProductChooser for the no-pre-selection entry path"
```

---

**End of Chunk 4.** At this point: both products render correctly (verified visually), `ConfigControls` drives config state for whichever product is selected with full test coverage of its branching logic, and `ProductChooser` exists for the plain-nav-entry path. Nothing is wired into the real page flow yet — `ConfiguratorPage.tsx` still uses Chunk 3's temporary hardcoded test wiring. Chunk 5 replaces that with the real upload flow, product-selection routing (query param vs. chooser), and the final page assembly.

---

## Chunk 5: Upload flow, error handling UI, WebGL gate, and final page assembly

Replaces the temporary test wiring with the real flow: WebGL feature detection, the file upload UI (with the spec's error taxonomy surfaced as actual user-facing messages), product selection (query param or chooser, with switching support), and the two end-to-end smoke tests the spec calls for.

### Task 1: WebGL support detection

**Files:**
- Create: `src/components/configurator/webglSupport.ts`
- Test: `src/components/configurator/__tests__/webglSupport.test.ts`

Per the spec's Error handling section: feature-detect WebGL on page load and show a static fallback message rather than a blank canvas or crash.

- [ ] **Step 1: Write the failing tests**

Create `src/components/configurator/__tests__/webglSupport.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npm test -- webglSupport.test.ts`
Expected: FAIL — `../webglSupport` doesn't exist yet.

- [ ] **Step 3: Write `webglSupport.ts`**

Create `src/components/configurator/webglSupport.ts`:

```ts
import { useEffect, useState } from "react";

export function isWebglSupported(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

export function useWebglSupported(): boolean {
  const [supported, setSupported] = useState(true);
  useEffect(() => {
    setSupported(isWebglSupported());
  }, []);
  return supported;
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npm test -- webglSupport.test.ts`
Expected: `3 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/components/configurator/webglSupport.ts src/components/configurator/__tests__/webglSupport.test.ts
git commit -m "feat(configurator): add WebGL support detection"
```

---

### Task 2: `UploadDropzone`

**Files:**
- Create: `src/components/configurator/UploadDropzone.tsx`
- Test: `src/components/configurator/__tests__/UploadDropzone.test.tsx`

Per the spec's Accessibility section: a real `<input type="file">`, keyboard-focusable and labeled, not drag-and-drop-only (drag-and-drop is additive, not a replacement). Per Error handling: each typed error from `parseArtwork` gets its own specific user-facing message.

- [ ] **Step 1: Write the failing tests**

Create `src/components/configurator/__tests__/UploadDropzone.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as THREE from "three";
import UploadDropzone from "../UploadDropzone";
import { parseArtwork } from "../parseArtwork";
import { NoVectorPathsFoundError, UnsupportedFormatError } from "../parseErrors";

vi.mock("../parseArtwork", () => ({
  parseArtwork: vi.fn(),
}));

describe("UploadDropzone", () => {
  it("calls onParsed with the shapes when parsing succeeds", async () => {
    const user = userEvent.setup();
    const shape = new THREE.Shape();
    vi.mocked(parseArtwork).mockResolvedValue([shape]);
    const onParsed = vi.fn();

    render(<UploadDropzone onParsed={onParsed} />);
    const file = new File(["<svg></svg>"], "logo.svg", { type: "image/svg+xml" });
    await user.upload(screen.getByLabelText(/upload your logo/i), file);

    await waitFor(() => expect(onParsed).toHaveBeenCalledWith([shape]));
  });

  it("shows the specific NoVectorPathsFoundError message when parsing fails that way", async () => {
    const user = userEvent.setup();
    vi.mocked(parseArtwork).mockRejectedValue(new NoVectorPathsFoundError());
    render(<UploadDropzone onParsed={vi.fn()} />);
    const file = new File(["<svg></svg>"], "logo.svg", { type: "image/svg+xml" });
    await user.upload(screen.getByLabelText(/upload your logo/i), file);

    expect(await screen.findByText(/couldn't find a clean outline/i)).toBeInTheDocument();
  });

  it("shows the specific UnsupportedFormatError message when parsing fails that way", async () => {
    // applyAccept: false — the dropzone's <input accept=".svg,.pdf"> makes
    // user-event's default accept-filtering silently drop a .png before it
    // ever reaches onChange, which isn't the thing this test is checking.
    // (In a real browser, the native file picker's own accept filter plays
    // the same role the dropzone's `accept` attribute is meant for; the only
    // realistic way an unsupported file reaches this component is via
    // drag-and-drop, which handleDrop does not pre-filter — this test models
    // that path by bypassing accept-filtering on the input instead.)
    const user = userEvent.setup({ applyAccept: false });
    vi.mocked(parseArtwork).mockRejectedValue(new UnsupportedFormatError("logo.png"));
    render(<UploadDropzone onParsed={vi.fn()} />);
    const file = new File(["not a logo"], "logo.png", { type: "image/png" });
    await user.upload(screen.getByLabelText(/upload your logo/i), file);

    expect(await screen.findByText(/unsupported file type/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npm test -- UploadDropzone.test.tsx`
Expected: FAIL — `../UploadDropzone` doesn't exist yet.

- [ ] **Step 3: Write `UploadDropzone.tsx`**

Create `src/components/configurator/UploadDropzone.tsx`:

```tsx
import { useState, type ChangeEvent, type DragEvent } from "react";
import * as THREE from "three";
import { parseArtwork } from "./parseArtwork";

interface UploadDropzoneProps {
  onParsed: (shapes: THREE.Shape[]) => void;
}

export default function UploadDropzone({ onParsed }: UploadDropzoneProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      const shapes = await parseArtwork(file);
      onParsed(shapes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong reading that file.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="border-2 border-dashed border-border rounded-xl p-10 text-center"
    >
      <label htmlFor="artwork-upload" className="block mb-3 font-medium">
        Upload your logo (SVG or PDF)
      </label>
      <input id="artwork-upload" type="file" accept=".svg,.pdf" onChange={handleChange} className="mx-auto" />
      {loading && <p className="text-sm text-muted-foreground mt-3">Reading file…</p>}
      {error && (
        <p className="text-sm text-destructive mt-3" role="alert">
          {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-4">
        Need to send us your artwork directly instead?{" "}
        <a href="/contact" className="underline">Contact us</a>.
      </p>
    </div>
  );
}
```

Every typed error's `message` (set in each error class's constructor in `parseErrors.ts`, Chunk 2 Task 1) already contains the exact spec-mandated wording — this component just surfaces `err.message` directly rather than re-mapping each error type to a duplicate string, so the two can't drift out of sync.

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npm test -- UploadDropzone.test.tsx`
Expected: `3 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/components/configurator/UploadDropzone.tsx src/components/configurator/__tests__/UploadDropzone.test.tsx
git commit -m "feat(configurator): add UploadDropzone with spec-mandated error messages"
```

---

### Task 3: Final `ConfiguratorPage` assembly

**Files:**
- Modify: `src/pages/ConfiguratorPage.tsx` (replaces Chunk 3/4's temporary test wiring entirely)

Per the spec's "Product selection" section: a product pre-selected via `?product=` query param (set by Chunk 1 Task 6's product-page links) skips the chooser; arriving with no query param shows `ProductChooser`; switching products after upload keeps the already-parsed shapes and only resets config to the new product's defaults.

- [ ] **Step 1: Write the final page**

Replace the entire contents of `src/pages/ConfiguratorPage.tsx`:

```tsx
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import * as THREE from "three";
import { Button } from "@project/components/ui/button";
import Seo from "../components/Seo";
import ProductChooser from "../components/configurator/ProductChooser";
import UploadDropzone from "../components/configurator/UploadDropzone";
import ConfigControls from "../components/configurator/ConfigControls";
import SignPreview from "../components/configurator/SignPreview";
import { useWebglSupported } from "../components/configurator/webglSupport";
import { defaultConfigFor } from "../components/configurator/types";
import type { Product, ProductConfig } from "../components/configurator/types";

function isValidProduct(value: string | null): value is Product {
  return value === "trimless-letters" || value === "cast-block-acrylic";
}

export default function ConfiguratorPage() {
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get("product");
  const initialProduct = isValidProduct(preselected) ? preselected : null;

  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [config, setConfig] = useState<ProductConfig | null>(
    initialProduct ? defaultConfigFor(initialProduct) : null
  );
  const [shapes, setShapes] = useState<THREE.Shape[] | null>(null);

  const webglSupported = useWebglSupported();

  function handleSelectProduct(selected: Product) {
    setProduct(selected);
    setConfig(defaultConfigFor(selected)); // shapes, if any, are intentionally left as-is — parsing is product-agnostic.
  }

  if (!webglSupported) {
    return (
      <div className="pt-28 pb-24 max-w-2xl mx-auto px-6 text-center">
        <Seo
          title="Sign Configurator"
          description="Upload your logo and see it rendered as a 3D channel-letter sign before you request a quote."
          path="/configurator"
        />
        <h1 className="text-3xl font-bold mb-4">3D preview isn't supported in this browser</h1>
        <p className="text-muted-foreground mb-6">
          You can still send us your logo directly and we'll quote it by hand.
        </p>
        <Button asChild size="lg">
          <Link to="/contact">Get a Quote</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-24 max-w-7xl mx-auto px-6">
      <Seo
        title="Sign Configurator"
        description="Upload your logo and see it rendered as a 3D channel-letter sign before you request a quote."
        path="/configurator"
      />
      <h1 className="text-5xl md:text-7xl mb-4">Sign Configurator</h1>

      {!product && <ProductChooser onSelect={handleSelectProduct} />}

      {product && config && (
        <>
          <button
            onClick={() => setProduct(null)}
            className="text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            ← Switch product
          </button>

          {!shapes && <UploadDropzone onParsed={setShapes} />}

          {shapes && (
            <div className="grid lg:grid-cols-[2fr_1fr] gap-8 mt-6">
              <SignPreview shapes={shapes} config={config} />
              <div className="space-y-6">
                <ConfigControls config={config} onChange={setConfig} />
                <Button asChild size="lg" className="w-full">
                  <Link to="/contact">Get a Quote</Link>
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Manually verify the full flow**

Run `npm run dev`, then:
- Visit `/configurator` directly: confirm `ProductChooser` appears.
- Click "Trimless Letters," upload a real SVG logo (any simple one), confirm the preview and `ConfigControls` appear with Trimless's full control set, and all previously-verified illumination/day-night/color behavior still works.
- Click "← Switch product," choose "Cast Block Acrylic": confirm the **same uploaded shapes** still render (no re-upload prompt), now with Cast Block Acrylic's reduced control set.
- Visit `/configurator?product=cast-block-acrylic` directly (simulating the link from the Cast Block Acrylic product page): confirm the chooser is skipped and the upload step appears immediately for that product.
- Upload an unsupported file type (e.g. a `.png`): confirm the specific error message appears, not a crash.
- Click "Get a Quote": confirm it navigates to `/contact`.

- [ ] **Step 3: Verify the build succeeds**

Run: `npm run build`
Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/ConfiguratorPage.tsx
git commit -m "feat(configurator): assemble final ConfiguratorPage with upload flow and product switching"
```

---

### Task 4: End-to-end smoke tests

**Files:**
- Test: `src/pages/__tests__/ConfiguratorPage.test.tsx`

Per the spec's Testing section: one smoke test per product, since they exercise different control sets. `SignPreview` is mocked out (it renders a real WebGL `<Canvas>`, which doesn't function in jsdom) — these tests are about the page's wiring and state flow (upload → config → navigation), not 3D rendering, which Chunks 3-4's manual checks already covered.

- [ ] **Step 1: Write the tests**

Create `src/pages/__tests__/ConfiguratorPage.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import * as THREE from "three";
import ConfiguratorPage from "../ConfiguratorPage";
import { parseArtwork } from "../../components/configurator/parseArtwork";

vi.mock("../../components/configurator/parseArtwork", () => ({
  parseArtwork: vi.fn(),
}));

vi.mock("../../components/configurator/SignPreview", () => ({
  default: () => <div data-testid="sign-preview-stub" />,
}));

// jsdom has no real WebGL, so the real isWebglSupported() genuinely returns
// false in this test environment (confirmed by Task 1's own test file) —
// without this mock, ConfiguratorPage renders its WebGL-unavailable fallback
// instead of the chooser/upload/config flow these tests exercise. This mock
// and the SignPreview mock above are solving opposite problems that happen to
// look similar: SignPreview is mocked because real WebGL rendering doesn't
// work here; webglSupport is mocked because jsdom's FAKE "no WebGL" would
// otherwise make the page behave as if a real user's browser can't render 3D
// at all, which isn't what these tests are checking.
vi.mock("../../components/configurator/webglSupport", () => ({
  useWebglSupported: () => true,
  isWebglSupported: () => true,
}));

function renderPage(initialPath: string) {
  render(
    // ConfiguratorPage renders <Seo>, which needs a <HelmetProvider> ancestor
    // (react-helmet-async throws otherwise) — in the real app this is
    // supplied once, globally, by src/main.tsx. Tests that render
    // ConfiguratorPage standalone need to provide it themselves, the same
    // kind of test-harness-vs-real-root gap the webglSupport mock above
    // addresses.
    <HelmetProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/configurator" element={<ConfiguratorPage />} />
          <Route path="/contact" element={<div>Contact Page</div>} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe("ConfiguratorPage end-to-end smoke tests", () => {
  it("Trimless path: choose product, upload, change illumination, toggle day/night, reach Get a Quote", async () => {
    const user = userEvent.setup();
    vi.mocked(parseArtwork).mockResolvedValue([new THREE.Shape()]);

    renderPage("/configurator");

    await user.click(screen.getByText(/trimless letters/i));

    const file = new File(["<svg></svg>"], "logo.svg", { type: "image/svg+xml" });
    await user.upload(screen.getByLabelText(/upload your logo/i), file);

    expect(await screen.findByTestId("sign-preview-stub")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/illumination/i), "halo-lit");
    await user.click(screen.getByLabelText(/day.*night|night.*day/i));

    expect(screen.getByRole("link", { name: /get a quote/i })).toHaveAttribute("href", "/contact");
  });

  it("Cast Block Acrylic path: pre-selected via query param, upload, change acrylic color, toggle day/night, reach Get a Quote", async () => {
    const user = userEvent.setup();
    vi.mocked(parseArtwork).mockResolvedValue([new THREE.Shape()]);

    renderPage("/configurator?product=cast-block-acrylic");

    expect(screen.queryByText(/trimless letters/i)).not.toBeInTheDocument();

    const file = new File(["<svg></svg>"], "logo.svg", { type: "image/svg+xml" });
    await user.upload(screen.getByLabelText(/upload your logo/i), file);

    expect(await screen.findByTestId("sign-preview-stub")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/acrylic color/i), "opal");
    await user.click(screen.getByLabelText(/day.*night|night.*day/i));

    expect(screen.getByRole("link", { name: /get a quote/i })).toHaveAttribute("href", "/contact");
  });
});
```

- [ ] **Step 2: Run the tests**

Run: `npm test -- ConfiguratorPage.test.tsx`
Expected: `2 passed`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/__tests__/ConfiguratorPage.test.tsx
git commit -m "test(configurator): add end-to-end smoke tests for both product flows"
```

---

### Task 5: Full suite verification and manual cross-device QA

**Files:** none (verification only)

- [ ] **Step 1: Run the entire test suite**

Run: `npm test`
Expected: every test across the whole project passes (sanity, types, parseErrors/parseSvg/parsePdf/parseArtwork, webglSupport, ConfigControls, ProductChooser, UploadDropzone, ConfiguratorPage).

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: builds successfully with no TypeScript errors, and the `/configurator` route still appears as its own separate chunk in the build output (per Chunk 1 Task 4's code-splitting check — confirm it's still split now that it has real content, not just a placeholder).

- [ ] **Step 3: Manual cross-browser/device QA**

Per the spec's Testing section, this is the one part of the feature that genuinely can't be automated. With a handful of real sample logos (both SVG and PDF, including at least one with a counter like "O" or "A" to see the documented hole-detection gap for PDF in practice), check across Chrome, Firefox, Safari, mobile Safari, and Android Chrome:
- Both products, all config combinations (illumination × day/night × colors for Trimless; acrylic color × day/night for Cast Block Acrylic)
- The product-switching flow keeps the uploaded shapes
- Error messages for bad uploads (wrong format, oversized, un-outlined text, no vector content)
- The WebGL-unavailable fallback (can be forced by disabling hardware acceleration in a browser's settings, or using a browser flag, to confirm the fallback page actually appears rather than a broken canvas)

- [ ] **Step 4: Final commit**

If Step 3 surfaces any fixes, commit them individually as they're made, following the same small-commit pattern as the rest of this plan — there's no single "final" commit expected here beyond whatever Step 3 turns up.

---

**End of Chunk 5 — and the plan.** At this point the full feature is in place: upload an SVG or PDF logo, choose Trimless Letters or Cast Block Acrylic, see a photoreal-ish 3D preview with real configuration options, and reach the existing `/contact` quote flow — entirely client-side, with the parsing pipeline and config-UI logic fully unit-tested, the 3D rendering manually verified at every stage, and the two end-to-end smoke tests covering the full wiring between them.
