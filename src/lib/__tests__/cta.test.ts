import { describe, expect, it } from "vitest";
import { CTA_PRIMARY, CTA_LINKS } from "../cta";

describe("CTA module", () => {
  it("has the single primary wording and target from the brief", () => {
    expect(CTA_PRIMARY.label.toUpperCase()).toBe("REQUEST WHOLESALE PRICING");
    expect(CTA_PRIMARY.to).toBe("/contact");
  });

  it("uses informational labels from the brief for secondary links", () => {
    expect(CTA_LINKS.viewChannelLetters.label.toUpperCase()).toBe("VIEW CHANNEL LETTERS");
    expect(CTA_LINKS.exploreUltraSlim.label.toUpperCase()).toBe("EXPLORE ULTRA-SLIM");
    expect(CTA_LINKS.viewAllProjects.label.toUpperCase()).toBe("VIEW ALL PROJECTS");
  });
});
