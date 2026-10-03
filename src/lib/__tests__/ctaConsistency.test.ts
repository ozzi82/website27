import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { RETIRED_CTA_LABELS } from "../cta";

const srcDir = path.resolve(__dirname, "../..");

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "__tests__" || e.name === "configurator" ? [] : sourceFiles(full);
    return /\.(ts|tsx)$/.test(e.name) ? [full] : [];
  });
}

// cta.ts defines the retired labels. The configurator folder is excluded by sourceFiles(): its hand-over buttons
// ("Get a Quote" before Phase 3) belong to the configurator, not to the site-wide primary action.
const exempt = new Set(["cta.ts", "ConfiguratorPage.tsx"]);

describe("CTA consistency", () => {
  it("no retired primary-CTA wording remains in site source", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(srcDir)) {
      if (exempt.has(path.basename(file))) continue;
      const text = fs.readFileSync(file, "utf8");
      for (const label of RETIRED_CTA_LABELS) {
        const asJsxText = new RegExp(`>\\s*${label}`);
        if (asJsxText.test(text) || text.includes(`"${label}"`) || text.includes(`'${label}'`)) {
          offenders.push(`${path.relative(srcDir, file)}: ${label}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
