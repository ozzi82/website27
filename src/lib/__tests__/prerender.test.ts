// Runs the prerender checks against the real build output. Needs `npm run build` first; skipped when there is none.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error plain .mjs script without type declarations
import { verifyPrerender, checkPage } from "../../../scripts/verify-prerender.mjs";

const root = path.resolve(__dirname, "../../..");
const built = fs.existsSync(path.join(root, "dist-ssr", "entry-server.js")) && fs.existsSync(path.join(root, "dist", "about", "index.html"));

describe("prerender verification", () => {
  it("rejects a page that still has the empty SPA shell", () => {
    const shell = `<html><head><title>x</title></head><body><div id="root"></div></body></html>`;
    expect(checkPage("/about", shell).errors.length).toBeGreaterThan(0);
  });

  it.skipIf(!built)("every prerendered page in dist/ passes", async () => {
    const { results, failed } = await verifyPrerender();
    const problems = results.filter((r: { errors: string[] }) => r.errors.length).map((r: { route: string; errors: string[] }) => `${r.route}: ${r.errors.join("; ")}`);
    expect(problems).toEqual([]);
    expect(failed).toBe(0);
    expect(results.length).toBeGreaterThanOrEqual(20);
  }, 30000);
});
