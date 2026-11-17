import type { ConfiguratorState } from "./types";
import type { ArtworkSource } from "./ArtworkSourceToggle";

/**
 * The sign being built, kept for this browser tab (owner, 2026-11-17: "when reloading the configurator, it goes back
 * to the product selection page. when clicking request quote and you turn back, it starts over"). sessionStorage: it
 * survives a reload and coming back from the quote form, and is gone when the tab closes. An uploaded logo is a file
 * and cannot be kept; the visitor is asked for it again, everything else stays.
 */
export interface ConfigDraft {
  state: ConfiguratorState;
  source: ArtworkSource;
  text: string;
  fontId: string;
}

const KEY = "sunlite-configurator-draft";

export function saveDraft(draft: ConfigDraft): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ v: 1, ...draft }));
  } catch {
    /* storage blocked or full: the page simply starts over next time */
  }
}

export function clearDraft(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}

/** The saved draft, or null when there is none or it cannot be read. Never throws. */
export function loadDraft(): ConfigDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<ConfigDraft> & { v?: number };
    if (d.v !== 1 || !d.state || typeof d.state.configId !== "string") return null;
    return {
      state: d.state,
      source: d.source === "upload" ? "upload" : "text",
      text: typeof d.text === "string" ? d.text : "",
      fontId: typeof d.fontId === "string" ? d.fontId : "",
    };
  } catch {
    return null;
  }
}
