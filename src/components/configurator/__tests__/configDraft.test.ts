import { beforeEach, describe, expect, it } from "vitest";
import { clearDraft, loadDraft, saveDraft } from "../configDraft";
import { configurations } from "../../../data/configurations";
import { defaultStateFor } from "../types";

beforeEach(() => sessionStorage.clear());

describe("the sign kept for this tab (reload, back from the quote form)", () => {
  const state = { ...defaultStateFor(configurations[4]), sizeIn: 72 };

  it("comes back as it was saved", () => {
    saveDraft({ state, source: "text", text: "CAFE", fontId: "oswald" });
    expect(loadDraft()).toEqual({ state, source: "text", text: "CAFE", fontId: "oswald" });
  });

  it("is gone after clearing, and unreadable data is ignored", () => {
    saveDraft({ state, source: "upload", text: "", fontId: "montserrat" });
    clearDraft();
    expect(loadDraft()).toBeNull();
    sessionStorage.setItem("sunlite-configurator-draft", "{not json");
    expect(loadDraft()).toBeNull();
    sessionStorage.setItem("sunlite-configurator-draft", JSON.stringify({ v: 1, state: {} }));
    expect(loadDraft()).toBeNull();
  });
});
